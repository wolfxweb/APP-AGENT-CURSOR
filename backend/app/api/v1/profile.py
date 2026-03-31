from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.profile import ProfileUpdateBody
from app.schemas.user import UserOut

router = APIRouter(prefix="/profile", tags=["profile"])


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


@router.get("/me", response_model=UserOut)
async def get_profile(user: CurrentUser) -> User:
    return user


@router.put("/me", response_model=UserOut)
async def update_profile(
    body: ProfileUpdateBody,
    db: DbSession,
    user: CurrentUser,
    response: Response,
) -> User:
    new_email = body.email.lower().strip()
    email_changed = new_email != user.email
    user.name = body.name.strip()
    user.whatsapp = body.whatsapp.strip()
    user.activity_type = body.activity_type
    user.gender = body.gender
    user.birth_day = body.birth_day
    user.birth_month = body.birth_month
    user.married = body.married
    user.children = body.children
    user.grandchildren = body.grandchildren
    user.cep = body.cep
    user.street = body.street
    user.neighborhood = body.neighborhood
    user.state = body.state
    user.city = body.city
    user.complement = body.complement
    user.company_activity = body.company_activity
    user.specialty_area = body.specialty_area
    user.ideal_profit_margin = body.ideal_profit_margin
    user.service_capacity = body.service_capacity
    user.email = new_email

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já em uso",
        ) from None
    await db.refresh(user)

    if email_changed:
        token = create_access_token(subject=user.email)
        _set_auth_cookie(response, token)
    return user
