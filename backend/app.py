from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

from resume_parser import parse_pdf
from rag_pipeline import create_vector_store
from ats_score import calculate_ats_score
from question_generator import detect_domain_from_context, generate_interview_questions, analyze_with_llm, answer_custom_query

load_dotenv()

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Relative to where the app runs, though best practice is absolute path
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory storage for simplicity in this MVP version
app_state = {
    "current_text": "",
    "vector_store": None,
    "domain": ""
}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        text = parse_pdf(str(file_path))
        app_state["current_text"] = text
        app_state["vector_store"] = create_vector_store(text)
        return {"message": "Resume uploaded and parsed successfully.", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze-resume")
async def analyze_resume():
    if not app_state["current_text"]:
        raise HTTPException(status_code=400, detail="No resume uploaded yet.")
        
    try:
        vs = app_state["vector_store"]
        results = vs.similarity_search("skills projects experience education", k=6)
        context = "\n\n".join(r.page_content for r in results)
        
        domain = detect_domain_from_context(context)
        app_state["domain"] = domain
        
        ai_analysis = analyze_with_llm(context, domain)
        
        return {
            "domain": domain,
            "ai_suggestions": ai_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ats-score")
async def get_ats_score():
    if not app_state["current_text"]:
        raise HTTPException(status_code=400, detail="No resume uploaded yet.")
        
    domain = app_state.get("domain", "General")
    score_data = calculate_ats_score(app_state["current_text"], domain)
    return score_data

@app.get("/generate-questions")
async def get_questions():
    if not app_state["current_text"]:
        raise HTTPException(status_code=400, detail="No resume uploaded yet.")
        
    try:
        vs = app_state["vector_store"]
        results = vs.similarity_search("skills projects experience education", k=6)
        context = "\n\n".join(r.page_content for r in results)
        domain = app_state.get("domain", "General")
        
        questions = generate_interview_questions(context, domain)
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
async def chat_with_resume(request: ChatRequest):
    if not app_state["current_text"]:
        raise HTTPException(status_code=400, detail="No resume uploaded yet.")
        
    try:
        vs = app_state["vector_store"]
        results = vs.similarity_search(request.query, k=6)
        context = "\n\n".join(r.page_content for r in results)
        
        answer = answer_custom_query(context, request.query)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
