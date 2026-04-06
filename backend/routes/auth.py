from fastapi import APIRouter, Header, HTTPException

from schemas import RegisterRequest, LoginRequest
from services.auth_service import (
    create_user,
    authenticate_user,
    generate_token,
    get_username_from_token,
    get_user_by_username,
)

router = APIRouter(prefix="/auth")


@router.post("/register")
def register(body: RegisterRequest):
    if len(body.password or "") < 6:
        raise HTTPException(status_code=400, detail="Password too short")

    result = create_user(body.username, body.password)

    if not result["success"]:
        return {
            "success": False,
            "error": result.get("error", "User oluşturulamadı"),
        }

    token = generate_token(body.username)

    return {
      "success": True,
      "user": {
          "id": result["user_id"],
          "username": body.username,
      },
      "token": token,
    }


@router.post("/login")
def login(body: LoginRequest):
    user = authenticate_user(body.username, body.password)

    if not user:
        return {
            "success": False,
            "error": "Geçersiz kullanıcı adı veya şifre",
        }

    token = generate_token(user["username"])

    return {
        "success": True,
        "user": user,
        "token": token,
    }


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    if not authorization:
        return {"success": False, "error": "Token yok"}

    try:
        token = authorization.replace("Bearer ", "").strip()
    except Exception:
        return {"success": False, "error": "Token parse edilemedi"}

    username = get_username_from_token(token)

    if not username:
        return {"success": False, "error": "Geçersiz token"}

    user = get_user_by_username(username)

    if not user:
        return {"success": False, "error": "User bulunamadı"}

    return {
        "success": True,
        "user": user,
    }