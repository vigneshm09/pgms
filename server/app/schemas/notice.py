from pydantic import BaseModel, Field


class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    content: str = Field(..., min_length=5, max_length=5000)


class NoticeUpdate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    content: str = Field(..., min_length=5, max_length=5000)

