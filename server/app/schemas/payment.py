import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


class PaymentUploadPayload(BaseModel):
    amount: float = Field(..., gt=0)
    month: str = Field(..., min_length=7, max_length=7)
    transaction_id: Optional[str] = Field(default=None, max_length=120)

    @field_validator("month")
    @classmethod
    def validate_month(cls, value: str) -> str:
        normalized = value.strip()
        if not MONTH_PATTERN.match(normalized):
            raise ValueError("Month must be in YYYY-MM format.")
        return normalized

    @field_validator("transaction_id", mode="before")
    @classmethod
    def normalize_transaction_id(cls, value):
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

