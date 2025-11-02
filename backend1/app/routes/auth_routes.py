# app/routes/auth_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import bcrypt
import os
import certifi
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

router = APIRouter(tags=["Authentication"])

# -------------------------------
# MongoDB Connection (SSL Fixed)
# -------------------------------
try:
    client = MongoClient(
        os.getenv("MONGO_URI"),
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True  # ✅ Bypass TLS issue for Kali Linux
    )
    db = client[os.getenv("MONGO_DB_NAME")]
    users = db["users"]
    print("✅ MongoDB connection established successfully!")
except Exception as e:
    print("❌ MongoDB connection failed:", e)
    raise e


# -------------------------------
# Pydantic Model
# -------------------------------
class LoginModel(BaseModel):
    email: str
    password: str


# -------------------------------
# Helpers
# -------------------------------
def _convert_objectid(obj):
    """
    Recursively convert any ObjectId instances in dict/list to their string form.
    """
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if isinstance(v, ObjectId):
                out[k] = str(v)
            else:
                out[k] = _convert_objectid(v)
        return out
    elif isinstance(obj, list):
        return [_convert_objectid(x) for x in obj]
    else:
        return obj


def _sanitize_user_doc(doc: dict):
    """
    Convert ObjectId values to strings and remove sensitive fields (password).
    Returns a new dict safe for JSON responses.
    """
    if not doc:
        return doc
    # convert objectids recursively
    safe = _convert_objectid(doc)
    # remove password if present
    safe.pop("password", None)
    return safe


# -------------------------------
# Login Route
# -------------------------------
@router.post("/login")
def login_user(user: LoginModel):
    """
    Login user (case-insensitive email lookup).
    Returns sanitized user document (no password) and role on success.
    Handles both plain-text stored passwords and bcrypt-hashed passwords.
    """
    found = users.find_one({"email": {"$regex": f"^{user.email}$", "$options": "i"}})
    if not found:
        raise HTTPException(status_code=404, detail="User not found ❌")

    stored_password = found.get("password")
    if not stored_password:
        # defensive: user record without password
        raise HTTPException(status_code=401, detail="Invalid password ❌")

    def success_payload(found_user):
        user_safe = _sanitize_user_doc(found_user)
        role = user_safe.get("role", "user")
        return {"status": "success", "message": f"Login successful as {role} ✅", "role": role, "user": user_safe}

    # Plain text match (common in dev setups)
    try:
        if stored_password == user.password:
            return success_payload(found)
    except Exception:
        # ignore unexpected types; fallthrough to bcrypt check
        pass

    # Hashed password (bcrypt)
    try:
        # stored_password and user.password should be bytes for checkpw
        if isinstance(stored_password, str):
            stored_bytes = stored_password.encode("utf-8")
        else:
            stored_bytes = stored_password
        if bcrypt.checkpw(user.password.encode("utf-8"), stored_bytes):
            return success_payload(found)
    except Exception:
        # If bcrypt fails (bad format), report invalid password rather than 500
        raise HTTPException(status_code=401, detail="Invalid password ❌")

    # If neither check matched
    raise HTTPException(status_code=401, detail="Invalid password ❌")
