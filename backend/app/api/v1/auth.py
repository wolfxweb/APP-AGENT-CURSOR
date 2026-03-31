from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.reset_token import create_password_reset_token, parse_password_reset_token
from app.core.security import create_access_token, hash_password, verify_password
from app.models.license import License
from app.models.user import User
from app.schemas.auth import LoginBody, OnboardingBody, RegisterBody
from app.schemas.password_reset import ForgotPasswordBody, ResetPasswordBody
from app.schemas.user import UserOut
from app.services.mail import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterBody, db: DbSession, response: Response) -> User:
    lic: License | None = None
    key = body.activation_key.strip().upper().replace(" ", "")

    if settings.skip_activation_license_check:
        if not key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe a chave de ativação",
            )
    else:
        if len(key) != 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A chave de ativação deve ter exatamente 8 caracteres",
            )
        lic_result = await db.execute(select(License).where(License.activation_key == key))
        lic = lic_result.scalar_one_or_none()
        if lic is None or lic.status != "Disponível":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chave de ativação inválida ou já utilizada",
            )

    user = User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        whatsapp=body.whatsapp,
        activity_type=body.activity_type,
        gender=body.gender,
        birth_day=body.birth_day,
        birth_month=body.birth_month,
        married=body.married,
        children=body.children,
        grandchildren=body.grandchildren,
        cep=body.cep,
        street=body.street,
        neighborhood=body.neighborhood,
        state=body.state,
        city=body.city,
        complement=body.complement,
        company_activity=body.activity_type,
        specialty_area=body.specialty_area.strip(),
        hashed_password=hash_password(body.password),
        status="Ativo",
        access_level="Cliente",
        onboarding_completed=False,
        ja_acessou=False,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado",
        ) from None

    if lic is not None:
        lic.status = "Utilizada"
        lic.activation_date = datetime.now(UTC)
        lic.activation_email = user.email
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.email)
    _set_auth_cookie(response, token)
    return user


@router.post("/login", response_model=UserOut)
async def login(body: LoginBody, db: DbSession, response: Response) -> User:
    result = await db.execute(
        select(User).where(User.email == body.email.lower().strip())
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )
    if user.status != "Ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta inativa",
        )
    user.ja_acessou = True
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.email)
    _set_auth_cookie(response, token)
    return user


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    _clear_auth_cookie(response)
    return {"detail": "Sessão encerrada"}


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user


@router.post("/onboarding", response_model=UserOut)
async def onboarding(
    body: OnboardingBody,
    db: DbSession,
    user: CurrentUser,
) -> User:
    if user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding já concluído",
        )
    user.ideal_profit_margin = body.ideal_profit_margin
    user.service_capacity = body.service_capacity
    user.onboarding_completed = True
    await db.commit()
    await db.refresh(user)
    return user


_FORGOT_OK_MESSAGE = (
    "Se existir cadastro com este e-mail, enviaremos instruções em instantes."
)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody, db: DbSession) -> dict[str, str]:
    result = await db.execute(
        select(User).where(User.email == body.email.lower().strip())
    )
    user = result.scalar_one_or_none()
    if user is None or user.status != "Ativo":
        return {"detail": _FORGOT_OK_MESSAGE}

    token = create_password_reset_token(user.email)
    base = settings.app_url.rstrip("/")
    reset_link = f"{base}/auth/reset-password?token={token}"
    await send_password_reset_email(user.email, reset_link)
    return {"detail": _FORGOT_OK_MESSAGE}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordBody,
    db: DbSession,
) -> dict[str, str]:
    email = parse_password_reset_token(body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link inválido ou expirado",
        )
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link inválido ou expirado",
        )
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"detail": "Senha atualizada. Você já pode entrar."}
