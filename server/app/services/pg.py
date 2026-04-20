from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import ReturnDocument


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format.")
    return ObjectId(value)


def build_bed_labels(room: Dict[str, Any]) -> List[str]:
    existing_beds = room.get("beds")
    if isinstance(existing_beds, list) and existing_beds:
        return existing_beds

    capacity = int(room.get("capacity", 0) or 0)
    return [f"Bed {index}" for index in range(1, capacity + 1)]


def get_floor_name(floor_id: Optional[ObjectId], floors_lookup: Dict[str, Dict[str, Any]]) -> str:
    if not floor_id:
        return "Unassigned Floor"

    floor = floors_lookup.get(str(floor_id))
    return floor["name"] if floor else "Unassigned Floor"


def build_floor_lookup(database) -> Dict[str, Dict[str, Any]]:
    return {str(floor["_id"]): floor for floor in database.floors.find()}


def build_room_lookup(database) -> Dict[str, Dict[str, Any]]:
    return {str(room["_id"]): room for room in database.rooms.find()}


def build_user_lookup(database) -> Dict[str, Dict[str, Any]]:
    return {str(user["_id"]): user for user in database.users.find()}


def build_bed_assignments(database) -> Dict[str, Dict[str, Any]]:
    assignments: Dict[str, Dict[str, Any]] = {}

    for tenant in database.tenants.find():
        room_id = tenant.get("room_id")
        bed_number = tenant.get("bed_number")
        if room_id and bed_number:
            assignments[f"{room_id}:{bed_number}"] = {
                "tenant_id": str(tenant["_id"]),
                "tenant_user_id": str(tenant["user_id"]) if tenant.get("user_id") else None,
                "tenant_name": tenant["name"],
            }

    return assignments


def ensure_floor_exists(database, floor_id: str) -> Dict[str, Any]:
    floor = database.floors.find_one({"_id": to_object_id(floor_id)})
    if not floor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected floor was not found.")
    return floor


def ensure_room_bed_available(
    database,
    room_id: Optional[str],
    bed_number: Optional[str],
    current_tenant_id: Optional[ObjectId] = None,
) -> Optional[Dict[str, Any]]:
    if not room_id:
        return None

    room = database.rooms.find_one({"_id": to_object_id(room_id)})
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected room was not found.")

    bed_labels = build_bed_labels(room)
    if not bed_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a bed for the selected room.",
        )

    if bed_number not in bed_labels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected bed does not exist in the room.",
        )

    tenant_query: Dict[str, Any] = {"room_id": room["_id"], "bed_number": bed_number}
    if current_tenant_id:
        tenant_query["_id"] = {"$ne": current_tenant_id}

    existing_tenant = database.tenants.find_one(tenant_query)
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected bed is already occupied.",
        )

    return room


def get_setting(database, key: str) -> Optional[Dict[str, Any]]:
    return database.settings.find_one({"key": key})


def set_setting(database, key: str, value: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "key": key,
        "value": value,
        "updated_at": now_iso(),
    }
    return database.settings.find_one_and_update(
        {"key": key},
        {"$set": payload},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

