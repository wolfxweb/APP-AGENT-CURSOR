from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import settings


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(
        settings.secret_key,
        salt="appgetup-password-reset",
    )


def create_password_reset_token(email: str) -> str:
    email_norm = email.lower().strip()
    return _serializer().dumps({"email": email_norm})


def parse_password_reset_token(token: str) -> str | None:
    try:
        data = _serializer().loads(
            token, max_age=settings.password_reset_token_max_age
        )
        email = data.get("email")
        return str(email).lower().strip() if email else None
    except (SignatureExpired, BadSignature, TypeError, ValueError):
        return None
