from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.auth import EMAIL_PATTERN


class FloorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order: int = Field(..., ge=0, le=100)


class RoomCreate(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=20)
    floor_id: str = Field(..., min_length=1, max_length=50)
    capacity: int = Field(..., ge=1, le=20)


class AddBedsCreate(BaseModel):
    count: int = Field(..., ge=1, le=20)


class TenantUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    address: Optional[str] = Field(default=None, min_length=5, max_length=250)
    profession: Optional[str] = Field(default=None, min_length=2, max_length=80)
    join_date: Optional[date] = Field(default=None)
    emergency_contact: Optional[str] = Field(default="")
    id_proof_number: Optional[str] = Field(default="")
    room_id: Optional[str] = Field(default=None)
    bed_number: Optional[str] = Field(default=None)
    rent: Optional[float] = Field(default=None, gt=0)
    payment_status: Optional[str] = Field(default=None)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if value is None:
            return value
        cleaned = value.replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Phone must contain only numbers, spaces, + or -.")
        return value.strip()

    @field_validator("emergency_contact")
    @classmethod
    def validate_emergency_contact(cls, value):
        value = (value or "").strip()
        if not value:
            return ""

        cleaned = value.replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Emergency contact must contain only numbers, spaces, + or -.")
        return value

    @field_validator("room_id", "bed_number", "id_proof_number", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    phone: str = Field(..., min_length=7, max_length=20)
    address: str = Field(..., min_length=5, max_length=250)
    profession: str = Field(..., min_length=2, max_length=80)
    join_date: date
    emergency_contact: Optional[str] = Field(default="")
    id_proof_number: Optional[str] = Field(default="")
    room_id: Optional[str] = Field(default=None)
    bed_number: Optional[str] = Field(default=None)
    rent: float = Field(..., gt=0)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = value.replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Phone must contain only numbers, spaces, + or -.")
        return value.strip()

    @field_validator("emergency_contact")
    @classmethod
    def validate_emergency_contact(cls, value: Optional[str]) -> str:
        value = (value or "").strip()
        if not value:
            return ""

        cleaned = value.replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Emergency contact must contain only numbers, spaces, + or -.")
        return value

    @field_validator("room_id", "bed_number", "id_proof_number", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

