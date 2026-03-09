"""NL2SQL Agent - create_agent + SQLDatabaseToolkit，返回 {sql, result, columns}"""
import os
import re
import sqlite3
from pathlib import Path
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain.agents import create_agent

from app.config import settings
from app.llm import get_llm

# 只允许 SELECT（含子查询、换行等）
SELECT_ONLY_PATTERN = re.compile(r"^\s*SELECT\s+", re.IGNORECASE | re.DOTALL)


def _validate_select_only(sql: str) -> bool:
    stripped = sql.strip()
    return bool(SELECT_ONLY_PATTERN.match(stripped)) and ";" not in stripped.split("--")[0]


def _run_select_with_limit(sql: str, db_path: str) -> tuple[list[str], list[list[Any]]]:
    """执行只读 SQL，最多返回 sql_result_limit 行。返回 (columns, rows)。"""
    if not _validate_select_only(sql):
        raise ValueError("仅允许执行 SELECT 语句")
    limit = max(1, min(settings.sql_result_limit, 500))
    sql_limited = sql.rstrip().rstrip(";")
    if " LIMIT " not in sql_limited.upper():
        sql_limited = f"{sql_limited} LIMIT {limit}"
    path = Path(db_path)
    if not path.is_absolute():
        path = Path(os.path.abspath(db_path))
    conn = sqlite3.connect(str(path))
    try:
        cur = conn.cursor()
        cur.execute(sql_limited)
        columns = [d[0] for d in cur.description] if cur.description else []
        rows = cur.fetchall()
        return columns, [list(r) for r in rows]
    finally:
        conn.close()


def _get_db() -> SQLDatabase:
    path = Path(settings.biz_db_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent.parent / path
    return SQLDatabase.from_uri(f"sqlite:///{path}")


def run_nl2sql(question: str, chat_history: list[dict] | None = None) -> dict[str, Any]:
    """
    执行 NL2SQL，返回 {"sql", "result", "columns", "answer", "truncated"}。
    chat_history 为 [{"role":"user"|"assistant","content":"..."}]，可为空。
    """
    db = _get_db()
    llm = get_llm()
    toolkit = SQLDatabaseToolkit(db=db, llm=llm)
    tools = toolkit.get_tools()
    system_prompt = """你是 SQL 助手，只能对数据库执行只读 SELECT 查询。
请先使用 sql_db_list_tables 查看表，再用 sql_db_schema 查看相关表结构，用 sql_db_query_checker 检查 SQL，最后用 sql_db_query 执行。
只生成 SELECT，不要 INSERT/UPDATE/DELETE。"""
    agent = create_agent(llm, tools=tools, system_prompt=system_prompt)
    messages = []
    if chat_history:
        for m in chat_history:
            role = m.get("role", "")
            content = m.get("content") or ""
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=question))
    result = agent.invoke({"messages": messages})
    msg_list = result.get("messages") or []
    sql = None
    columns = []
    rows = []
    answer = ""
    truncated = False
    for m in msg_list:
        if isinstance(m, AIMessage):
            if m.content and not getattr(m, "tool_calls", None):
                answer = m.content if isinstance(m.content, str) else str(m.content)
            if getattr(m, "tool_calls", None):
                for tc in m.tool_calls:
                    name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
                    args = tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", None)
                    if name == "sql_db_query" and args and isinstance(args, dict):
                        sql = args.get("query")
    if sql:
        db_path = Path(settings.biz_db_path)
        if not db_path.is_absolute():
            db_path = Path(__file__).resolve().parent.parent / db_path
        try:
            columns, rows = _run_select_with_limit(sql, str(db_path))
            if len(rows) >= settings.sql_result_limit:
                truncated = True
        except Exception as e:
            answer = str(e)
    return {
        "sql": sql or "",
        "columns": columns,
        "result": rows,
        "answer": answer,
        "truncated": truncated,
    }
