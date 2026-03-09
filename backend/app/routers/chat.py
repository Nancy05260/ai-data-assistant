"""POST /api/chat - SSE 流式对话，整合 SQL Agent + Chart + Memory"""
import json
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.memory import get_memory
from app.models import Conversation, Message
from app.sql_agent import run_nl2sql
from app.chart_generator import generate_chart

router = APIRouter(prefix="/api", tags=["chat"])


class ChatBody(BaseModel):
    conversation_id: str
    message: str


def _sse_event(event: str, data: str | dict) -> dict:
    if isinstance(data, dict):
        data = json.dumps(data, ensure_ascii=False)
    return {"event": event, "data": data}


async def _stream_chat(conversation_id: str, user_message: str, db: Session) -> AsyncGenerator[dict, None]:
    """串联：保存用户消息 -> 加载 memory -> SQL Agent -> Chart -> 保存助手消息 -> 推送 SSE"""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        yield _sse_event("error", "会话不存在")
        yield _sse_event("done", "")
        return
    # 保存用户消息
    user_msg = Message(conversation_id=conversation_id, role="user", content=user_message)
    db.add(user_msg)
    db.commit()
    # 加载历史用于 memory 和 agent
    history_rows = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in history_rows[:-1]]  # 不含刚加的这条
    memory = get_memory(conversation_id, initial_history=history)
    chat_history = memory.chat_history
    try:
        yield _sse_event("thinking", "正在分析...")
        out = run_nl2sql(user_message, chat_history=chat_history if chat_history else None)
    except Exception as e:
        yield _sse_event("error", str(e))
        yield _sse_event("done", "")
        return
    sql = out.get("sql") or ""
    columns = out.get("columns") or []
    result = out.get("result") or []
    answer = out.get("answer") or ""
    truncated = out.get("truncated", False)
    if truncated:
        answer = (answer + "\n\n（结果已截断至 %d 行）") % len(result)
    if sql:
        yield _sse_event("sql", sql)
    yield _sse_event("answer", answer)
    chart_config = None
    if columns and result:
        try:
            chart_out = generate_chart(user_message, sql, columns, result)
            chart_config = {"chart_type": chart_out.chart_type, "option": chart_out.option}
            yield _sse_event("chart", chart_config)
        except Exception as e:
            yield _sse_event("error", f"图表生成失败: {e}")
    # 保存助手消息
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
        sql_query=sql or None,
        query_result=result if result else None,
        chart_config=chart_config,
    )
    db.add(assistant_msg)
    memory.add_user_message(user_message)
    memory.add_ai_message(answer)
    # 首次消息时更新会话标题（简化为取问题前 20 字）
    if len(history_rows) == 1:
        conv.title = user_message[:20] + ("..." if len(user_message) > 20 else "")
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    yield _sse_event("done", "")


@router.post("/chat")
def chat(body: ChatBody, db: Session = Depends(get_db)):
    """SSE 流式对话"""
    return EventSourceResponse(
        _stream_chat(body.conversation_id, body.message, db),
        media_type="text/event-stream",
    )
