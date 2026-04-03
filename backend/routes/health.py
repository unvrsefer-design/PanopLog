from fastapi import APIRouter
from db import DB_PATH

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "db_path": DB_PATH,
    }