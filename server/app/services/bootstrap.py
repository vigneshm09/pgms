from app.config import ensure_upload_directories, settings
from app.database import ensure_indexes, get_database
from app.security import hash_password
from app.services.pg import now_iso


def seed_default_admin(database) -> None:
    existing = database.users.find_one({"email": settings.default_admin_email.lower()})
    if existing:
        return

    database.users.insert_one(
        {
            "name": settings.default_admin_name,
            "email": settings.default_admin_email.lower(),
            "password_hash": hash_password(settings.default_admin_password),
            "role": "ADMIN",
            "room_number": None,
            "created_at": now_iso(),
        }
    )


def migrate_legacy_admins(database) -> None:
    if "admins" not in database.list_collection_names():
        return

    for admin in database.admins.find():
        username = (admin.get("username") or "").strip().lower()
        if not username:
            continue

        candidate_email = (admin.get("email") or f"{username}@pgms.local").strip().lower()
        existing_user = database.users.find_one({"email": candidate_email})
        if existing_user:
            continue

        database.users.insert_one(
            {
                "name": admin.get("full_name") or username.title(),
                "email": candidate_email,
                "password_hash": hash_password(admin.get("password", settings.default_admin_password)),
                "role": "ADMIN",
                "room_number": None,
                "created_at": now_iso(),
                "legacy_admin_id": str(admin["_id"]),
            }
        )


def bootstrap_application() -> None:
    ensure_upload_directories()
    database = get_database()
    if database is None:
        return

    ensure_indexes(database)
    seed_default_admin(database)
    migrate_legacy_admins(database)

