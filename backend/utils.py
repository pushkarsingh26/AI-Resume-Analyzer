import os

def get_openai_client():
    from openai import OpenAI
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Set OPENROUTER_API_KEY environment variable")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
