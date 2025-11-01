# app/config.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from openai import OpenAI

# Load environment variables
load_dotenv()

# --- MongoDB ---
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "resume_analyzer")

db = None
if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
    except Exception as e:
        print("⚠️ MongoDB connection failed:", e)
else:
    print("⚠️ MONGO_URI not found in .env")

# --- OpenRouter (AI client) ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

openrouter_client = None
if OPENROUTER_API_KEY:
    openrouter_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )
else:
    print("⚠️ OPENROUTER_API_KEY missing from .env")

# --- GitHub Token ---
GITHUB_TOKEN_ENV = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN_ENV:
    print("⚠️ GITHUB_TOKEN not found in .env (GitHub API features may be limited)")
