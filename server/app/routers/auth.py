from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import ensure_database, get_authenticated_user
from app.schemas.auth import LoginRequest, TokenResponse
from app.security import create_access_token, verify_password
from app.services.pg import build_room_lookup
from app.services.serializers import serialize_auth_user


# ❌ REMOVE prefix="/auth"
# ✅ Keep router clean
router = APIRouter(tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    database = ensure_database()
    user = database.users.find_one({"email": payload.email})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    tenant = None
    if user["role"] == "TENANT":
        tenant = database.tenants.find_one({"user_id": user["_id"]})
        if tenant and tenant.get("room_id"):
            room_lookup = build_room_lookup(database)
            room = room_lookup.get(str(tenant.get("room_id")))
            if room:
                user["room_number"] = room.get("room_number")

    access_token = create_access_token({
        "sub": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_auth_user(user, tenant),
    }


@router.get("/me")
def get_me(current_user=Depends(get_authenticated_user)):
    database = ensure_database()
    tenant = None

    if current_user["role"] == "TENANT":
        tenant = database.tenants.find_one({"user_id": current_user["_id"]})

    return serialize_auth_user(current_user, tenant)