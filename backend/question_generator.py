# pyrefly: ignore [missing-import]
from utils import create_chat_completion

def generate_interview_questions(context: str, domain: str) -> dict:
    prompt = f"""
    Based on the following resume context and domain '{domain}', generate interview questions.
    Resume Context:
    {context}
    
    Return exactly 3 Technical Questions, 2 HR Questions, and 2 Project/Viva Questions.
    Format your response cleanly. Do not include extra conversational text.
    """
    
    text = create_chat_completion(
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer."},
            {"role": "user", "content": prompt}
        ],
        tier="normal"
    )
    return {"questions": text}
    
def detect_domain_from_context(context: str) -> str:
    domain_prompt = f"""
    Detect the candidate's primary technical domain from the resume context.

    Resume Context:
    {context}

    Return ONLY one domain name.

    Possible Domains:
    - GenAI
    - Web Development
    - Data Science
    - Backend Development
    - Cybersecurity
    - DevOps
    - Mobile App Development
    """
    
    return create_chat_completion(
        messages=[
            {"role": "system", "content": "You are an expert technical recruiter."},
            {"role": "user", "content": domain_prompt}
        ],
        tier="fast"
    )

def analyze_with_llm(context: str, domain: str, query: str = "Analyze this resume and provide brief AI suggestions.") -> str:
    prompt = f"""
    You are an expert ATS Resume Analyzer.
    Candidate Domain: {domain}
    Use ONLY the provided resume context.

    Resume Context:
    {context}

    User Question:
    {query}

    Rules:
    - Do not hallucinate
    - Do not invent skills
    - Be specific
    - Keep answers professional and concise
    """
    
    return create_chat_completion(
        messages=[
            {"role": "system", "content": f"You are an expert ATS resume analyzer specialized in {domain}."},
            {"role": "user", "content": prompt}
        ],
        tier="deep"
    )

def answer_custom_query(context: str, query: str) -> str:
    prompt = f"""
    You are an AI assistant answering questions about a candidate's resume.
    Use ONLY the provided resume context below.
    If the answer cannot be found in the context, politely state that you do not have enough information from the resume.

    Resume Context:
    {context}

    Question:
    {query}
    """
    
    return create_chat_completion(
        messages=[
            {"role": "system", "content": "You are a helpful and professional AI assistant."},
            {"role": "user", "content": prompt}
        ],
        tier="normal"
    )
