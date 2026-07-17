import re

def calculate_ats_score(text: str, domain: str = "General") -> dict:
    resume_text = text.lower()
    lines = [l.strip() for l in resume_text.splitlines() if l.strip()]

    def contains_any(words):
        return any(w in resume_text for w in words)

    core_skills = ["llm", "rag", "langchain", "faiss", "embeddings", "vector database", "chromadb", "transformers", "sentence-transformers", "react", "node.js", "api", "machine learning"]
    related_skills = ["python", "pandas", "numpy", "fastapi", "docker", "streamlit", "sql", "mysql", "postgresql", "git", "github", "javascript", "html", "css", "c", "c++"]
    proficiency_tokens = ["expert", "proficient", "strong", "experienced", "familiar with", "familiar"]
    bullet_chars = ("-", "*", "•", "▪", "◦", "–", "—")

    # Technical Skills (40)
    technical_max = 40
    core_matches = sum(1 for s in core_skills if s in resume_text)
    related_matches = sum(1 for s in related_skills if s in resume_text)
    prof_mult = 1.0 + (0.25 if contains_any(proficiency_tokens) else 0.0)
    raw_tech = (core_matches * 2 + related_matches * 1) * prof_mult
    technical_score = min(technical_max, int(round(raw_tech * (technical_max / max(1, (len(core_skills)*2 + len(related_skills)))))))

    # Projects (15)
    project_max = 15
    project_section_count = len(re.findall(r"\bprojects?\b", resume_text))
    project_bullets = sum(1 for l in lines if ("project" in l or any(t in l for t in core_skills+related_skills)) and (l.startswith(bullet_chars) or (l and l[0].isdigit())))
    project_score = 0
    if project_section_count > 0 or project_bullets > 0:
        project_score += 4
    project_score += min(6, project_bullets)
    if re.search(r"\d+%|\d+\s*\+|\d+\s+years|\b\d{1,2}\b\s+months", resume_text):
        project_score += 3
    if contains_any(["deployed", "deployment", "hosted", "live", "hugging face", "aws", "gcp", "azure"]):
        project_score += 1
    project_score = min(project_max, project_score)

    # Experience (10)
    experience_max = 10
    experience_score = 0
    years = 0
    m = re.findall(r"(\d+)\s*(?:\+|plus)?\s*years?", resume_text)
    if m:
        years = max(int(x) for x in m)
    else:
        m2 = re.findall(r"experience\s*[:\-]?\s*(\d+)\s*(?:\+|plus)?\s*years?", resume_text)
        if m2:
            years = max(int(x) for x in m2)
    if years >= 4:
        experience_score = 10
    elif years >= 2:
        experience_score = 7
    elif years >= 1:
        experience_score = 5
    elif contains_any(["internship", "intern"]):
        experience_score = 5

    # Achievements (10)
    ach_max = 10
    ach_keywords = ["award", "winner", "certification", "published", "paper", "patent", "copyright", "recognition"]
    ach_count = sum(1 for k in ach_keywords if k in resume_text)
    ach_score = min(ach_max, ach_count * 2)
    if "patent" in resume_text or "copyright" in resume_text or "intellectual property" in resume_text:
        ach_score = min(ach_max, ach_score + 2)

    # Tools & Platforms (15)
    tools = ["docker", "git", "github", "streamlit", "fastapi", "mysql", "faiss", "hugging face", "postgresql", "aws", "gcp", "azure", "linux"]
    tool_matches = [t for t in tools if t in resume_text]
    tool_score = min(15, len(tool_matches) * 2)
    if any(c in resume_text for c in ["aws", "gcp", "azure"]) and ("git" in resume_text or "github" in resume_text):
        tool_score = min(15, tool_score + 1)

    # Education (5)
    edu_score = 0
    if contains_any(["b.tech", "bachelor", "b.sc", "m.tech", "master", "bs", "ms", "degree"]):
        edu_score += 3
    if "cgpa" in resume_text or re.search(r"\b\d\.\d{1,2}\b", resume_text):
        edu_score += 2
    edu_score = min(5, edu_score)

    # Structure (5)
    structure_score = 0
    sections = ["education", "projects", "skills", "achievements", "experience", "contact"]
    structure_score += sum(1 for s in sections if s in resume_text)
    bullets = sum(1 for l in lines if l.startswith(bullet_chars))
    if bullets > 5:
        structure_score += 1
    structure_score = min(5, structure_score)

    raw_breakdown = {
        "Technical Skills": technical_score,
        "Projects": project_score,
        "Experience": experience_score,
        "Achievements": ach_score,
        "Tools & Platforms": tool_score,
        "Education": edu_score,
        "Resume Structure": structure_score,
    }
    raw_total = sum(raw_breakdown.values())

    missing_skills = []
    if domain.lower() == "genai":
        req = ["llm", "rag", "embeddings", "vector database"]
        missing_skills = [s for s in req if s not in resume_text]
    elif domain.lower() == "web development":
        req = ["react", "node.js", "database", "api"]
        missing_skills = [s for s in req if s not in resume_text]
    
    return {
        "total_score": raw_total,
        "breakdown": raw_breakdown,
        "missing_skills": missing_skills
    }
