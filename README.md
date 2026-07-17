<div align="center">

<h1>🤖 AI Resume Analyzer</h1>

<p>
  <strong>A full-stack, RAG-powered resume intelligence platform</strong><br/>
  Upload any PDF resume → Get instant ATS scoring, AI-driven insights, domain detection, tailored interview questions, and a live chat interface — all powered by a custom vector pipeline and LLM reasoning.
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-8.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/LangChain-1.3+-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain"/>
  <img src="https://img.shields.io/badge/OpenRouter-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Usage Guide](#-usage-guide)
- [ATS Scoring Model](#-ats-scoring-model)
- [RAG Pipeline](#-rag-pipeline)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**AI Resume Analyzer** is a production-inspired, modular full-stack application that transforms raw PDF resumes into actionable career intelligence. It leverages a custom **Retrieval-Augmented Generation (RAG)** pipeline built on `sentence-transformers` and cosine similarity — **without needing a paid vector database** — and routes LLM calls through **OpenRouter** using `GPT-4o-mini` for cost-effective, high-quality responses.

> **Use Case:** Ideal for job seekers who want to understand how ATS systems evaluate them, get domain-specific feedback, and prepare targeted interview answers — all in one place.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📄 **PDF Resume Parsing** | Extracts clean text from any PDF resume using `pdfplumber` |
| 🧠 **Domain Detection** | Automatically classifies resumes into domains (GenAI, Web Dev, Data Science, DevOps, etc.) via LLM |
| 💡 **AI Resume Analysis** | Delivers structured improvement suggestions powered by `GPT-4o-mini` via OpenRouter |
| 📊 **Dynamic ATS Scoring** | Multi-category scoring algorithm (100-point scale) with a detailed breakdown and missing skill detection |
| ❓ **Interview Question Generation** | Generates 7 curated questions: 3 Technical, 2 HR, and 2 Project/Viva — tailored to the detected domain |
| 💬 **RAG Chatbot** | Ask anything about the uploaded resume in a live chat interface backed by semantic vector search |
| ⚡ **Custom Vector Store** | In-memory cosine similarity search using `sentence-transformers` — zero external vector DB dependency |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend                    │
│   Upload  │  Analyze  │  ATS Score  │  Questions  │  Chat RAG   │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTP / REST API
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (app.py)                    │
│                                                                 │
│  POST /upload-resume ──► resume_parser.py ──► PDF Text          │
│                                        │                        │
│                                        ▼                        │
│                              rag_pipeline.py                    │
│                       (Text Splitting + Embeddings)             │
│                       (SimpleVectorStore in-memory)             │
│                                        │                        │
│  GET /analyze-resume ◄─────────────────┤                        │
│  GET /ats-score      ◄── ats_score.py  │                        │
│  GET /generate-questions ◄─────────────┤                        │
│  POST /chat          ◄─────────────────┘                        │
│                                        │                        │
│                                        ▼                        │
│                         question_generator.py                   │
│                    (OpenRouter → GPT-4o-mini via utils.py)      │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User uploads a PDF → extracted to plain text via `pdfplumber`
2. Text is chunked (`RecursiveCharacterTextSplitter`) and embedded (`all-MiniLM-L6-v2`)
3. Embeddings are stored in an in-memory `SimpleVectorStore` with L2-normalized cosine similarity
4. On each query, the top-k relevant chunks are retrieved and passed as context to the LLM
5. The LLM (GPT-4o-mini via OpenRouter) synthesizes responses grounded in the resume content

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async REST API framework |
| **pdfplumber** | PDF text extraction |
| **LangChain** | `RecursiveCharacterTextSplitter` for intelligent text chunking |
| **sentence-transformers** | `all-MiniLM-L6-v2` model for local text embeddings |
| **NumPy** | Cosine similarity computation for the custom vector store |
| **OpenRouter API** | LLM gateway (GPT-4o-mini) for analysis, detection, and generation |
| **python-dotenv** | Secure environment variable management |
| **uv** | Ultra-fast Python package manager and virtual environment tool |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **Vite 8** | Lightning-fast build tool and dev server |
| **Fetch API** | Native REST communication with the FastAPI backend |

---

## 📁 Project Structure

```
Resume Project/
│
├── backend/
│   ├── app.py                  # FastAPI routes: upload, analyze, ATS, questions, chat
│   ├── ats_score.py            # Rule-based ATS scoring engine (100-point multi-category)
│   ├── question_generator.py   # LLM calls: domain detection, analysis, Q&A, chat
│   ├── rag_pipeline.py         # Custom vector store with sentence-transformer embeddings
│   ├── resume_parser.py        # PDF text extraction using pdfplumber
│   ├── utils.py                # OpenRouter API client factory
│   └── requirements.txt        # Backend-specific Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main UI: upload, analyze, ATS, questions, RAG chat
│   │   └── main.jsx            # React app entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── uploads/                    # Temporary directory for uploaded PDF files
├── data/                       # Supplementary data / notebook outputs
├── notebook/                   # Jupyter notebooks for experimentation
│
├── .env                        # Environment variables (OPENROUTER_API_KEY)
├── .gitignore
├── pyproject.toml              # Python project config (uv-managed)
├── requirements.txt            # Root-level Python dependencies
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:8000`  
Interactive Docs: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-resume` | Upload a PDF resume; parses text and builds the vector store |
| `GET` | `/analyze-resume` | Detects domain and returns LLM-generated AI suggestions |
| `GET` | `/ats-score` | Returns a 100-point ATS score with category breakdown and missing skills |
| `GET` | `/generate-questions` | Generates 7 tailored interview questions (3 Technical + 2 HR + 2 Project) |
| `POST` | `/chat` | Ask a custom question about the resume; returns a RAG-grounded answer |

### Request & Response Examples

**`POST /upload-resume`**
```json
// multipart/form-data
// field: file = <your_resume.pdf>

// Response
{ "message": "Resume uploaded and parsed successfully.", "filename": "resume.pdf" }
```

**`GET /analyze-resume`**
```json
// Response
{
  "domain": "GenAI",
  "ai_suggestions": "The candidate demonstrates strong proficiency in RAG pipelines and LangChain..."
}
```

**`GET /ats-score`**
```json
// Response
{
  "total_score": 78,
  "breakdown": {
    "Technical Skills": 32,
    "Projects": 12,
    "Experience": 5,
    "Achievements": 6,
    "Tools & Platforms": 13,
    "Education": 5,
    "Resume Structure": 5
  },
  "missing_skills": ["vector database"]
}
```

**`POST /chat`**
```json
// Request
{ "query": "What programming languages does the candidate know?" }

// Response
{ "response": "Based on the resume, the candidate is proficient in Python, JavaScript, and C++." }
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** ≥ 3.14 (managed via `uv` or standard `venv`)
- **Node.js** ≥ 18.x and **npm**
- An **OpenRouter API Key** — get one free at [openrouter.ai](https://openrouter.ai)

---

### 1. Backend Setup

**Step 1:** Clone the repository and navigate to the project root.
```bash
git clone <your-repo-url>
cd "Resume Project"
```

**Step 2:** Create and activate a virtual environment.
```bash
# Using Python venv (recommended)
python -m venv .venv

# Activate on Windows
.venv\Scripts\activate

# Activate on macOS / Linux
source .venv/bin/activate
```

> **Tip:** If you have `uv` installed, you can use `uv venv && uv sync` at the project root instead — it reads `pyproject.toml` automatically.

**Step 3:** Install backend dependencies.
```bash
cd backend
pip install -r requirements.txt
```

**Step 4:** Configure your API key.

Create a `.env` file in the **project root** (not inside `backend/`):
```env
OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

**Step 5:** Start the FastAPI development server.
```bash
# From the project root (recommended)
uvicorn backend.app:app --reload --port 8000

# OR from inside the backend/ directory
cd backend
uvicorn app:app --reload --port 8000
```

✅ The API will be live at **`http://localhost:8000`**  
📖 Swagger UI available at **`http://localhost:8000/docs`**

---

### 2. Frontend Setup

**Step 1:** Open a **new terminal** and navigate to the frontend directory.
```bash
cd frontend
```

**Step 2:** Install npm dependencies.
```bash
npm install
```

**Step 3:** Start the Vite development server.
```bash
npm run dev
```

✅ The frontend will be live at **`http://localhost:5173`**

> **Note:** Ensure the backend server is running before using the frontend. The frontend calls `http://localhost:8000` by default.

---

## 📖 Usage Guide

1. **Open** the frontend in your browser at `http://localhost:5173`
2. **Upload Resume** — Click "Upload" and select any `.pdf` resume. The backend will extract text and build the semantic vector store.
3. **Analyze Resume** — Click "Analyze Resume" to detect the candidate's domain (e.g., GenAI, Web Development) and receive AI-powered suggestions.
4. **Get ATS Score** — Click "Get ATS Score" to see a 100-point score with a detailed breakdown across 7 categories, plus a list of missing skills for the detected domain.
5. **Generate Questions** — Click "Generate Questions" to receive 7 interview questions (3 Technical, 2 HR, 2 Project-based) tailored to the resume content and domain.
6. **Chat with Resume** — Type any question in the chat box (e.g., *"What are the candidate's top projects?"*) and receive a RAG-grounded answer sourced directly from the resume.

---

## 📊 ATS Scoring Model

The scoring engine (`ats_score.py`) uses a **rule-based, multi-weighted algorithm** across 7 categories:

| Category | Max Points | Scoring Logic |
|---|---|---|
| **Technical Skills** | 40 | Core AI/ML keywords (×2), related tech keywords (×1), proficiency multiplier |
| **Projects** | 15 | Project section presence, quantified metrics, deployment signals |
| **Experience** | 10 | Years of experience detected via regex; intern experience credited |
| **Achievements** | 10 | Awards, certifications, patents, publications detected |
| **Tools & Platforms** | 15 | Docker, Git, cloud platforms, databases, frameworks |
| **Education** | 5 | Degree level detected; CGPA/GPA mentioned |
| **Resume Structure** | 5 | Presence of standard sections; use of bullet points |

**Domain-aware missing skill detection** is also performed post-scoring:
- **GenAI domain** → checks for: `llm`, `rag`, `embeddings`, `vector database`
- **Web Development** → checks for: `react`, `node.js`, `database`, `api`

---

## 🔬 RAG Pipeline

The custom RAG implementation in `rag_pipeline.py` is entirely dependency-free from paid vector databases:

```
Resume PDF Text
      │
      ▼
RecursiveCharacterTextSplitter (chunk_size=400, overlap=50)
      │
      ▼
SentenceTransformer("all-MiniLM-L6-v2") → float32 embeddings
      │
      ▼
L2 Normalization → SimpleVectorStore (in-memory NumPy array)
      │
      ▼
Query → encode → cosine similarity → top-k chunks → LLM context
```

**Why this design?**
- No FAISS, Chroma, or Pinecone dependency — runs on any machine
- `all-MiniLM-L6-v2` is a fast, lightweight 384-dim model optimized for semantic similarity
- L2 normalization converts dot product to cosine similarity for accurate ranking

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Yes | Your OpenRouter API key for LLM access (GPT-4o-mini) |
| `OPENROUTER_MAX_TOKENS` | ❌ No | Centralized maximum token limit (integer clamped between 256 and 4096; defaults to 4096) |

Create a `.env` file in the project root:
```env
OPENROUTER_API_KEY="sk-or-v1-your-key-here"
OPENROUTER_MAX_TOKENS=4096
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

**Ideas for contributions:**
- Add support for DOCX resume formats
- Implement persistent storage (SQLite / PostgreSQL) for multi-user sessions
- Add a structured PDF export of the analysis report
- Build a comparison mode for multiple resumes

---

## 📄 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and distribute it for personal or commercial projects.

---

<div align="center">
  <p>Built with ❤️ using FastAPI, React, LangChain, and OpenRouter</p>
  <p>
    <a href="http://localhost:8000/docs">API Docs</a> •
    <a href="https://openrouter.ai">OpenRouter</a> •
    <a href="https://www.sbert.net/">Sentence Transformers</a>
  </p>
</div>
