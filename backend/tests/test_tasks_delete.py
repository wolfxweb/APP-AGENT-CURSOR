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
        self.deleted_ids: list[uuid.UUID] = []

    async def get(self, _model, task_id):
        return self._tasks.get(task_id)

    async def delete(self, instance) -> None:
        self.deleted_ids.append(instance.id)
        self._tasks.pop(instance.id, None)

    async def commit(self) -> None:
        return None


def _build_task(title: str) -> Task:
    task = Task(title=title)
    now = datetime.now(timezone.utc)
    task.id = uuid.uuid4()
    task.is_completed = False
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


def test_delete_task_success_returns_204(client_factory) -> None:
    task = _build_task("Tarefa para excluir")
    fake_session = FakeAsyncSession(tasks=[task])
    client = client_factory(fake_session)

    response = client.delete(f"/api/tasks/{task.id}")

    assert response.status_code == 204
    assert response.text == ""
    assert fake_session.deleted_ids == [task.id]


def test_delete_task_not_found_returns_404(client_factory) -> None:
    client = client_factory(FakeAsyncSession(tasks=[]))

    response = client.delete(f"/api/tasks/{uuid.uuid4()}")

    assert response.status_code == 404
