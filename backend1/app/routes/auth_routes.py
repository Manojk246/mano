from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo import MongoClient
import bcrypt
import jwt
import os
import datetime
import certifi
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Authentication"])

# -------------------------------
# MongoDB Connection
# -------------------------------
try:
    client = MongoClient(
        os.getenv("MONGO_URI"),
        tls=True,
        tlsCAFile=certifi.where(),
        retryWrites=True
    )
    db = client[os.getenv("MONGO_DB_NAME")]
    users = db["users"]
    print("✅ MongoDB connection established successfully!")
except Exception as e:
    print("❌ MongoDB connection failed:", e)
    raise e


# -------------------------------
# Models
# -------------------------------
class LoginModel(BaseModel):
    email: str
    password: str


# -------------------------------
# JWT Settings
# -------------------------------
SECRET_KEY = os.getenv("JWT_SECRET", "supersecret")
ALGORITHM = "HS256"


# -------------------------------
# Login Route
# -------------------------------
@router.post("/login")
def login_user(user: LoginModel):

    found = users.find_one({
        "email": {"$regex": f"^{user.email}$", "$options": "i"}
    })

    if not found:
        raise HTTPException(status_code=404, detail="User not found ❌")

    stored_password = found.get("password")

    if not stored_password:
        raise HTTPException(status_code=401, detail="Invalid password ❌")

    # ======================================================
    # ✅ SAFE PASSWORD HANDLING (supports old + new users)
    # ======================================================

    # CASE 1️⃣ : OLD PLAIN TEXT PASSWORD (like "mathan")
    if isinstance(stored_password, str) and not stored_password.startswith("$2"):
        if stored_password != user.password:
            raise HTTPException(status_code=401, detail="Invalid password ❌")

        # 🔥 AUTO-UPGRADE TO BCRYPT HASH
        hashed_pw = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode()

        users.update_one(
            {"_id": found["_id"]},
            {"$set": {"password": hashed_pw}}
        )

    # CASE 2️⃣ : NEW BCRYPT HASHED PASSWORD
    else:
        if isinstance(stored_password, str):
            stored_password = stored_password.encode("utf-8")

        if not bcrypt.checkpw(
            user.password.encode("utf-8"),
            stored_password
        ):
            raise HTTPException(status_code=401, detail="Invalid password ❌")

    # ========================================================
    # Create JWT token
    # ======================================================
    payload = {
        "email": user.email.lower(),
        "role": found.get("role", "user"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    response = JSONResponse(content={
        "message": "Login successful ✅",
        "role": found.get("role", "user"),
    })

    # ✅ Cookie config for Render + Vercel
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/"
    )

    return response


# -------------------------------
# Verify Token Route
# -------------------------------
@router.get("/verify_token")
def verify_token(request: Request):

    token = request.cookies.get("access_token")
    print("🔍 Cookie token:", token)

    if not token:
        raise HTTPException(status_code=401, detail="Missing token ❌")

    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print("✅ Decoded token:", decoded)
        return {"valid": True, "user": decoded}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired ❌")

    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token ❌: {str(e)}")


# -------------------------------
# Logout
# -------------------------------
@router.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="None",
        secure=True
    )

    return {"message": "Logout successful"}