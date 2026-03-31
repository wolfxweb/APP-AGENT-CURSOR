import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker

import app.services.license_service as license_service
from app.services.license_service import create_license_with_retry, generate_activation_key


def test_generate_activation_key_shape() -> None:
    key = generate_activation_key()
    assert len(key) == 8
    assert key.isalnum()
    assert key.upper() == key


@pytest.mark.asyncio
async def test_create_license_with_retry_handles_collision(
    session_factory: async_sessionmaker,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    keys = iter(["TEST1234", "ZXCV5678"])

    def _fake_gen(_length: int = 8) -> str:
        return next(keys)

    monkeypatch.setattr(license_service, "generate_activation_key", _fake_gen)

    async with session_factory() as s:
        lic = await create_license_with_retry(s, attempts=4)
        assert lic.activation_key == "ZXCV5678"
        assert lic.status == "Disponível"
