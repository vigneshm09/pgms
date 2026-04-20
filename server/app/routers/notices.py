from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.dependencies import ensure_database, get_admin_user, get_authenticated_user
from app.schemas.notice import NoticeCreate, NoticeUpdate
from app.services.pg import now_iso, to_object_id
from app.services.serializers import serialize_notice


router = APIRouter(tags=["notices"])


@router.get("/notices")
def get_notices(_: dict = Depends(get_authenticated_user)):
    database = ensure_database()
    return [serialize_notice(notice) for notice in database.notices.find().sort("created_at", -1)]


@router.post("/admin/notices")
def create_notice(payload: NoticeCreate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    inserted = database.notices.insert_one(
        {
            "title": payload.title.strip(),
            "content": payload.content.strip(),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
    )
    created = database.notices.find_one({"_id": inserted.inserted_id})
    return serialize_notice(created)


@router.put("/admin/notices/{notice_id}")
def update_notice(notice_id: str, payload: NoticeUpdate, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    updated = database.notices.find_one_and_update(
        {"_id": to_object_id(notice_id)},
        {
            "$set": {
                "title": payload.title.strip(),
                "content": payload.content.strip(),
                "updated_at": now_iso(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found.")
    return serialize_notice(updated)


@router.delete("/admin/notices/{notice_id}")
def delete_notice(notice_id: str, _: dict = Depends(get_admin_user)):
    database = ensure_database()
    result = database.notices.delete_one({"_id": to_object_id(notice_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found.")
    return {"message": "Notice deleted successfully."}

