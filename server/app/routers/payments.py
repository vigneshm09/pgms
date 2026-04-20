from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pymongo import ReturnDocument

from app.config import settings
from app.dependencies import ensure_database, get_admin_user, get_authenticated_user
from app.schemas.payment import PaymentUploadPayload
from app.services.pg import build_room_lookup, build_user_lookup, get_setting, now_iso, to_object_id
from app.services.serializers import serialize_payment
from app.services.uploads import remove_upload, save_image_upload


router = APIRouter(tags=["payments"])


@router.get("/payments/qr")
def get_payment_qr(_: dict = Depends(get_authenticated_user)):
    database = ensure_database()
    qr_setting = get_setting(database, "payment_qr")
    value = (qr_setting or {}).get("value", {})
    return {
        "qr_code_url": f"/uploads/{value['file']}" if value.get("file") else None,
        "updated_at": (qr_setting or {}).get("updated_at"),
    }


@router.post("/payments/upload")
async def upload_payment(
    amount: float = Form(...),
    month: str = Form(...),
    transaction_id: str = Form(""),
    screenshot: UploadFile = File(...),
    current_user: dict = Depends(get_authenticated_user),
):
    if current_user["role"] != "TENANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can upload payments.")

    database = ensure_database()
    tenant = database.tenants.find_one({"user_id": current_user["_id"]})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant profile not found.")

    payload = PaymentUploadPayload(amount=amount, month=month, transaction_id=transaction_id)

    duplicate = database.payments.find_one(
        {
            "tenant_id": tenant["_id"],
            "month": payload.month,
            "status": {"$in": ["PENDING", "APPROVED"]},
        }
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A payment for this month is already pending review or approved.",
        )

    screenshot_file = save_image_upload(screenshot, settings.payment_uploads_dir)
    payment_document = {
        "tenant_id": tenant["_id"],
        "amount": round(payload.amount, 2),
        "month": payload.month,
        "screenshot_file": screenshot_file,
        "transaction_id": payload.transaction_id,
        "status": "PENDING",
        "admin_note": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    inserted = database.payments.insert_one(payment_document)
    database.tenants.update_one(
        {"_id": tenant["_id"]},
        {
            "$set": {
                "payment_status": "PENDING",
                "last_payment_month": payload.month,
            }
        },
    )

    created = database.payments.find_one({"_id": inserted.inserted_id})
    return serialize_payment(created, tenant, current_user)


@router.get("/payments/my")
def get_my_payments(current_user: dict = Depends(get_authenticated_user)):
    if current_user["role"] != "TENANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can view tenant payments.")

    database = ensure_database()
    tenant = database.tenants.find_one({"user_id": current_user["_id"]})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant profile not found.")

    payments = [
        serialize_payment(payment, tenant, current_user)
        for payment in database.payments.find({"tenant_id": tenant["_id"]}).sort("created_at", -1)
    ]
    return payments


@router.get("/admin/payments")
def get_admin_payments(_: dict = Depends(get_admin_user)):
    database = ensure_database()
    tenants = {str(tenant["_id"]): tenant for tenant in database.tenants.find()}
    users = build_user_lookup(database)

    return [
        serialize_payment(
            payment,
            tenants.get(str(payment["tenant_id"])),
            users.get(str((tenants.get(str(payment["tenant_id"])) or {}).get("user_id"))),
        )
        for payment in database.payments.find().sort("created_at", -1)
    ]


def update_payment_status(payment_id: str, status_value: str, current_user: dict):
    database = ensure_database()
    payment = database.payments.find_one({"_id": to_object_id(payment_id)})
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")

    updated = database.payments.find_one_and_update(
        {"_id": payment["_id"]},
        {
            "$set": {
                "status": status_value,
                "updated_at": now_iso(),
                "reviewed_by": current_user["email"],
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    tenant_status = status_value
    database.tenants.update_one(
        {"_id": updated["tenant_id"]},
        {
            "$set": {
                "payment_status": tenant_status,
                "last_payment_month": updated["month"],
            }
        },
    )

    tenant = database.tenants.find_one({"_id": updated["tenant_id"]})
    tenant_user = database.users.find_one({"_id": tenant["user_id"]}) if tenant and tenant.get("user_id") else None
    return serialize_payment(updated, tenant, tenant_user)


@router.put("/admin/payments/{payment_id}/approve")
def approve_payment(payment_id: str, current_user: dict = Depends(get_admin_user)):
    return update_payment_status(payment_id, "APPROVED", current_user)


@router.put("/admin/payments/{payment_id}/reject")
def reject_payment(payment_id: str, current_user: dict = Depends(get_admin_user)):
    return update_payment_status(payment_id, "REJECTED", current_user)

