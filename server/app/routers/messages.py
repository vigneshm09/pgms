from typing import Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import ensure_database, get_authenticated_user
from app.schemas.message import MessageSend
from app.services.pg import build_user_lookup, now_iso, to_object_id
from app.services.serializers import serialize_message, serialize_message_thread


router = APIRouter(tags=["messages"])


def get_admin_account(database) -> Dict:
    admin = database.users.find_one({"role": "ADMIN"}, sort=[("created_at", 1)])
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No admin account is available.")
    return admin


@router.get("/messages/threads")
def get_message_threads(current_user: dict = Depends(get_authenticated_user)):
    database = ensure_database()

    if current_user["role"] == "TENANT":
        admin = get_admin_account(database)
        latest_message = database.messages.find_one(
            {"participants": {"$all": [str(current_user["_id"]), str(admin["_id"])]}},
            sort=[("timestamp", -1)],
        )
        return [serialize_message_thread(admin, latest_message)]

    tenant_users = list(database.users.find({"role": "TENANT"}).sort("name", 1))
    threads: List[Dict] = []
    for tenant_user in tenant_users:
        latest_message = database.messages.find_one(
            {"participants": {"$all": [str(current_user["_id"]), str(tenant_user["_id"])]}},
            sort=[("timestamp", -1)],
        )
        threads.append(serialize_message_thread(tenant_user, latest_message))

    return threads


@router.post("/messages/send")
def send_message(payload: MessageSend, current_user: dict = Depends(get_authenticated_user)):
    database = ensure_database()
    receiver = database.users.find_one({"_id": to_object_id(payload.receiver_id)})
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found.")

    if current_user["role"] == receiver["role"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages are only supported between admin and tenant accounts.",
        )

    message_document = {
        "sender_id": current_user["_id"],
        "receiver_id": receiver["_id"],
        "participants": sorted([str(current_user["_id"]), str(receiver["_id"])]),
        "message": payload.message,
        "timestamp": now_iso(),
    }
    inserted = database.messages.insert_one(message_document)
    created = database.messages.find_one({"_id": inserted.inserted_id})
    users = build_user_lookup(database)
    return serialize_message(created, users, str(current_user["_id"]))


@router.get("/messages/{user_id}")
def get_conversation(user_id: str, current_user: dict = Depends(get_authenticated_user)):
    database = ensure_database()
    partner = database.users.find_one({"_id": to_object_id(user_id)})
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if current_user["role"] == partner["role"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation is only available between admin and tenant accounts.",
        )

    messages = list(
        database.messages.find(
            {
                "participants": sorted([str(current_user["_id"]), str(partner["_id"])]),
            }
        ).sort("timestamp", 1)
    )
    users = build_user_lookup(database)
    return [serialize_message(message, users, str(current_user["_id"])) for message in messages]

