# app/routes/admin_resume_filter.py

from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
from app.helpers.resume_helper import process_resume_file

router = APIRouter()

@router.post("/filter_uploaded_resumes")
async def filter_uploaded_resumes(
    files: List[UploadFile] = File(...),
    cgpa: Optional[str] = Form(None),
    tenth: Optional[str] = Form(None),
    twelfth: Optional[str] = Form(None),
    ats: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    degree: Optional[str] = Form(None),
):
    results = []
    skill_list = [s.strip().lower() for s in skills.split(",")] if skills else []

    # ✅ Convert filters safely
    try:
        cgpa = float(cgpa) if cgpa else None
        tenth = float(tenth) if tenth else None
        twelfth = float(twelfth) if twelfth else None
        ats = float(ats) if ats else None
    except ValueError:
        cgpa = tenth = twelfth = ats = None

    for file in files:
        parsed = await process_resume_file(file)
        if not parsed or parsed.get("error"):
            continue

        data = parsed.get("data", {})
        ats_score = parsed.get("ats_score", 0)
        edu = data.get("education", {})
        langs = [lang.lower() for lang in data.get("languages", [])]
        tech_skills = [s.lower() for s in data.get("skills", {}).get("technical", [])]

        # ---------------- FILTER CONDITIONS ----------------
        if cgpa and float(edu.get("cgpa", 0)) < cgpa:
            continue
        if tenth and float(edu.get("tenth_percentage", 0)) < tenth:
            continue
        if twelfth and float(edu.get("twelfth_percentage", 0)) < twelfth:
            continue
        if ats and ats_score < ats:
            continue
        if language and language.lower() not in langs:
            continue
        if department and department.lower() not in str(edu.get("department", "")).lower():
            continue
        if degree and degree.lower() not in str(edu.get("degree", "")).lower():
            continue
        if skill_list and not all(skill in tech_skills for skill in skill_list):
            continue

        results.append({
            "filename": file.filename,
            "name": data.get("name"),
            "ats_score": ats_score,
            "education": edu,
            "skills": data.get("skills", {}),
            "languages": langs,
        })

    return {"count": len(results), "results": results}
