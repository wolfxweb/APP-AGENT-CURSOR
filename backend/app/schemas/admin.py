from datetime import datetime

from pydantic import BaseModel, Field


class AdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    activity_type: str
    status: str
    access_level: str
    created_at: datetime


class AdminUsersPageOut(BaseModel):
    items: list[AdminUserOut]
    page: int
    page_size: int = Field(..., ge=1, le=100)
    total: int


class AdminUserPatchIn(BaseModel):
    status: str | None = None
    access_level: str | None = None


class AdminLicenseOut(BaseModel):
    id: int
    activation_key: str
    status: str
    activation_email: str | None
    activation_date: datetime | None
    created_at: datetime


class AdminLicenseCreateOut(BaseModel):
    id: int
    activation_key: str
    status: str
