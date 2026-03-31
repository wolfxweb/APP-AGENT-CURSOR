from __future__ import annotations

import secrets
import string

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.license import License

_KEY_ALPHABET = string.ascii_uppercase + string.digits


def generate_activation_key(length: int = 8) -> str:
    return "".join(secrets.choice(_KEY_ALPHABET) for _ in range(length))


async def create_license_with_retry(
    db: AsyncSession,
    *,
    attempts: int = 8,
) -> License:
    last_error: Exception | None = None
    for _ in range(max(1, attempts)):
        lic = License(
            activation_key=generate_activation_key(8),
            status="Disponível",
            activation_date=None,
            activation_email=None,
        )
        db.add(lic)
        try:
            await db.commit()
            await db.refresh(lic)
            return lic
        except IntegrityError as ex:
            last_error = ex
            await db.rollback()
    raise RuntimeError("Falha ao gerar chave única de licença") from last_error
