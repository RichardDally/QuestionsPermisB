import json
import random
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="Questions Permis B")

# Load and flatten questions
QUESTIONS_FILE = Path(__file__).parent.parent / "questions.json"
flattened_questions = []

def load_questions():
    global flattened_questions
    if not QUESTIONS_FILE.exists():
        return
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for item in data:
            categories = ["vérification intérieure", "vérification extérieure", "securite_routiere", "premiers_secours"]
            for cat in categories:
                if cat in item and item[cat]:
                    flattened_questions.append({
                        "theme": cat.replace("_", " ").title(),
                        "category": "Question",
                        "question": item[cat].get("question", ""),
                        "answer": item[cat].get("reponse", ""),
                        "image": None
                    })

load_questions()

class QuestionOut(BaseModel):
    theme: str
    category: str
    question: str
    answer: str
    image: str | None = None

@app.get("/api/questions", response_model=list[QuestionOut])
def get_questions(count: int = Query(10, ge=1, le=100)):
    if count > len(flattened_questions):
        count = len(flattened_questions)
    if not flattened_questions:
        raise HTTPException(status_code=500, detail="Questions not loaded")
    return random.sample(flattened_questions, count)

# Serve static files
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_index():
    return FileResponse(STATIC_DIR / "index.html")
