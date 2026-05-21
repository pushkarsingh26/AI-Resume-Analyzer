from utils import get_openai_client

def generate_interview_questions(context: str, domain: str) -> dict:
    client = get_openai_client()
    prompt = f"""
    Based on the following resume context and domain '{domain}', generate interview questions.
    Resume Context:
    {context}
    
    Return exactly 3 Technical Questions, 2 HR Questions, and 2 Project/Viva Questions.
    Format your response cleanly. Do not include extra conversational text.
    """
    
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer."},
            {"role": "user", "content": prompt}
        ]
    )
    
    text = response.choices[0].message.content.strip()
    return {"questions": text}
    
def detect_domain_from_context(context: str) -> str:
    client = get_openai_client()
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
    
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert technical recruiter."},
            {"role": "user", "content": domain_prompt}
        ]
    )
    
    return response.choices[0].message.content.strip()

def analyze_with_llm(context: str, domain: str, query: str = "Analyze this resume and provide brief AI suggestions.") -> str:
    client = get_openai_client()
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
    
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"You are an expert ATS resume analyzer specialized in {domain}."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content.strip()

def answer_custom_query(context: str, query: str) -> str:
    client = get_openai_client()
    prompt = f"""
    You are an AI assistant answering questions about a candidate's resume.
    Use ONLY the provided resume context below.
    If the answer cannot be found in the context, politely state that you do not have enough information from the resume.

    Resume Context:
    {context}

    Question:
    {query}
    """
    
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful and professional AI assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content.strip()

