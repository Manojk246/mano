from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
from app.helpers.resume_helper import process_resume_file
import re

router = APIRouter()

# ---------------------------------------------------------
# 🔧 Helper functions
# ---------------------------------------------------------
def parse_percentage(value):
    """Convert string percentage (like '92.6%') to float."""
    if not value:
        return 0.0
    try:
        return float(str(value).replace("%", "").strip())
    except:
        return 0.0


def parse_cgpa(value):
    """Convert CGPA value (like '8.32 (upto 5th semester)') to float."""
    if not value:
        return 0.0
    try:
        match = re.search(r"\d+(\.\d+)?", str(value))
        return float(match.group()) if match else 0.0
    except:
        return 0.0


# ---------------------------------------------------------
# 🧠 Resume Filtering Endpoint (No File Saving)
# ---------------------------------------------------------
@router.post("/filter_uploaded_resumes")
async def filter_uploaded_resumes(
    files: List[UploadFile] = File(...),
    cgpa: Optional[float] = Form(None),
    tenth: Optional[float] = Form(None),
    twelfth: Optional[float] = Form(None),
    ats: Optional[float] = Form(None),
    skills: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    degree: Optional[str] = Form(None),
):
    results = []
    skill_list = [s.strip().lower() for s in skills.split(",")] if skills else []

    # ✅ Normalize filters
    language = language.lower().strip() if language else None
    department = department.lower().strip() if department else None
    degree = degree.lower().strip() if degree else None

    # ✅ Process each uploaded resume (in memory)
    for file in files:
        try:
            # Read file contents into memory
            file_bytes = await file.read()

            # Reset the pointer (important for process_resume_file)
            from io import BytesIO
            file.file = BytesIO(file_bytes)

            # ✅ Process using your helper
            parsed = await process_resume_file(file)
            if not parsed or parsed.get("error"):
                continue

            data = parsed.get("data", {})
            ats_score = parsed.get("ats_score", 0)
            edu = data.get("education", {}) or {}
            langs = [lang.lower().strip() for lang in data.get("languages", []) if lang]
            tech_skills = [s.lower().strip() for s in data.get("skills", {}).get("technical", []) if s]

            # ---------------------------------------------------
            # 🧮 Convert Numeric Fields (safe parsing)
            # ---------------------------------------------------
            tenth_value = parse_percentage(edu.get("10th", {}).get("percentage"))
            twelfth_value = parse_percentage(edu.get("12th", {}).get("percentage"))
            cgpa_value = parse_cgpa(edu.get("bachelor", {}).get("cgpa"))

            # ---------------------------------------------------
            # 🚫 Apply Filters
            # ---------------------------------------------------
            if cgpa and cgpa_value < cgpa:
                continue
            if tenth and tenth_value < tenth:
                continue
            if twelfth and twelfth_value < twelfth:
                continue
            if ats and ats_score < ats:
                continue
            if language and not any(language in l for l in langs):
                continue
            if department and department not in str(edu.get("bachelor", {}).get("degree", "")).lower():
                continue
            if degree and degree not in str(edu.get("bachelor", {}).get("degree", "")).lower():
                continue
            if skill_list and not all(any(skill in s for s in tech_skills) for skill in skill_list):
                continue

            # ✅ Passed all filters
            results.append({
                "filename": file.filename,
                "file_url": None,  # Not saved
                "name": data.get("name"),
                "ats_score": ats_score,
                "education": edu,
                "skills": data.get("skills", {}),
                "languages": langs,
            })

        except Exception as e:
            print(f"⚠️ Error processing {file.filename}: {e}")
            continue

    return {
        "count": len(results),
        "results": results,
    }
