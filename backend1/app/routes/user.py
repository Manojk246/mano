# app/routes/user.py

from fastapi import APIRouter, UploadFile, Form, HTTPException
from datetime import datetime
from app.routes.auth_routes import db
from app.routes.resume_routes import process_resume_file  # ✅ use router AI function

router = APIRouter(prefix="/user", tags=["User Dashboard"])
users = db["users"]

# ---------------------------------------------------------------------
# 1️⃣ Fetch personal user info
# ---------------------------------------------------------------------
@router.get("/info/{email}")
def get_user_info(email: str):
    user = users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0, "password": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user}


# ---------------------------------------------------------------------
# 2️⃣ Upload Resume → Use AI router (process_resume_file)
# ---------------------------------------------------------------------
@router.post("/upload_resume")
async def upload_resume(email: str = Form(...), file: UploadFile = None):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # ✅ Use AI router function directly
        result = await process_resume_file(file)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Extract structured info + ATS score
        structured_info = result.get("data", {})
        ats_score = result.get("ats_score", {})
        ats_breakdown = result.get("ats_breakdown", {})
        word_count = result.get("word_count", 0)

        # ✅ Save to MongoDB users collection
        users.update_one(
            {"email": email},
            {
                "$set": {
                    "resume_filename": file.filename,
                    "structured_info": structured_info,
                    "ats_score": ats_score,
                    "ats_breakdown": ats_breakdown,
                    "word_count": word_count,
                    "last_uploaded": datetime.utcnow().isoformat(),
                }
            },
            upsert=True,
        )

        return {
            "status": "success",
            "message": "Resume processed successfully ✅",
            "structured_info": structured_info,
            "ats_score": ats_score,
            "ats_breakdown": ats_breakdown,
            "word_count": word_count,
        }

    except Exception as e:
        print("❌ Error in upload_resume:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------
# 3️⃣ Fetch ATS + Structured Info History
# ---------------------------------------------------------------------
@router.get("/history/{email}")
def get_history(email: str):
    user = users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "success",
        "structured_info": user.get("structured_info", {}),
        "ats_score": user.get("ats_score", {}),
        "ats_breakdown": user.get("ats_breakdown", {}),
        "word_count": user.get("word_count", 0),
        "last_uploaded": user.get("last_uploaded", None)
    }


# ---------------------------------------------------------------------
# 4️⃣ Admin – List all users
# ---------------------------------------------------------------------
@router.get("/all")
def get_all_users():
    all_users = list(users.find({}, {"_id": 0, "password": 0}))
    return {"status": "success", "users": all_users}
