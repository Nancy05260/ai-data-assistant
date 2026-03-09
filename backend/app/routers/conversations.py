"""会话管理 API - GET/POST/DELETE /api/conversations, GET messages"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.memory import clear_memory
from app.models import Conversation, Message

router = APIRouter(prefix="/api", tags=["conversations"])


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db)):
    """列表，按 updated_at 倒序"""
    items = db.query(Conversation).order_by(Conversation.updated_at.desc()).all()
    return [
        {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat(), "updated_at": c.updated_at.isoformat()}
        for c in items
    ]


@router.post("/conversations")
def create_conversation(db: Session = Depends(get_db)):
    """新建会话，标题默认「新会话」"""
    c = Conversation(title="新会话")
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat(), "updated_at": c.updated_at.isoformat()}


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """删除会话，级联删除消息"""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="会话不存在")
    db.delete(c)
    db.commit()
    clear_memory(conversation_id)
    return None


@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    """获取会话消息，按 created_at 正序"""
    c = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="会话不存在")
    msgs = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sql_query": m.sql_query,
            "query_result": m.query_result,
            "chart_config": m.chart_config,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]
