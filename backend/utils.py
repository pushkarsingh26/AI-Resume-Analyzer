import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

import os
import logging
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("openrouter_client")

# Centralized token configurations
TOKEN_LIMIT_FAST = 1024
TOKEN_LIMIT_NORMAL = 2048
TOKEN_LIMIT_DEEP = 4096

def get_max_tokens_config() -> int:
    env_val = os.getenv("OPENROUTER_MAX_TOKENS")
    if not env_val:
        return TOKEN_LIMIT_DEEP
    try:
        val = int(env_val)
        clamped = max(256, min(4096, val))
        return clamped
    except Exception:
        logger.warning(f"Invalid OPENROUTER_MAX_TOKENS value '{env_val}'. Falling back to {TOKEN_LIMIT_DEEP}.")
        return TOKEN_LIMIT_DEEP

def get_openai_client():
    from openai import OpenAI
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Set OPENROUTER_API_KEY environment variable")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

def create_chat_completion(
    messages: list,
    model: str = "openai/gpt-4o-mini",
    tier: str = "normal"
) -> str:
    # 1. Determine base max_tokens based on tier and active env config
    limit = get_max_tokens_config()
    
    if tier == "fast":
        base_tokens = min(TOKEN_LIMIT_FAST, limit)
    elif tier == "normal":
        base_tokens = min(TOKEN_LIMIT_NORMAL, limit)
    elif tier == "deep":
        base_tokens = limit
    else:
        base_tokens = min(TOKEN_LIMIT_NORMAL, limit)
        
    client = get_openai_client()
    
    def log_structure(attempt: int, token_count: int, status: int, error_msg: str = "", retry_count: int = 0):
        # Structured logger formatting
        logger.info(
            f"[Structured Log] OpenRouter Call | "
            f"model='{model}' | "
            f"requested_max_tokens={token_count} | "
            f"retry_token_count={retry_count} | "
            f"http_status={status} | "
            f"error_message='{error_msg}'"
        )

    # First attempt
    current_tokens = base_tokens
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=current_tokens
        )
        log_structure(attempt=1, token_count=current_tokens, status=200)
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        error_msg = str(e)
        status_code = getattr(e, "status_code", None)
        if status_code is None:
            resp = getattr(e, "response", None)
            if resp is not None:
                status_code = getattr(resp, "status_code", None)
                
        is_402 = (status_code == 402) or ("402" in error_msg) or ("credit" in error_msg.lower())
        
        if is_402:
            # Automatic retry logic: Retry once with half max_tokens
            retry_tokens = max(256, current_tokens // 2)
            log_structure(attempt=1, token_count=current_tokens, status=status_code or 402, error_msg=error_msg, retry_count=retry_tokens)
            logger.warning(f"Credit limit / token budget hit (402). Retrying once with half tokens: {retry_tokens} (originally {current_tokens})")
            
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=retry_tokens
                )
                log_structure(attempt=2, token_count=retry_tokens, status=200)
                return response.choices[0].message.content.strip()
            except Exception as retry_e:
                retry_error_msg = str(retry_e)
                retry_status_code = getattr(retry_e, "status_code", None)
                if retry_status_code is None:
                    retry_resp = getattr(retry_e, "response", None)
                    if retry_resp is not None:
                        retry_status_code = getattr(retry_resp, "status_code", None)
                
                log_structure(attempt=2, token_count=retry_tokens, status=retry_status_code or 402, error_msg=retry_error_msg)
                raise HTTPException(
                    status_code=402,
                    detail="OpenRouter request exceeded your available credits or token budget. Try reducing the response length or add credits to your OpenRouter account."
                )
        else:
            # Other errors
            log_structure(attempt=1, token_count=current_tokens, status=status_code or 500, error_msg=error_msg)
            raise HTTPException(
                status_code=status_code or 500,
                detail=f"OpenRouter API error: {error_msg}"
            )
