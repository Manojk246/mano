from fastapi import APIRouter, UploadFile, Form, HTTPException
from app.routes.auth_routes import db
from datetime import datetime
import re

router = APIRouter(prefix="/user", tags=["User Dashboard"])

users = db["users"]

# ---------------------------------------------------------------------
# 1️⃣ Fetch personal user info
# ---------------------------------------------------------------------
@router.get("/info/{email}")
def get_user_info(email: str):
    """
    Fetch personal info of the user by email.
    Excludes password and internal MongoDB _id.
    """
    user = users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0, "password": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user}


# ---------------------------------------------------------------------
# 2️⃣ Upload Resume + Compute ATS Score
# ---------------------------------------------------------------------
@router.post("/upload_resume")
async def upload_resume(email: str = Form(...), file: UploadFile = None):
    """
    Upload resume, extract text (mock), and compute a simple ATS score.
    Stores resume text and score in the database.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = (await file.read()).decode("utf-8", errors="ignore")

    ats_score = calculate_ats_score(content)

    users.update_one(
        {"email": email},
        {
            "$set": {
                "resume_text": content,
                "ats_score": ats_score,
                "last_uploaded": datetime.utcnow().isoformat()
            }
        }
    )
    return {"status": "success", "ats_score": ats_score}


# ---------------------------------------------------------------------
# 3️⃣ Fetch ATS Score History
# ---------------------------------------------------------------------
@router.get("/history/{email}")
def get_history(email: str):
    """
    Retrieve user's previous resume analysis history.
    (In this simple version, we only store one record per user.)
    """
    user = users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "success",
        "ats_score": user.get("ats_score", {}),
        "last_uploaded": user.get("last_uploaded", None)
    }


# ---------------------------------------------------------------------
# 4️⃣ Mock ATS Score Function
# ---------------------------------------------------------------------
def calculate_ats_score(text: str):
    """
    Simple keyword-based mock ATS score.
    Replace with a real AI-based scoring model if needed.
    """
    keywords = [
        "react", "node.js", "express", "mongodb", "sql", "docker",
        "aws", "python", "typescript", "html", "css", "git", "api"
    ]
    matched = [k for k in keywords if re.search(rf"\b{k}\b", text, re.IGNORECASE)]
    score = int((len(matched) / len(keywords)) * 100)

    missing = [k for k in keywords if k not in matched]
    tips = [f"Add more details about {k}" for k in missing[:5]]

    return {
        "score": score,
        "matched": matched,
        "missing": missing,
        "tips": tips
    }


# ---------------------------------------------------------------------
# 5️⃣ Admin Endpoint – Fetch all users (optional)
# ---------------------------------------------------------------------
@router.get("/all")
def get_all_users():
    """
    Return list of all users (for admin dashboard)
    """
    all_users = list(users.find({}, {"_id": 0, "password": 0}))
    return {"status": "success", "users": all_users}
