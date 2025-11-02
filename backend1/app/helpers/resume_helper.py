# app/helpers/resume_helper.py
# Combines your resume AI logic + detailed ATS scoring

import json
import io
import pdfplumber
import re
from datetime import datetime
from urllib.parse import urlparse

from app.config import db, openrouter_client  # config.py defines db and openrouter_client


# -------------------------
# Helper: normalize languages
# -------------------------
def normalize_languages(languages):
    """Normalize language names to a consistent format."""
    standard_langs = {
        "english": "English", "tamil": "Tamil", "hindi": "Hindi",
        "telugu": "Telugu", "malayalam": "Malayalam", "kannada": "Kannada",
        "french": "French", "german": "German", "spanish": "Spanish",
        "bengali": "Bengali", "marathi": "Marathi", "punjabi": "Punjabi",
        "gujarati": "Gujarati", "urdu": "Urdu", "oriya": "Oriya", "nepali": "Nepali"
    }
    normalized = []
    for lang in (languages or []):
        key = str(lang).strip().lower()
        if key in standard_langs and standard_langs[key] not in normalized:
            normalized.append(standard_langs[key])
    return normalized


# -------------------------
# Extract username from URL
# -------------------------
def extract_username_from_input(input_str: str):
    if not input_str:
        return None
    s = input_str.strip()
    if s.startswith(("http://", "https://")) or "github.com" in s:
        if s.startswith("github.com"):
            s = "https://" + s
        parsed = urlparse(s)
        parts = [p for p in parsed.path.split("/") if p]
        return parts[0] if parts else None
    if re.match(r"^[A-Za-z0-9-_.]{1,39}$", s):
        return s
    if "/" in s:
        return s.split("/")[-1]
    return None


# -------------------------
# ATS Score Calculator
# -------------------------
def calculate_ats_score(data, text, job_description=None, normalized_languages=None):
    score_details = {}

    action_verbs = r"\b(developed|built|designed|implemented|managed|optimized|increased|reduced|led|collaborated|deployed|created|trained|improved|tested|analyzed|automated|integrated|streamlined)\b"
    metrics_regex = r"\b(\d+%|\d+\s+(users|clients|projects|transactions|systems)|\$\d+|\d+\s+(x|times|months|years))\b"

    tech_keywords = [
        "python","java","c++","node","react","mongodb","mysql","aws","azure","gcp","docker","kubernetes",
        "tensorflow","pytorch","devops","fastapi","django","flask","typescript","postgres","rest","graphql"
    ]
    tools_keywords = [
        "git","github","jira","jenkins","figma","linux","bash","tableau","power bi","excel","visual studio","colab"
    ]
    soft_skills = ["leadership","communication","teamwork","problem solving","ownership"]
    cert_keywords = ["aws","azure","gcp","oracle","pmp","cisco","scrum","microsoft certified"]

    # Section coverage
    required_sections = ["experience", "education", "skills", "projects"]
    section_score = 0
    for section in required_sections:
        content = data.get(section) or ""
        if isinstance(content, str) and len(content.strip()) > 50:
            section_score += 10
    score_details["Section Coverage"] = min(section_score, 30)

    # Contact info
    contact_score = 0
    if data.get("email"): contact_score += 5
    if data.get("phone"): contact_score += 5
    if re.search(r"linkedin\.com", text.lower()): contact_score += 5
    if re.search(r"github\.com", text.lower()): contact_score += 5
    score_details["Contact Info"] = contact_score

    # Word count
    word_count = len((text or "").split())
    score_details["Word Count"] = 10 if 350 <= word_count <= 900 else 5 if word_count > 200 else 0

    # Bullet points
    bullet_patterns = [r"•", r"◦", r"\*", r"-\s", r"→"]
    bullet_count = sum(len(re.findall(pattern, text or "")) for pattern in bullet_patterns)
    score_details["Bullet Points"] = 10 if bullet_count >= 5 else 5 if bullet_count >= 2 else 0

    # Action verbs
    action_count = len(re.findall(action_verbs, text.lower()))
    score_details["Action Verbs"] = 10 if action_count >= 10 else 5 if action_count >= 4 else 0

    # Achievements
    metrics_count = len(re.findall(metrics_regex, text.lower()))
    score_details["Achievements"] = 10 if metrics_count >= 6 else 5 if metrics_count >= 2 else 0

    # Skills match
    skills_text = text.lower()
    tech_match = sum(1 for kw in tech_keywords if kw in skills_text)
    tool_match = sum(1 for kw in tools_keywords if kw in skills_text)
    soft_match = sum(1 for kw in soft_skills if kw in skills_text)
    score_details["Technical Skills"] = min(tech_match * 1.5, 15)
    score_details["Tools & Platforms"] = min(tool_match * 1.2, 10)
    score_details["Soft Skills Mention"] = min(soft_match * 2, 5)

    # Certifications
    cert_count = sum(1 for kw in cert_keywords if kw in skills_text)
    score_details["Certifications"] = min(cert_count * 5, 10)

    # Formatting penalty
    formatting_penalty = 0
    if re.search(r"<table|</table>", text.lower()): formatting_penalty += 10
    if re.search(r"\.(png|jpg|jpeg|svg)", text.lower()): formatting_penalty += 10
    if len(max(text.split("\n"), key=len)) > 180: formatting_penalty += 5
    score_details["ATS Formatting Score"] = 10 - formatting_penalty if formatting_penalty < 10 else 0

    # JD matching
    jd_score = 0
    if job_description:
        jd_text = job_description.lower()
        jd_keywords = set(re.findall(r"[a-zA-Z]+", jd_text))
        resume_words = set(re.findall(r"[a-zA-Z]+", skills_text))
        match_count = len(jd_keywords.intersection(resume_words))
        jd_score = min(match_count * 0.5, 20)
    score_details["JD Match"] = jd_score

    total_score = min(sum(score_details.values()), 100)
    score_details["Total ATS Score"] = round(total_score, 2)

    return {
        "ats_breakdown": score_details,
        "ats_score": score_details["Total ATS Score"],
        "word_count": word_count,
        "languages": normalized_languages,
    }


