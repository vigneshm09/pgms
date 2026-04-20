import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "").strip()
    database_name: str = os.getenv("DB_NAME", "pg_management").strip() or "pg_management"
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173").strip() or "http://localhost:5173"
    secret_key: str = os.getenv("SECRET_KEY", "pgms-dev-secret-change-me").strip() or "pgms-dev-secret-change-me"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    algorithm: str = "HS256"
    default_admin_name: str = os.getenv("DEFAULT_ADMIN_NAME", "System Admin").strip() or "System Admin"
    default_admin_email: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@pgms.local").strip() or "admin@pgms.local"
    default_admin_password: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123").strip() or "admin123"
    max_upload_size_bytes: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(5 * 1024 * 1024)))

    @property
    def uploads_dir(self) -> Path:
        return BASE_DIR / "uploads"

    @property
    def payment_uploads_dir(self) -> Path:
        return self.uploads_dir / "payments"

    @property
    def id_proof_uploads_dir(self) -> Path:
        return self.uploads_dir / "id-proofs"

    @property
    def qr_uploads_dir(self) -> Path:
        return self.uploads_dir / "qr"


settings = Settings()


def ensure_upload_directories() -> None:
    settings.uploads_dir.mkdir(exist_ok=True)
    settings.payment_uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.id_proof_uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.qr_uploads_dir.mkdir(parents=True, exist_ok=True)

