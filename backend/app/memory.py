"""上下文记忆 - 按会话保留最近 K 轮对话，用于 NL2SQL 上下文"""
from collections import deque

K = 10  # 保留最近 10 轮（每轮 user+assistant 算 2 条）
_memory_store: dict[str, deque[dict]] = {}


def get_memory(conversation_id: str, initial_history: list[dict] | None = None) -> "MemoryAdapter":
    """获取或创建该会话的 memory；initial_history 用于从 DB 恢复。"""
    if conversation_id not in _memory_store:
        _memory_store[conversation_id] = deque(maxlen=K * 2)
        if initial_history:
            for m in initial_history[-K * 2 :]:
                _memory_store[conversation_id].append({"role": m.get("role", ""), "content": m.get("content") or ""})
    return MemoryAdapter(conversation_id)


def clear_memory(conversation_id: str) -> None:
    """删除会话的 memory（会话被删除时调用）"""
    _memory_store.pop(conversation_id, None)


class MemoryAdapter:
    """简单适配：提供 add_user_message / add_ai_message 和 chat_history 列表供 agent 使用。"""

    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self._q = _memory_store[conversation_id]

    @property
    def chat_history(self) -> list[dict]:
        return list(self._q)

    def add_user_message(self, content: str) -> None:
        self._q.append({"role": "user", "content": content})

    def add_ai_message(self, content: str) -> None:
        self._q.append({"role": "assistant", "content": content})
