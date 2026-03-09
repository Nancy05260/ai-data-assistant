# 智能数据分析系统

基于 DeepSeek v3 + LangChain + FastAPI + React 构建的智能数据分析系统。用户通过自然语言提问，系统自动生成 SQL 查询数据库并以可视化图表展示结果。

---

## 产品功能

### 这个工具能干什么

- **自然语言查数据**：用一句话描述你想看的数据（如「各品类商品的销售额对比」「哪个城市的客户最多」），系统自动把问题转成 SQL 并执行。
- **结果可视化**：根据查询结果自动推荐合适的图表类型（柱状图、折线图、饼图、散点图、雷达图或表格），在右侧面板实时展示。
- **多会话管理**：支持新建多个会话、切换会话、删除会话；每个会话有独立的对话历史和上下文记忆，追问（如「那第二多的呢」）会结合上一轮结果回答。
- **流式体验**：发送问题后，中间面板会流式展示「正在分析…」、生成的 SQL、文字回答；右侧在收到图表配置后立即渲染，无需等整轮结束。

### 怎么用

1. **新建或选择会话**：左侧栏点击「新建会话」，或点选已有会话。
2. **输入问题**：在中间输入框用自然语言描述你想分析的内容，例如：
   - 「各品类商品的销售额对比」
   - 「北京、上海、深圳的订单数量」
   - 「销量前 5 的商品是哪些」
3. **查看结果**：中间会依次出现生成的 SQL 与文字分析；右侧会显示对应图表，可点击历史消息再次查看该条回复的图表。
4. **追问**：在同一会话内继续提问（如「用饼图展示」「那第二多的呢」），系统会结合上下文回答。

### 怎么启动

**前置**：在 `backend` 目录下配置 `.env`（至少填写 `DEEPSEEK_API_KEY`），首次使用需执行一次 `python data/seed_data.py` 初始化业务数据。

```bash
# 1. 启动后端（在 backend 目录）
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 2. 启动前端（新开终端，在 frontend 目录）
cd frontend
npm install
npm run dev
```

浏览器访问前端给出的地址（通常为 `http://localhost:5173`），即可使用。后端 API 文档：`http://localhost:8000/docs`。

---

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

详见上文 **「产品功能 → 怎么启动」**。简要命令：

```bash
# 后端（需先配置 .env 并可选执行 seed_data.py）
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# 前端（新终端）
cd frontend && npm run dev
```