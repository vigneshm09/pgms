import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def save_image_upload(file: UploadFile, target_dir: Path) -> str:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please choose an image to upload.")

    extension = Path(file.filename).suffix.lower()
    content_type = (file.content_type or "").lower()

    if extension not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG and PNG image uploads are allowed.",
        )

    file_bytes = file.file.read(settings.max_upload_size_bytes + 1)
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size must be under {settings.max_upload_size_bytes // (1024 * 1024)} MB.",
        )

    stored_name = f"{uuid.uuid4().hex}{extension}"
    target_path = target_dir / stored_name
    target_path.write_bytes(file_bytes)

    return str(target_path.relative_to(settings.uploads_dir)).replace("\\", "/")


def remove_upload(relative_path: str | None) -> None:
    if not relative_path:
        return

    target_path = settings.uploads_dir / relative_path
    if target_path.exists():
        target_path.unlink()


def build_upload_url(relative_path: str | None) -> str | None:
    if not relative_path:
        return None
    normalized_path = relative_path.replace("\\", "/")
    return f"/uploads/{normalized_path}"
