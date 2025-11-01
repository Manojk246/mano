# app/main.py
# Main entry point for the AI Resume + Platform Analyzer backend

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import routers
from app.routes.resume_routes import router as resume_router
from app.routes.leetcode_routes import router as leetcode_router
from app.routes.codechef_routes import router as codechef_router
from app.routes.github_routes import router as github_router
from app.routes.analyze_all import router as analyze_all_router

app = FastAPI(title="AI Resume + Platform Analyzer")

# -------------------------
# Middleware
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # restrict later for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Root
# -------------------------
@app.get("/")
def root():
    return {"message": "AI Resume + Platform Analyzer running ✅"}

# -------------------------
# Routers
# -------------------------
app.include_router(resume_router, prefix="/resume", tags=["Resume"])
app.include_router(leetcode_router, prefix="/leetcode", tags=["LeetCode"])
app.include_router(codechef_router, prefix="/codechef", tags=["CodeChef"])
app.include_router(github_router, prefix="/github", tags=["GitHub"])
app.include_router(analyze_all_router, tags=["Analyze All"])

# -------------------------
# Run info
# -------------------------
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
