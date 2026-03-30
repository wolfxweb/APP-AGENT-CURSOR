from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.task import Task
from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


@router.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)) -> Task:
    task = Task(title=payload.title)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/api/tasks", response_model=list[TaskResponse], status_code=status.HTTP_200_OK)
async def list_tasks(db: AsyncSession = Depends(get_db)) -> list[Task]:
    statement = select(Task).order_by(Task.created_at.desc())
    result = await db.execute(statement)
    return list(result.scalars().all())


@router.patch("/api/tasks/{id}", response_model=TaskResponse, status_code=status.HTTP_200_OK)
async def update_task(id: UUID, payload: TaskUpdate, db: AsyncSession = Depends(get_db)) -> Task:
    task = await db.get(Task, id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa nao encontrada")

    updates = payload.model_dump(exclude_unset=True)
    if "title" in updates:
        task.title = updates["title"]
    if "is_completed" in updates:
        task.is_completed = updates["is_completed"]

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/api/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    task = await db.get(Task, id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa nao encontrada")

    await db.delete(task)
    await db.commit()