# -------------------------
# Core Resume Processor
# -------------------------# -------------------------
# Core Resume Processor (Fixed)
# -------------------------
async def process_resume_file(upload_file):
    """Handle resume PDF upload + AI parsing + ATS scoring + DB save."""
    try:
        contents = await upload_file.read()
        if not contents:
            return {"error": "Empty file received. Please upload a valid PDF."}

        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)

        if not text.strip():
            return {"error": "No readable text found in the uploaded PDF."}

        if not openrouter_client:
            return {"error": "AI client not configured (missing OPENROUTER_API_KEY)."}

        # ---- AI extraction ----
        prompt = f"""
Extract structured resume info and return valid JSON ONLY:
{{
  "name": "", 
  "email": "", 
  "phone": "",
  "linkedin": "", 
  "github": "", 
  "leetcode": "", 
  "codechef": "",
  "languages": [],  
  "education": {{
      "10th": {{
          "school": "",
          "location": "",
          "year": "",
          "percentage": ""
      }},
      "12th": {{
          "school": "",
          "location": "",
          "year": "",
          "percentage": ""
      }},
      "bachelor": {{
          "institute": "",
          "location": "",
          "degree": "",
          "expected_graduation": "",
          "cgpa": ""
      }}
  }},
  "skills": {{
      "technical": [], 
      "soft": []
  }},
  "certificates": [], 
  "role_match": "", 
  "summary": ""
}}
Resume text:
{text}
"""

        # ---- Call AI model ----
        try:
            response = openrouter_client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
            )
            ai_output = response.choices[0].message.content
        except Exception as exc:
            return {"error": f"AI request failed: {str(exc)}"}

        # ---- Parse JSON ----
        ai_output = ai_output.strip().replace("```json", "").replace("```", "")
        try:
            data = json.loads(ai_output)
        except Exception as e:
            return {"error": f"Failed to parse AI JSON: {str(e)}", "raw": ai_output}

        # ---- Normalize languages ----
        langs = normalize_languages(data.get("languages", []))
        if not langs:
            langs = ["English"]
        data["languages"] = langs

        # ---- Compute ATS ----
        ats = calculate_ats_score(data, text, normalized_languages=langs)

        # ---- Save to MongoDB ----
        try:
            await db.reports.insert_one({
                "filename": upload_file.filename,
                "data": data,
                "ats_breakdown": ats["ats_breakdown"],
                "ats_score": ats["ats_score"],
                "word_count": ats["word_count"],
                "uploaded_at": datetime.utcnow(),
            })
        except Exception as e:
            print("⚠️ MongoDB insert failed:", e)

        # ---- Return Result ----
        return {
            "data": data,
            "ats_score": ats["ats_score"],
            "ats_breakdown": ats["ats_breakdown"],
            "word_count": ats["word_count"],
        }

    except Exception as e:
        import traceback
        print("❌ Error in process_resume_file:", traceback.format_exc())
        return {"error": str(e)}
