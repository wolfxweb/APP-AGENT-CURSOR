import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.models.task import Task
from app.db.session import get_db
from app.main import app


class FakeAsyncSession:
    def __init__(self, tasks: list[Task] | None = None) -> None:
        self._tasks = {task.id: task for task in (tasks or [])}

    async def get(self, _model, task_id):
        return self._tasks.get(task_id)

    async def commit(self) -> None:
        return None

    async def refresh(self, instance) -> None:
        instance.updated_at = datetime.now(timezone.utc)


def _build_task(title: str, is_completed: bool) -> Task:
    task = Task(title=title)
    now = datetime.now(timezone.utc)
    task.id = uuid.uuid4()
    task.is_completed = is_completed
    task.created_at = now
    task.updated_at = now
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


def test_patch_task_mark_completed(client_factory) -> None:
    task = _build_task("Tarefa", is_completed=False)
    client = client_factory(FakeAsyncSession(tasks=[task]))

    response = client.patch(f"/api/tasks/{task.id}", json={"is_completed": True})

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(task.id)
    assert payload["is_completed"] is True


def test_patch_task_reopen(client_factory) -> None:
    task = _build_task("Tarefa", is_completed=True)
    client = client_factory(FakeAsyncSession(tasks=[task]))

    response = client.patch(f"/api/tasks/{task.id}", json={"is_completed": False})

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(task.id)
    assert payload["is_completed"] is False


def test_patch_task_update_title_with_trim(client_factory) -> None:
    task = _build_task("Titulo antigo", is_completed=False)
    client = client_factory(FakeAsyncSession(tasks=[task]))

    response = client.patch(f"/api/tasks/{task.id}", json={"title": "  Novo titulo  "})

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(task.id)
    assert payload["title"] == "Novo titulo"
    assert payload["is_completed"] is False


def test_patch_task_invalid_title_returns_422(client_factory) -> None:
    task = _build_task("Titulo valido", is_completed=False)
    client = client_factory(FakeAsyncSession(tasks=[task]))

    response = client.patch(f"/api/tasks/{task.id}", json={"title": "   "})

    assert response.status_code == 422


def test_patch_task_not_found_returns_404(client_factory) -> None:
    client = client_factory(FakeAsyncSession(tasks=[]))

    response = client.patch(f"/api/tasks/{uuid.uuid4()}", json={"is_completed": True})

    assert response.status_code == 404
