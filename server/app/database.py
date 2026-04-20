from typing import Optional

from pymongo import ASCENDING, DESCENDING, MongoClient

from app.config import settings


_client: Optional[MongoClient] = None


def get_database():
    global _client

    if not settings.mongo_uri:
        return None

    if _client is None:
        _client = MongoClient(settings.mongo_uri)

    return _client[settings.database_name]


def ensure_indexes(database) -> None:
    database.users.create_index([("email", ASCENDING)], unique=True)
    database.users.create_index([("role", ASCENDING)])
    database.users.create_index([("tenant_profile_id", ASCENDING)], unique=True, sparse=True)

    database.tenants.create_index([("user_id", ASCENDING)], unique=True, sparse=True)
    database.tenants.create_index([("name", ASCENDING)])
    database.tenants.create_index([("room_id", ASCENDING)])

    database.floors.create_index([("name", ASCENDING)], unique=True)
    database.floors.create_index([("order", ASCENDING)], unique=True)

    database.rooms.create_index([("room_number", ASCENDING)], unique=True)
    database.rooms.create_index([("floor_id", ASCENDING)])

    database.payments.create_index([("tenant_id", ASCENDING), ("month", DESCENDING)])
    database.payments.create_index([("status", ASCENDING), ("created_at", DESCENDING)])

    database.notices.create_index([("created_at", DESCENDING)])

    database.messages.create_index([("participants", ASCENDING), ("timestamp", DESCENDING)])
    database.messages.create_index([("sender_id", ASCENDING), ("receiver_id", ASCENDING), ("timestamp", DESCENDING)])

    database.settings.create_index([("key", ASCENDING)], unique=True)

