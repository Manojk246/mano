# main.py
# Full backend: Resume + LeetCode + CodeChef + GitHub analysis
# - Activity graphs returned as JSON arrays: [{ "date": "YYYY-MM-DD", "count": N }, ...]
# - Uses OpenRouter via OpenAI compatibility wrapper (if OPENROUTER_API_KEY present)
# - Keep frontend-compatible shapes with your Admin.jsx

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import json
import pdfplumber
import requests
import re
from urllib.parse import urlparse
from datetime import datetime, timedelta
from statistics import mean

# third-party HTML parser
from bs4 import BeautifulSoup

# load env
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GITHUB_TOKEN_ENV = os.getenv("GITHUB_TOKEN")

# try to initialize openrouter client (openai wrapper)
openrouter_client = None
try:
    from openai import OpenAI  # openrouter compatibility
    if OPENROUTER_API_KEY:
        openrouter_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
            default_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "AI Resume Insight"
            }
        )
except Exception:
    openrouter_client = None

app = FastAPI(title="AI Resume + Platform Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Helpers
# -------------------------
def normalize_languages(languages):
    """Normalize language names to a common set."""
    standard_langs = {
        "english": "English", "tamil": "Tamil", "hindi": "Hindi",
        "telugu": "Telugu", "malayalam": "Malayalam", "kannada": "Kannada",
        "french": "French", "german": "German", "spanish": "Spanish",
        "bengali": "Bengali", "marathi": "Marathi", "punjabi": "Punjabi",
        "gujarati": "Gujarati", "urdu": "Urdu", "oriya": "Oriya",
        "nepali": "Nepali"
    }
    normalized = []
    for lang in (languages or []):
        try:
            key = lang.strip().lower()
        except Exception:
            continue
        if key in standard_langs and standard_langs[key] not in normalized:
            normalized.append(standard_langs[key])
    return normalized


def extract_username_from_input(input_str: str):
    """Accept user input that may be a url or just a username"""
    if not input_str:
        return None
    s = input_str.strip()
    if s.startswith('http://') or s.startswith('https://') or s.startswith('github.com') or 'github.com' in s:
        if s.startswith('github.com'):
            s = 'https://' + s
        parsed = urlparse(s)
        parts = [p for p in parsed.path.split('/') if p]
        return parts[0] if parts else None
    # for plain username
    if re.match(r'^[A-Za-z0-9-_.]{1,39}$', s):
        return s
    # fallback: last path token if they gave a url-like string
    if '/' in s:
        return s.split('/')[-1]
    return None


# -------------------------
# Root
# -------------------------
@app.get("/")
def root():
    return {"message": "AI Resume + Platform Analyzer running ✅"}


# -------------------------
# Upload resume
# -------------------------
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Accept PDF file, extract text via pdfplumber, call OpenRouter to parse JSON.
    Returns: {"data": {...}, "ats_score": int, "word_count": int}
    """
    try:
        # read PDF
        with pdfplumber.open(file.file) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF."}, status_code=400)

        if not openrouter_client:
            return JSONResponse({"error": "AI client not configured (OPENROUTER_API_KEY missing)."}, status_code=500)

        prompt = f"""
Extract structured resume info and return VALID JSON ONLY:

{{
  "name":"",
  "email":"",
  "phone":"",
  "linkedin":"",
  "github":"",
  "leetcode":"",
  "codechef":"",
  "hackerrank":"",
  "languages": [],
  "education": {{
      "degree":"",
      "university":"",
      "year":"",
      "gpa":"",
      "school_name":"",
      "sslc_percentage":"",
      "hsc_percentage":""
  }},
  "internships":[{{"company":"","position":"","duration":"","technologies":""}}],
  "skills":{{"technical":[],"soft":[]}},
  "certificates":[],
  "role_match":"",
  "summary":""
}}

Resume text:
{text}
"""

        # call AI - attempt multiple models (best-effort)
        ai_output = None
        try:
            response = openrouter_client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
            )
            ai_output = response.choices[0].message.content
        except Exception:
            # fallback attempts
            try:
                response = openrouter_client.chat.completions.create(
                    model="google/gemma-2-9b-it",
                    messages=[
                        {"role": "system", "content": "Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                )
                ai_output = response.choices[0].message.content
            except Exception:
                try:
                    response = openrouter_client.chat.completions.create(
                        model="mistralai/mistral-7b-instruct",
                        messages=[
                            {"role": "system", "content": "Return ONLY valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                    )
                    ai_output = response.choices[0].message.content
                except Exception as exc:
                    return JSONResponse({"error": f"AI request failed: {str(exc)}"}, status_code=500)

        # normalize ai output into JSON
        if isinstance(ai_output, (dict, list)):
            ai_output = json.dumps(ai_output)
        elif not isinstance(ai_output, str):
            ai_output = str(ai_output)

        ai_output = ai_output.strip().replace("```json", "").replace("```", "")
        try:
            data = json.loads(ai_output)
        except Exception as e:
            return JSONResponse({"error": f"Failed to parse JSON from AI output: {str(e)}", "raw": ai_output}, status_code=500)

        # Ensure defaults
        data.setdefault("languages", [])
        data.setdefault("skills", {"technical": [], "soft": []})
        data.setdefault("education", {
            "degree": "", "university": "", "year": "",
            "gpa": "", "school_name": "", "sslc_percentage": "", "hsc_percentage": ""
        })
        data.setdefault("internships", [])
        data.setdefault("certificates", [])
        data.setdefault("role_match", "")
        data.setdefault("summary", "")

        # Normalize languages
        langs = data.get("languages", [])
        cleaned = []
        for l in langs:
            if isinstance(l, str):
                l = l.strip()
                if l:
                    cleaned.append(l)
            elif isinstance(l, dict):
                name = l.get("language") or l.get("name") or ""
                if isinstance(name, str) and name.strip():
                    cleaned.append(name.strip())
        normalized = normalize_languages(cleaned)
        if not normalized:
            # guess from text
            common_langs = ["English", "Tamil", "Hindi", "Telugu", "Malayalam", "French"]
            normalized = [lang for lang in common_langs if lang.lower() in text.lower()]
        if not normalized:
            normalized = ["English"]
        data["languages"] = normalized

        # ATS heuristic
        tech_count = len(data.get("skills", {}).get("technical", []))
        ats_score = min(100, tech_count * 10 + 30)

        # attach computed fields
        data_out = {**data, "ats_score": ats_score}
        return {"data": data_out, "ats_score": ats_score, "word_count": len(text.split())}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


# -------------------------
# LeetCode helpers & endpoints
# -------------------------
def analyze_performance(stats: dict):
    """
    Analyze user's LeetCode performance and provide sentiment analysis.
    Returns dict: {'sentiment', 'reason', 'scores', 'metrics'}
    """
    try:
        total = int(stats.get('Total_Solved', 0))
    except Exception:
        total = 0

    if total == 0:
        return {'sentiment': 'neutral', 'reason': 'No problems solved yet', 'metrics': {}, 'scores': {}}

    easy = int(stats.get('Easy', 0))
    medium = int(stats.get('Medium', 0))
    hard = int(stats.get('Hard', 0))

    easy_percent = (easy / total) * 100 if total else 0
    medium_percent = (medium / total) * 100 if total else 0
    hard_percent = (hard / total) * 100 if total else 0

    distribution_score = 0
    if 20 <= easy_percent <= 50:
        distribution_score += 1
    if 30 <= medium_percent <= 50:
        distribution_score += 1
    if 10 <= hard_percent <= 30:
        distribution_score += 1

    volume_score = 0
    if total >= 50:
        volume_score = 3
    elif total >= 30:
        volume_score = 2
    elif total >= 10:
        volume_score = 1

    difficulty_score = (easy * 1 + medium * 2 + hard * 3) / total if total else 0
    lang_count = len(stats.get('Languages', []))
    lang_score = min(lang_count, 3)

    analysis = {
        'scores': {
            'distribution': distribution_score,
            'volume': volume_score,
            'difficulty': difficulty_score,
            'languages': lang_score
        },
        'metrics': {
            'problem_distribution': f"Easy: {easy_percent:.1f}%, Medium: {medium_percent:.1f}%, Hard: {hard_percent:.1f}%",
            'total_problems': total,
            'languages_used': lang_count,
            'difficulty_rating': round(difficulty_score, 2)
        }
    }

    if total >= 2000:
        analysis['sentiment'] = 'positive'
        analysis['reason'] = f'Outstanding achievement with {total} problems solved! Well beyond 2000.'
    elif total >= 500:
        analysis['sentiment'] = 'neutral'
        analysis['reason'] = f'Good progress with {total} problems solved. Keep going to reach 2000+ problems!'
    else:
        analysis['sentiment'] = 'negative'
        analysis['reason'] = f'Currently at {total} problems. Focus on reaching 500 problems.'

    if analysis['sentiment'] != 'positive':
        suggestions = []
        if hard_percent < 10:
            suggestions.append("tackle more hard problems")
        if medium_percent < 30:
            suggestions.append("increase medium difficulty problems")
        if lang_count < 3:
            suggestions.append("try solving problems in more programming languages")
        if suggestions:
            analysis['reason'] += " Consider: " + ", ".join(suggestions) + "."

    return analysis


def extract_leetcode_data(username: str):
    """
    Query LeetCode GraphQL public endpoint to gather profile stats.
    Returns dict: profile data or {'error': ...}
    """
    api_url = "https://leetcode.com/graphql"
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': f'https://leetcode.com/{username}/',
    }

    query = """
    query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStats {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                reputation
                starRating
            }
            languageProblemCount {
                languageName
                problemsSolved
            }
        }
    }
    """

    try:
        response = requests.post(api_url, headers=headers, json={'query': query, 'variables': {'username': username}}, timeout=12)
        if response.status_code != 200:
            return {"error": f"Failed to access LeetCode for user {username} (Status: {response.status_code})"}
        data = response.json()
        if not data.get('data', {}).get('matchedUser'):
            return {"error": f"User {username} not found"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}

    try:
        user_data = data['data']['matchedUser']
        result = {}
        result['Username'] = user_data.get('username')
        submission_stats = user_data.get('submitStats', {}).get('acSubmissionNum', [])
        total_solved = 0
        for stat in submission_stats:
            diff = stat.get('difficulty')
            cnt = stat.get('count', 0)
            if diff:
                result[diff] = str(cnt)
            if diff == 'All':
                total_solved = cnt
        if 'Total_Solved' not in result:
            total = int(result.get('Easy', 0)) + int(result.get('Medium', 0)) + int(result.get('Hard', 0))
            result['Total_Solved'] = str(total or total_solved)
        else:
            result['Total_Solved'] = result.get('All') or str(total_solved)
        # languages
        languages = user_data.get('languageProblemCount', [])
        result['Languages'] = [l.get('languageName') for l in languages if l.get('problemsSolved', 0) > 0]
        profile = user_data.get('profile') or {}
        if profile:
            result['Ranking'] = profile.get('ranking')
            result['Reputation'] = profile.get('reputation')
            result['Rating'] = profile.get('starRating')
        return result
    except Exception as e:
        return {"error": f"Failed to parse LeetCode response: {str(e)}"}


@app.get("/analyze_leetcode/{username}")
def leetcode_endpoint(username: str):
    """
    Returns:
    {
      "profile": {...},
      "analysis": {...},
      "activity_graph": [{ "date": "YYYY-MM-DD", "count": N }, ...]  // best-effort (empty list if not available)
    }
    """
    profile = extract_leetcode_data(username)
    if "error" in profile:
        return JSONResponse(profile, status_code=400)

    analysis = analyze_performance(profile)

    # LeetCode doesn't expose a straightforward per-day contributions calendar for public requests.
    # We'll return an empty activity_graph so frontend can handle gracefully, or you can populate from other sources.
    activity_graph = []  # Keep empty by default
    return {"profile": profile, "analysis": analysis, "activity_graph": activity_graph}


# -------------------------
# CodeChef scraping
# -------------------------
def is_valid_topic(text):
    if not text:
        return False
    text = text.strip()
    if len(text) < 3 or len(text) > 60:
        return False
    if re.search(r"(Privacy Policy|About us|COMPANY|COMPILERS|Policy|Contact|Terms|Recent Activity|Fetch|\.js|var |const |async|function|window|script|developer|More Roadmaps|Problems Solved|Skill tests|None|Total Problems|Badges|Contests)", text, re.I):
        return False
    return True


def extract_codechef_paths_and_badges(profile_url: str):
    """Scrape CodeChef profile for paths, badges and basic stats."""
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        resp = requests.get(profile_url, headers=headers, timeout=12)
        if resp.status_code != 200:
            return {"error": f"Failed to access CodeChef (status {resp.status_code})"}
        soup = BeautifulSoup(resp.content, "html.parser")
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

    def extract_path_topics_with_percentage(soup, section_title):
        paths_list = []
        section_div = None
        for div in soup.find_all("div"):
            if div.find(string=lambda t: t and section_title in t):
                section_div = div
                break
        if not section_div:
            return []
        text_content = section_div.get_text(" ", strip=True)
        text_content = re.sub(r"\s+", " ", text_content)
        text_content = re.sub(r"(\d)\s*(\d)", r"\1\2", text_content)
        text_content = re.sub(r"(\d+)\s*%", r"\1%", text_content)
        pairs = re.findall(r"([A-Za-z][A-Za-z0-9 &+\-:]{2,60})\s*(\d{1,3}%)", text_content)
        clean_topics = []
        seen = set()
        for topic, percent in pairs:
            topic = topic.strip().rstrip()
            percent = percent.strip()
            if is_valid_topic(topic) and topic not in seen:
                seen.add(topic)
                try:
                    clean_topics.append({"name": topic, "completed_percentage": int(percent.strip('%'))})
                except Exception:
                    continue
        if section_title == "Learning Paths":
            clean_topics = [t for t in clean_topics if not t["name"].startswith("Practice")]
        elif section_title == "Practice Paths":
            clean_topics = [t for t in clean_topics if t["name"].startswith("Practice")]
        return clean_topics

    # Badges extraction (best-effort)
    badges = []
    try:
        badge_section = soup.find('h2', string=lambda t: t and 'Badges' in t)
        if badge_section:
            parent = badge_section.parent
            for div in parent.find_all("div"):
                txt = div.get_text(" ", strip=True)
                if 'badge' in txt.lower():
                    badges.append(txt)
    except Exception:
        pass

    learning_paths = extract_path_topics_with_percentage(soup, "Learning Paths")
    practice_paths = extract_path_topics_with_percentage(soup, "Practice Paths")

    # Basic rating extraction
    rating = 0
    stars = None
    global_rank = 0
    country_rank = 0
    try:
        rating_el = soup.find('div', class_='rating-number')
        if rating_el:
            rating = int(re.sub(r'[^\d]', '', rating_el.text) or 0)
        star_el = soup.find('span', class_='rating')
        if star_el:
            stars = star_el.text.strip()
        rank_row = soup.find('ul', class_='inline-list')
        if rank_row:
            items = rank_row.find_all('li')
            if len(items) >= 1:
                global_rank = int(re.sub(r'[^\d]', '', items[0].get_text() or "0") or 0)
            if len(items) >= 2:
                country_rank = int(re.sub(r'[^\d]', '', items[1].get_text() or "0") or 0)
    except Exception:
        pass

    # Attempt to extract total solved problems if present
    total_solved = 0
    try:
        # some pages include "Problems Solved" text — rough search
        text = soup.get_text(" ", strip=True)
        m = re.search(r"Total Problems Solved[:\s]*([0-9,]+)", text)
        if m:
            total_solved = int(m.group(1).replace(",", ""))
    except Exception:
        total_solved = 0

    result = {
        "Profile_URL": profile_url,
        "Rating": rating,
        "Star_Rating": stars,
        "Global_Rank": global_rank,
        "Country_Rank": country_rank,
        "Learning_Paths": learning_paths,
        "Practice_Paths": practice_paths,
        "Badges": list(dict.fromkeys(badges)),
        "Total_Solved": total_solved
    }
    return result


@app.get("/analyze_codechef/{username}")
def codechef_endpoint(username: str):
    profile_url = f"https://www.codechef.com/users/{username}"
    data = extract_codechef_paths_and_badges(profile_url)
    if "error" in data:
        return JSONResponse(data, status_code=400)
    # No readily available daily activity; return learning paths + badges
    return {"profile": data}


# -------------------------
# GitHub analysis
# -------------------------
def get_github_repo_counts(username: str, token: str):
    """
    Use GitHub GraphQL to get repo counts and contribution calendar
    Returns dict or {'error_graphql': ...}
    """
    if not token:
        return {"error_graphql": "GitHub token is required for GraphQL API (pass via query or set GITHUB_TOKEN env)"}
    url = "https://api.github.com/graphql"
    headers = {"Authorization": f"Bearer {token}"}
    query = """
    query ($login: String!) {
      user(login: $login) {
        originalRepos: repositories(ownerAffiliations: OWNER, isFork: false) { totalCount }
        forkedRepos: repositories(ownerAffiliations: OWNER, isFork: true) { totalCount }
        contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
      }
    }
    """
    try:
        response = requests.post(url, json={'query': query, 'variables': {'login': username}}, headers=headers, timeout=15)
        data = response.json()
        if 'errors' in data:
            return {"error_graphql": data['errors']}
        if 'data' not in data or not data['data'].get('user'):
            return {"error_graphql": "User Not Found or Unexpected Response"}
        user_data = data['data']['user']
        calendar = user_data['contributionsCollection']['contributionCalendar']
        total_original_repos = user_data['originalRepos']['totalCount']
        total_forked_repos = user_data['forkedRepos']['totalCount']
        total_contrib = calendar['totalContributions']
        weeks = calendar.get('weeks', [])
        days = [day for week in weeks for day in week.get('contributionDays', [])]
        # build activity list: [{'date': 'YYYY-MM-DD','count': N}, ...]
        activity = [{"date": d.get('date'), "count": d.get('contributionCount', 0)} for d in days]
        active_days = sum(1 for d in activity if d["count"] > 0)
        return {
            "username": username,
            "total_original_repos": total_original_repos,
            "total_forked_repos": total_forked_repos,
            "total_contributions_1yr": total_contrib,
            "active_days_1yr": active_days,
            "activity_graph": activity
        }
    except Exception as e:
        return {"error_graphql": str(e)}


def get_pr_metrics(username: str, token: str):
    """
    Use REST API search to locate PRs authored in last year.
    """
    if not token:
        return {"error_pr_api": "GitHub token is required for PR metrics (pass via query or set GITHUB_TOKEN env)"}
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}
    one_year_ago = (datetime.now() - timedelta(days=365)).date().isoformat()
    search_query = f"author:{username} type:pr updated:>{one_year_ago}"
    search_url = f"https://api.github.com/search/issues?q={search_query}&per_page=100"
    try:
        response = requests.get(search_url, headers=headers, timeout=15)
        response.raise_for_status()
        search_data = response.json()
        all_prs = search_data.get('items', [])
    except Exception as e:
        return {"error_pr_api": str(e)}

    if not all_prs:
        return {"total_prs_submitted": 0, "pr_acceptance_rate": 0.0, "avg_pr_size_lines": 0, "avg_time_to_merge_days": 0.0}

    merged_pr_count = 0
    total_lines_changed = []
    time_to_merge_seconds = []

    for pr_issue in all_prs:
        if 'pull_request' not in pr_issue:
            continue
        pr_url = pr_issue['pull_request']['url']
        try:
            pr_response = requests.get(pr_url, headers=headers, timeout=10)
            pr_response.raise_for_status()
            pr_data = pr_response.json()
            if pr_data.get('merged') is True:
                merged_pr_count += 1
                lines_changed = pr_data.get('additions', 0) + pr_data.get('deletions', 0)
                total_lines_changed.append(lines_changed)
                created_at = datetime.fromisoformat(pr_data['created_at'].rstrip('Z'))
                merged_at = datetime.fromisoformat(pr_data['merged_at'].rstrip('Z'))
                time_to_merge_seconds.append((merged_at - created_at).total_seconds())
            # rate-limit check
            if int(pr_response.headers.get('X-RateLimit-Remaining', 1)) < 5:
                break
        except Exception:
            continue

    total_submitted = len(all_prs)
    pr_metrics = {
        "total_prs_submitted": total_submitted,
        "prs_merged": merged_pr_count,
        "pr_acceptance_rate": (merged_pr_count / total_submitted) * 100 if total_submitted > 0 else 0.0
    }
    if merged_pr_count > 0:
        pr_metrics["avg_pr_size_lines"] = round(mean(total_lines_changed))
        avg_time_seconds = mean(time_to_merge_seconds)
        pr_metrics["avg_time_to_merge_days"] = round(avg_time_seconds / (60 * 60 * 24), 2)
    else:
        pr_metrics["avg_pr_size_lines"] = 0
        pr_metrics["avg_time_to_merge_days"] = 0.0
    return pr_metrics


@app.get("/analyze_github/{user_input}")
def github_endpoint(user_input: str, token: str = Query(None, description="GitHub token (optional; fallbacks to GITHUB_TOKEN env)")):
    username = extract_username_from_input(user_input)
    if not username:
        return JSONResponse({"error": "Could not parse GitHub username from input"}, status_code=400)
    token_to_use = token or GITHUB_TOKEN_ENV
    if not token_to_use:
        return JSONResponse({"error": "GitHub token missing. Pass ?token=... or set GITHUB_TOKEN env variable"}, status_code=400)

    gql = get_github_repo_counts(username, token_to_use)
    if "error_graphql" in gql:
        return JSONResponse(gql, status_code=400)
    pr = get_pr_metrics(username, token_to_use)
    if "error_pr_api" in pr:
        # continue — still return gql results if PR metrics fail
        return JSONResponse(pr, status_code=400)

    combined = {**gql, **pr}
    return {"username": username, "github_metrics": combined}


# -------------------------
# Combined analyze_all route
# -------------------------
@app.post("/analyze_all")
async def analyze_all(
    file: UploadFile = File(...),
    github: str = Query(None),
    leetcode: str = Query(None),
    codechef: str = Query(None),
    token: str = Query(None)
):
    """
    Convenience route: Upload resume + optionally analyze github / leetcode / codechef
    Returns a combined JSON object.
    """
    results = {}
    # resume
    resume_resp = await upload_resume(file)
    # upload_resume returns JSONResponse on error OR a dict on success
    if isinstance(resume_resp, JSONResponse):
        # error occurred
        return resume_resp
    results["resume"] = resume_resp

    # platforms (best-effort)
    if github:
        try:
            gh = github_endpoint(github, token)
            results["github"] = gh
        except Exception as e:
            results["github_error"] = str(e)
    if leetcode:
        try:
            lc = leetcode_endpoint(leetcode)
            results["leetcode"] = lc
        except Exception as e:
            results["leetcode_error"] = str(e)
    if codechef:
        try:
            cc = codechef_endpoint(codechef)
            results["codechef"] = cc
        except Exception as e:
            results["codechef_error"] = str(e)

    return results


# -------------------------
# Run info
# -------------------------
if __name__ == "__main__":
    # For local dev - use: python main.py
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
