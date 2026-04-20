from pydantic import BaseModel, Field, field_validator


class MessageSend(BaseModel):
    receiver_id: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=1, max_length=4000)

    @field_validator("message")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        return value.strip()

