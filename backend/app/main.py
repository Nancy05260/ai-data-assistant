"""FastAPI 入口 - CORS 配置与路由挂载"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="智能数据分析系统 API",
    description="自然语言转 SQL + ECharts 可视化",
    version="0.1.0",
)

# CORS - 允许前端 localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    """健康检查"""
    return {"status": "ok"}
