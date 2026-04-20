from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import ensure_database, get_admin_user, get_authenticated_user
from app.services.pg import build_bed_assignments, build_floor_lookup, build_room_lookup, get_floor_name, get_setting
from app.services.serializers import serialize_notice, serialize_payment, serialize_tenant


router = APIRouter(tags=["dashboard"])


def build_admin_dashboard(database):
    rooms = list(database.rooms.find())
    tenants = list(database.tenants.find())
    payments = list(database.payments.find())
    total_beds = sum(len(room.get("beds") or []) or int(room.get("capacity", 0) or 0) for room in rooms)
    occupied_beds = sum(1 for tenant in tenants if tenant.get("room_id") and tenant.get("bed_number"))
    monthly_income = round(sum(float(tenant.get("rent", 0) or 0) for tenant in tenants), 2)
    approved_income = round(
        sum(float(payment.get("amount", 0) or 0) for payment in payments if payment.get("status") == "APPROVED"),
        2,
    )
    pending_income = round(
        sum(float(payment.get("amount", 0) or 0) for payment in payments if payment.get("status") == "PENDING"),
        2,
    )
    occupancy_rate = round((occupied_beds / total_beds) * 100, 2) if total_beds else 0

    recent_notices = [
        serialize_notice(notice)
        for notice in database.notices.find().sort("created_at", -1).limit(3)
    ]

    tenant_lookup = {str(tenant["_id"]): tenant for tenant in tenants}
    user_lookup = {str(user["_id"]): user for user in database.users.find()}
    recent_payments = [
        serialize_payment(
            payment,
            tenant_lookup.get(str(payment["tenant_id"])),
            user_lookup.get(str((tenant_lookup.get(str(payment["tenant_id"])) or {}).get("user_id"))),
        )
        for payment in database.payments.find().sort("created_at", -1).limit(5)
    ]

    return {
        "total_tenants": len(tenants),
        "total_rooms": len(rooms),
        "total_floors": database.floors.count_documents({}),
        "available_beds": max(total_beds - occupied_beds, 0),
        "pending_payments": len([payment for payment in payments if payment.get("status") == "PENDING"]),
        "approved_payments": len([payment for payment in payments if payment.get("status") == "APPROVED"]),
        "rejected_payments": len([payment for payment in payments if payment.get("status") == "REJECTED"]),
        "total_admins": database.users.count_documents({"role": "ADMIN"}),
        "monthly_income": monthly_income,
        "approved_income": approved_income,
        "pending_income": pending_income,
        "occupancy_rate": occupancy_rate,
        "occupied_beds": occupied_beds,
        "total_beds": total_beds,
        "recent_notices": recent_notices,
        "recent_payments": recent_payments,
    }


def build_tenant_dashboard(database, current_user):
    tenant = database.tenants.find_one({"user_id": current_user["_id"]})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant profile not found.")

    room = database.rooms.find_one({"_id": tenant["room_id"]}) if tenant.get("room_id") else None
    floor_name = None
    if room and room.get("floor_id"):
        floor = database.floors.find_one({"_id": room["floor_id"]})
        floor_name = floor["name"] if floor else None

    qr_setting = get_setting(database, "payment_qr")
    notices = [serialize_notice(notice) for notice in database.notices.find().sort("created_at", -1).limit(5)]
    payments = [
        serialize_payment(payment, tenant, current_user)
        for payment in database.payments.find({"tenant_id": tenant["_id"]}).sort("created_at", -1).limit(5)
    ]
    admin_user = database.users.find_one({"role": "ADMIN"}, sort=[("created_at", 1)])

    return {
        "welcome_name": current_user["name"],
        "room_details": {
            "room_number": room.get("room_number") if room else None,
            "bed_number": tenant.get("bed_number"),
            "floor_name": floor_name or "Unassigned Floor",
            "rent": tenant.get("rent"),
            "join_date": tenant.get("join_date"),
        },
        "qr_code_url": f"/uploads/{(qr_setting or {}).get('value', {}).get('file')}" if qr_setting else None,
        "payments": payments,
        "notices": notices,
        "admin_contact": {
            "id": str(admin_user["_id"]) if admin_user else None,
            "name": admin_user["name"] if admin_user else "Admin",
            "email": admin_user["email"] if admin_user else None,
        },
        "tenant": serialize_tenant(tenant, current_user, room, build_floor_lookup(database)),
    }


@router.get("/dashboard")
def get_dashboard(current_user: dict = Depends(get_admin_user)):
    database = ensure_database()
    return build_admin_dashboard(database)


@router.get("/tenant/dashboard")
def get_tenant_dashboard(current_user: dict = Depends(get_authenticated_user)):
    if current_user["role"] != "TENANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can view the tenant dashboard.")

    database = ensure_database()
    return build_tenant_dashboard(database, current_user)

