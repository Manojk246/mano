# app/routes/auth_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import bcrypt
import os
import certifi
from dotenv import load_dotenv

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
# Login Route
# -------------------------------
@router.post("/login")
def login_user(user: LoginModel):
    found = users.find_one({"email": {"$regex": f"^{user.email}$", "$options": "i"}})
    if not found:
        raise HTTPException(status_code=404, detail="User not found ❌")

    # Plain text password
    if found["password"] == user.password:
        role = found.get("role", "user")
        return {"message": f"Login successful as {role} ✅", "role": role}

    # Hashed password
    if bcrypt.checkpw(user.password.encode("utf-8"), found["password"].encode("utf-8")):
        role = found.get("role", "user")
        return {"message": f"Login successful as {role} ✅", "role": role}

    raise HTTPException(status_code=401, detail="Invalid password ❌")
