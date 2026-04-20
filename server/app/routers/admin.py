from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pymongo import ReturnDocument

from app.config import settings
from app.dependencies import ensure_database, get_admin_user
from app.schemas.admin import AdminCreate
from app.schemas.pg import AddBedsCreate, FloorCreate, RoomCreate, TenantCreate, TenantUpdate
from app.security import hash_password
from app.services.pg import (
    build_bed_assignments,
    build_floor_lookup,
    build_room_lookup,
    build_user_lookup,
    ensure_floor_exists,
    ensure_room_bed_available,
    now_iso,
    set_setting,
    to_object_id,
)
from app.services.serializers import (
    serialize_auth_user,
    serialize_floor,
    serialize_room,
    serialize_tenant,
)
from app.services.uploads import remove_upload, save_image_upload


router = APIRouter(tags=["admin"])


@router.get("/admins")
def get_admins(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    admins = [
        serialize_auth_user(admin)
        for admin in database.users.find({"role": "ADMIN"}).sort("created_at", 1)
    ]
    return admins


@router.post("/admins")
def add_admin(payload: AdminCreate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    existing_admin = database.users.find_one({"email": payload.email})
    if existing_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")

    inserted = database.users.insert_one(
        {
            "name": payload.name.strip(),
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": "ADMIN",
            "room_number": None,
            "created_at": now_iso(),
        }
    )
    created = database.users.find_one({"_id": inserted.inserted_id})
    return serialize_auth_user(created)


@router.get("/tenants")
def get_tenants(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    rooms = build_room_lookup(database)
    users = build_user_lookup(database)
    floors_lookup = build_floor_lookup(database)
    tenants = []

    for tenant in database.tenants.find().sort("name", 1):
        room = rooms.get(str(tenant.get("room_id"))) if tenant.get("room_id") else None
        user = users.get(str(tenant.get("user_id"))) if tenant.get("user_id") else None
        tenants.append(serialize_tenant(tenant, user, room, floors_lookup))

    return tenants


@router.post("/tenants")
async def add_tenant(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    profession: str = Form(...),
    join_date: str = Form(...),
    emergency_contact: str = Form(""),
    id_proof_number: str = Form(""),
    room_id: str = Form(""),
    bed_number: str = Form(""),
    rent: float = Form(...),
    id_proof: UploadFile | None = File(default=None),
    _: dict = Depends(get_admin_user),
):
    database = ensure_database()

    payload = TenantCreate(
        name=name,
        email=email,
        password=password,
        phone=phone,
        address=address,
        profession=profession,
        join_date=join_date,
        emergency_contact=emergency_contact,
        id_proof_number=id_proof_number,
        room_id=room_id or None,
        bed_number=bed_number or None,
        rent=rent,
    )

    if database.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")

    room_document = ensure_room_bed_available(database, payload.room_id, payload.bed_number)

    stored_proof_name = None
    if id_proof and id_proof.filename:
        stored_proof_name = save_image_upload(id_proof, settings.id_proof_uploads_dir)

    user_insert = database.users.insert_one(
        {
            "name": payload.name.strip(),
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": "TENANT",
            "room_number": room_document["room_number"] if room_document else None,
            "created_at": now_iso(),
        }
    )

    tenant_document = {
        "user_id": user_insert.inserted_id,
        "name": payload.name.strip(),
        "email": payload.email,
        "phone": payload.phone.strip(),
        "address": payload.address.strip(),
        "profession": payload.profession.strip(),
        "join_date": payload.join_date.isoformat(),
        "emergency_contact": payload.emergency_contact,
        "id_proof_number": payload.id_proof_number or "",
        "id_proof_name": id_proof.filename if id_proof and id_proof.filename else None,
        "id_proof_file": stored_proof_name,
        "room_id": to_object_id(payload.room_id) if payload.room_id else None,
        "room_number": room_document["room_number"] if room_document else None,
        "bed_number": payload.bed_number,
        "rent": round(payload.rent, 2),
        "payment_status": "PENDING",
        "last_payment_month": None,
        "created_at": now_iso(),
    }
    tenant_insert = database.tenants.insert_one(tenant_document)
    database.users.update_one(
        {"_id": user_insert.inserted_id},
        {"$set": {"tenant_profile_id": tenant_insert.inserted_id}},
    )

    created_tenant = database.tenants.find_one({"_id": tenant_insert.inserted_id})
    created_user = database.users.find_one({"_id": user_insert.inserted_id})
    floors_lookup = build_floor_lookup(database)
    return serialize_tenant(created_tenant, created_user, room_document, floors_lookup)


@router.put("/tenants/{tenant_id}")
def update_tenant(tenant_id: str, payload: TenantUpdate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    object_id = to_object_id(tenant_id)
    tenant = database.tenants.find_one({"_id": object_id})

    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.phone is not None:
        update_data["phone"] = payload.phone.strip()
    if payload.address is not None:
        update_data["address"] = payload.address.strip()
    if payload.profession is not None:
        update_data["profession"] = payload.profession.strip()
    if payload.join_date is not None:
        update_data["join_date"] = payload.join_date.isoformat()
    if payload.emergency_contact is not None:
        update_data["emergency_contact"] = payload.emergency_contact
    if payload.id_proof_number is not None:
        update_data["id_proof_number"] = payload.id_proof_number
    if payload.room_id is not None:
        if payload.room_id:
            new_room_obj = to_object_id(payload.room_id)
            new_room = database.rooms.find_one({"_id": new_room_obj})
            if not new_room:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")
            update_data["room_id"] = new_room_obj
            update_data["room_number"] = new_room["room_number"]
        else:
            update_data["room_id"] = None
            update_data["room_number"] = None
            update_data["bed_number"] = None
    if payload.bed_number is not None:
        update_data["bed_number"] = payload.bed_number
    if payload.rent is not None:
        update_data["rent"] = round(payload.rent, 2)
    if payload.payment_status is not None:
        if payload.payment_status not in ("PENDING", "PAID", "OVERDUE"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment status.")
        update_data["payment_status"] = payload.payment_status

    if update_data:
        database.tenants.update_one({"_id": object_id}, {"$set": update_data})

    updated = database.tenants.find_one({"_id": object_id})
    user = database.users.find_one({"_id": updated["user_id"]}) if updated.get("user_id") else None
    room = database.rooms.find_one({"_id": updated["room_id"]}) if updated.get("room_id") else None
    floors_lookup = build_floor_lookup(database)
    return serialize_tenant(updated, user, room, floors_lookup)


@router.delete("/tenants/{tenant_id}")
def delete_tenant(tenant_id: str, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    object_id = to_object_id(tenant_id)
    tenant = database.tenants.find_one({"_id": object_id})

    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    remove_upload(tenant.get("id_proof_file"))
    if tenant.get("user_id"):
        database.users.delete_one({"_id": tenant["user_id"]})
        payments = list(database.payments.find({"tenant_id": object_id}))
        for payment in payments:
            remove_upload(payment.get("screenshot_file"))
        database.payments.delete_many({"tenant_id": object_id})
        database.messages.delete_many(
            {
                "$or": [
                    {"sender_id": tenant["user_id"]},
                    {"receiver_id": tenant["user_id"]},
                ]
            }
        )

    database.tenants.delete_one({"_id": object_id})
    return {"message": "Tenant deleted successfully."}


@router.get("/floors")
def get_floors(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    return [serialize_floor(floor) for floor in database.floors.find().sort("order", 1)]


@router.post("/floors")
def add_floor(payload: FloorCreate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    existing_floor = database.floors.find_one({"name": payload.name.strip()})
    if existing_floor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Floor name already exists.")

    insert_result = database.floors.insert_one({"name": payload.name.strip(), "order": payload.order})
    created = database.floors.find_one({"_id": insert_result.inserted_id})
    return serialize_floor(created)


@router.get("/rooms")
def get_rooms(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    floors_lookup = build_floor_lookup(database)
    bed_assignments = build_bed_assignments(database)
    rooms = [
        serialize_room(room, floors_lookup, bed_assignments)
        for room in database.rooms.find().sort("room_number", 1)
    ]
    return rooms


@router.post("/rooms")
def add_room(payload: RoomCreate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    floor = ensure_floor_exists(database, payload.floor_id)
    existing_room = database.rooms.find_one({"room_number": payload.room_number.strip()})
    if existing_room:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists.")

    bed_labels = [f"Bed {index}" for index in range(1, payload.capacity + 1)]
    room_document = {
        "room_number": payload.room_number.strip(),
        "floor_id": floor["_id"],
        "capacity": payload.capacity,
        "beds": bed_labels,
    }
    insert_result = database.rooms.insert_one(room_document)
    created = database.rooms.find_one({"_id": insert_result.inserted_id})
    floors_lookup = build_floor_lookup(database)
    return serialize_room(created, floors_lookup, {})


@router.post("/rooms/{room_id}/beds")
def add_beds_to_room(room_id: str, payload: AddBedsCreate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    object_id = to_object_id(room_id)
    room = database.rooms.find_one({"_id": object_id})
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    existing_beds = room.get("beds") or [f"Bed {index}" for index in range(1, room.get("capacity", 0) + 1)]
    start_index = len(existing_beds) + 1
    new_labels = [f"Bed {index}" for index in range(start_index, start_index + payload.count)]
    updated_beds = existing_beds + new_labels

    updated = database.rooms.find_one_and_update(
        {"_id": object_id},
        {"$set": {"beds": updated_beds, "capacity": len(updated_beds)}},
        return_document=ReturnDocument.AFTER,
    )
    floors_lookup = build_floor_lookup(database)
    bed_assignments = build_bed_assignments(database)
    return serialize_room(updated, floors_lookup, bed_assignments)


@router.get("/pg-map")
def get_pg_map(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    floors = list(database.floors.find().sort("order", 1))
    rooms = list(database.rooms.find().sort("room_number", 1))
    floors_lookup = {str(floor["_id"]): floor for floor in floors}
    bed_assignments = build_bed_assignments(database)
    rooms_by_floor = {}
    unassigned_rooms = []

    for room in rooms:
        serialized_room = serialize_room(room, floors_lookup, bed_assignments)
        floor_id = serialized_room["floor_id"]
        if floor_id:
            rooms_by_floor.setdefault(floor_id, []).append(serialized_room)
        else:
            unassigned_rooms.append(serialized_room)

    floor_payload = []
    for floor in floors:
        floor_rooms = rooms_by_floor.get(str(floor["_id"]), [])
        floor_payload.append(
            {
                **serialize_floor(floor),
                "room_count": len(floor_rooms),
                "available_beds": sum(room["available_beds"] for room in floor_rooms),
                "rooms": floor_rooms,
            }
        )

    if unassigned_rooms:
        floor_payload.append(
            {
                "id": "unassigned-floor",
                "name": "Unassigned Floor",
                "order": 999,
                "room_count": len(unassigned_rooms),
                "available_beds": sum(room["available_beds"] for room in unassigned_rooms),
                "rooms": unassigned_rooms,
            }
        )

    return floor_payload


@router.post("/admin/payments/qr")
def upload_payment_qr(
    qr_image: UploadFile = File(...),
    _: dict = Depends(get_admin_user),
):
    database = ensure_database()
    existing_setting = database.settings.find_one({"key": "payment_qr"})
    if existing_setting:
        remove_upload(existing_setting.get("value", {}).get("file"))

    stored_qr = save_image_upload(qr_image, settings.qr_uploads_dir)
    updated_setting = set_setting(
        database,
        "payment_qr",
        {
            "file": stored_qr,
            "original_name": qr_image.filename,
        },
    )
    return {
        "qr_code_url": f"/uploads/{updated_setting['value']['file']}",
        "updated_at": updated_setting["updated_at"],
    }

