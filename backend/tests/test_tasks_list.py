import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.models.task import Task
from app.db.session import get_db
from app.main import app


class _FakeScalars:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


class _FakeResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return _FakeScalars(self._items)


class FakeAsyncSession:
    def __init__(self, items: list[Task] | None = None) -> None:
        self._items = items or []

    async def execute(self, _statement):
        ordered = sorted(self._items, key=lambda item: item.created_at, reverse=True)
        return _FakeResult(ordered)


def _build_task(title: str, created_at: datetime) -> Task:
    task = Task(title=title)
    task.id = uuid.uuid4()
    task.is_completed = False
    task.created_at = created_at
    task.updated_at = created_at
    return task


@pytest.fixture
def client_factory():
    created_clients: list[TestClient] = []

    def _build_client(fake_session: FakeAsyncSession) -> TestClient:
        async def override_get_db():
            yield fake_session

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)
        created_clients.append(client)
        return client

    yield _build_client
    for test_client in created_clients:
        test_client.close()
    app.dependency_overrides.clear()


def test_list_tasks_returns_empty_list(client_factory) -> None:
    client = client_factory(FakeAsyncSession(items=[]))

    response = client.get("/api/tasks")

    assert response.status_code == 200
    assert response.json() == []


def test_list_tasks_returns_items_ordered_by_created_at_desc(client_factory) -> None:
    now = datetime.now(timezone.utc)
    old_task = _build_task("Mais antiga", now - timedelta(days=2))
    mid_task = _build_task("Intermediaria", now - timedelta(days=1))
    new_task = _build_task("Mais nova", now)

    client = client_factory(FakeAsyncSession(items=[mid_task, old_task, new_task]))

    response = client.get("/api/tasks")

    assert response.status_code == 200
    payload = response.json()
    assert [item["title"] for item in payload] == ["Mais nova", "Intermediaria", "Mais antiga"]
