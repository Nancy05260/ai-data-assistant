"""LLM 接入 - DeepSeek via LangChain ChatOpenAI"""
from langchain_openai import ChatOpenAI

from app.config import settings


def get_llm() -> ChatOpenAI:
    """返回配置好的 DeepSeek Chat 模型。base_url 需带 /v1。"""
    base_url = (settings.deepseek_base_url or "").rstrip("/")
    if base_url and not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1" if base_url else "https://api.deepseek.com/v1"
    if not base_url:
        base_url = "https://api.deepseek.com/v1"
    return ChatOpenAI(
        model="deepseek-chat",
        base_url=base_url,
        api_key=settings.deepseek_api_key or "",
        temperature=0,
        request_timeout=settings.llm_timeout,
        max_retries=settings.llm_max_retries,
    )
