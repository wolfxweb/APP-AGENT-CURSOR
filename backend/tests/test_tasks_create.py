import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app


class FakeAsyncSession:
    def __init__(self) -> None:
        self._stored = []

    def add(self, instance) -> None:
        self._stored.append(instance)

    async def commit(self) -> None:
        return None

    async def refresh(self, instance) -> None:
        if getattr(instance, "id", None) is None:
            instance.id = uuid.uuid4()
        if getattr(instance, "is_completed", None) is None:
            instance.is_completed = False
        now = datetime.now(timezone.utc)
        if getattr(instance, "created_at", None) is None:
            instance.created_at = now
        if getattr(instance, "updated_at", None) is None:
            instance.updated_at = now


@pytest.fixture
def client() -> TestClient:
    fake_session = FakeAsyncSession()

    async def override_get_db():
        yield fake_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def test_create_task_success(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "  Primeira tarefa  "})

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == "Primeira tarefa"
    assert payload["is_completed"] is False
    assert "id" in payload
    assert payload["created_at"]
    assert payload["updated_at"]


@pytest.mark.parametrize("invalid_title", ["", "   "])
def test_create_task_invalid_title_returns_422(client: TestClient, invalid_title: str) -> None:
    response = client.post("/api/tasks", json={"title": invalid_title})

    assert response.status_code == 422
