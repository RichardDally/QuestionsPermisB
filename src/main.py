import json
import random
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="Questions Permis B")

# Load questions as bundles
QUESTIONS_FILE = Path(__file__).parent.parent / "questions.json"
bundles = []

def load_questions():
    global bundles
    if not QUESTIONS_FILE.exists():
        return
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for item in data:
            sub_qs = []
            
            for vk in ["vérification intérieure", "vérification extérieure", "vérification"]:
                if vk in item and item[vk]:
                    sub_qs.append({
                        "category": vk.replace("_", " ").title(),
                        "question": item[vk].get("question", ""),
                        "answer": item[vk].get("reponse", "")
                    })
                    break
                    
            if "securite_routiere" in item and item["securite_routiere"]:
                sub_qs.append({
                    "category": "Sécurité Routière",
                    "question": item["securite_routiere"].get("question", ""),
                    "answer": item["securite_routiere"].get("reponse", "")
                })
                
            if "premiers_secours" in item and item["premiers_secours"]:
                sub_qs.append({
                    "category": "Premiers Secours",
                    "question": item["premiers_secours"].get("question", ""),
                    "answer": item["premiers_secours"].get("reponse", "")
                })
                
            if sub_qs:
                bundles.append({
                    "numero": item.get("numero", ""),
                    "sub_questions": sub_qs
                })

load_questions()

class SubQuestionOut(BaseModel):
    category: str
    question: str
    answer: str

class BundleOut(BaseModel):
    numero: str
    sub_questions: list[SubQuestionOut]

@app.get("/api/questions", response_model=list[BundleOut])
def get_questions(count: int = Query(10, ge=1, le=100)):
    if count > len(bundles):
        count = len(bundles)
    if not bundles:
        raise HTTPException(status_code=500, detail="Questions not loaded")
    return random.sample(bundles, count)

# Serve static files
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_index():
    return FileResponse(STATIC_DIR / "index.html")
