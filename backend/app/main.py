"""FastAPI 入口 - CORS 配置与路由挂载"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import chat, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="智能数据分析系统 API",
    description="自然语言转 SQL + ECharts 可视化",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS - 允许前端 localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(conversations.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    """健康检查"""
    return {"status": "ok"}
