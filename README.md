# 智能数据分析系统

基于 DeepSeek v3 + LangChain + FastAPI + React 构建的智能数据分析系统。用户通过自然语言提问，系统自动生成 SQL 查询数据库并以可视化图表展示结果。分 4 个 Phase 迭代开发。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React、Tailwind v4、ECharts、Axios |
| 后端 | FastAPI、SQLAlchemy、LangChain、DeepSeek v3、sse-starlette |
| 数据库 | app.db（会话/消息）、business.db（电商示例数据） |

## 开发环境

- Python 3.10+
- Node.js 18+
- Git 2.x

## 环境变量 (.env)

```env
DEEPSEEK_API_KEY=sk-xxx          # DeepSeek API 密钥 (必填)
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1  # 需带 /v1
APP_DB_PATH=./app.db
BIZ_DB_PATH=./data/business.db
LLM_TIMEOUT=30
LLM_MAX_RETRIES=2
SQL_RESULT_LIMIT=200
```

## 项目结构

```
data-analyst/
├── backend/          # FastAPI 后端
├── frontend/         # Vite + React 前端
└── README.md
```

## 开发阶段

| Phase | 内容 |
|-------|------|
| P0 | 开发环境准备 |
| P1 | 前后端脚手架 & 运行验证 |
| P2 | 前端 UI（Sidebar / ChatPanel / ChartPanel）|
| P3 | 后端接口（NL2SQL、图表生成、SSE、会话管理）|
| P4 | 前后端联调 & 端到端测试 |

## Phase 3 开发规范（LLM 与 SSE）

- **LLM**：`model=deepseek-chat`，`base_url=https://api.deepseek.com/v1`（LangChain 用 `ChatOpenAI` 兼容接口）。
- **AIMessage**：`content`、`response_metadata`（含 `finish_reason`、`token_usage`）、`tool_calls`（每项含 `name`、`args`、`id`、`type: "tool_call"`）。
- **流式**：AIMessageChunk 需累积 `content`；可有 `tool_call_chunks`。
- **SSE 事件**：`thinking` | `sql` | `answer` | `chart` | `error` | `done`，payload 结构见仓库内 Plan 文件「Phase 3 开发规范」章节。

完整字段与示例见项目 Plan：`.cursor/plans/` 下对应 `.plan.md`。

**接口规范**：REST（会话 CRUD、健康检查）、POST /api/chat 请求体与 SSE 事件约定、图表 chart 格式等见 Plan 内「接口规范汇总」小节。

## 快速开始

```bash
# 后端
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端
cd frontend && npm install && npm run dev
```