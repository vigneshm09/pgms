from typing import Any, Dict, List, Optional

from app.services.pg import build_bed_labels, get_floor_name
from app.services.uploads import build_upload_url


def serialize_floor(floor: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(floor["_id"]),
        "name": floor["name"],
        "order": floor["order"],
    }


def serialize_room(
    room: Dict[str, Any],
    floors_lookup: Dict[str, Dict[str, Any]],
    bed_assignments: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    bed_labels = build_bed_labels(room)
    room_key = str(room["_id"])
    bed_items: List[Dict[str, Any]] = []

    for bed_label in bed_labels:
        assignment = bed_assignments.get(f"{room_key}:{bed_label}")
        bed_items.append(
            {
                "bed_number": bed_label,
                "status": "Occupied" if assignment else "Available",
                "tenant_id": assignment["tenant_id"] if assignment else None,
                "tenant_user_id": assignment["tenant_user_id"] if assignment else None,
                "tenant_name": assignment["tenant_name"] if assignment else None,
            }
        )

    occupied_count = sum(1 for bed in bed_items if bed["status"] == "Occupied")
    capacity = len(bed_items)

    return {
        "id": str(room["_id"]),
        "room_number": room["room_number"],
        "floor_id": str(room["floor_id"]) if room.get("floor_id") else None,
        "floor_name": get_floor_name(room.get("floor_id"), floors_lookup),
        "capacity": capacity,
        "occupants": occupied_count,
        "available_beds": max(capacity - occupied_count, 0),
        "is_available": occupied_count < capacity,
        "beds": bed_items,
    }


def serialize_auth_user(user: Dict[str, Any], tenant: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    room_number = user.get("room_number")
    if not room_number and tenant:
        room_number = tenant.get("room_number")

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "room_number": room_number,
        "created_at": user.get("created_at"),
    }


def serialize_tenant(
    tenant: Dict[str, Any],
    user: Optional[Dict[str, Any]] = None,
    room: Optional[Dict[str, Any]] = None,
    floors_lookup: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    room_id = tenant.get("room_id")
    floor_name = None
    if room and floors_lookup is not None:
        floor_name = get_floor_name(room.get("floor_id"), floors_lookup)

    return {
        "id": str(tenant["_id"]),
        "user_id": str(tenant["user_id"]) if tenant.get("user_id") else None,
        "name": tenant["name"],
        "email": (user or {}).get("email") or tenant.get("email"),
        "phone": tenant["phone"],
        "address": tenant.get("address", ""),
        "profession": tenant.get("profession", ""),
        "join_date": tenant.get("join_date"),
        "emergency_contact": tenant.get("emergency_contact", ""),
        "id_proof_number": tenant.get("id_proof_number", ""),
        "id_proof_name": tenant.get("id_proof_name"),
        "id_proof_url": build_upload_url(tenant.get("id_proof_file")),
        "room_id": str(room_id) if room_id else None,
        "room_number": room.get("room_number") if room else tenant.get("room_number"),
        "floor_name": floor_name,
        "bed_number": tenant.get("bed_number"),
        "rent": tenant["rent"],
        "payment_status": tenant.get("payment_status", "PENDING"),
        "last_payment_month": tenant.get("last_payment_month"),
        "created_at": tenant.get("created_at"),
    }


def serialize_notice(notice: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(notice["_id"]),
        "title": notice["title"],
        "content": notice["content"],
        "created_at": notice["created_at"],
        "updated_at": notice.get("updated_at"),
    }


def serialize_payment(
    payment: Dict[str, Any],
    tenant: Optional[Dict[str, Any]] = None,
    tenant_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "id": str(payment["_id"]),
        "tenant_id": str(payment["tenant_id"]),
        "tenant_name": tenant["name"] if tenant else None,
        "tenant_email": tenant_user["email"] if tenant_user else None,
        "room_number": tenant.get("room_number") if tenant else None,
        "amount": payment["amount"],
        "month": payment["month"],
        "screenshot_url": build_upload_url(payment["screenshot_file"]),
        "transaction_id": payment.get("transaction_id"),
        "status": payment["status"],
        "admin_note": payment.get("admin_note"),
        "created_at": payment["created_at"],
        "updated_at": payment.get("updated_at"),
    }


def serialize_message(
    message: Dict[str, Any],
    user_lookup: Dict[str, Dict[str, Any]],
    current_user_id: str,
) -> Dict[str, Any]:
    sender = user_lookup.get(str(message["sender_id"]), {})
    receiver = user_lookup.get(str(message["receiver_id"]), {})
    direction = "sent" if str(message["sender_id"]) == current_user_id else "received"

    return {
        "id": str(message["_id"]),
        "sender_id": str(message["sender_id"]),
        "sender_name": sender.get("name"),
        "receiver_id": str(message["receiver_id"]),
        "receiver_name": receiver.get("name"),
        "message": message["message"],
        "timestamp": message["timestamp"],
        "direction": direction,
    }


def serialize_message_thread(
    partner: Dict[str, Any],
    latest_message: Optional[Dict[str, Any]],
    unread_count: int = 0,
) -> Dict[str, Any]:
    return {
        "user_id": str(partner["_id"]),
        "name": partner["name"],
        "email": partner["email"],
        "role": partner["role"],
        "room_number": partner.get("room_number"),
        "latest_message": latest_message.get("message") if latest_message else None,
        "latest_timestamp": latest_message.get("timestamp") if latest_message else None,
        "unread_count": unread_count,
    }

