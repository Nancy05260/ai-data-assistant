"""图表配置生成 - LLM 分析查询结果输出 ECharts option"""
from typing import Literal

from pydantic import BaseModel, Field

from app.llm import get_llm


class ChartOutput(BaseModel):
    """图表生成器结构化输出"""
    chart_type: Literal["bar", "line", "pie", "scatter", "radar", "table"] = Field(
        description="图表类型；数据不适合图表时用 table"
    )
    option: dict = Field(default_factory=dict, description="ECharts option 对象，含 title/xAxis/yAxis/series 等")


def _result_preview(columns: list[str], result: list[list]) -> str:
    """将查询结果转为简短文本供 LLM 阅读"""
    if not columns:
        return "（无列）"
    lines = ["\t".join(columns)]
    for row in result[:20]:
        lines.append("\t".join(str(x) for x in row))
    if len(result) > 20:
        lines.append(f"... 共 {len(result)} 行")
    return "\n".join(lines)


def generate_chart(question: str, sql: str, columns: list[str], result: list[list]) -> ChartOutput:
    """
    根据用户问题、SQL 与查询结果生成图表配置。
    数据不适合图表时返回 chart_type="table"。
    """
    preview = _result_preview(columns, result)
    prompt = f"""用户问题：{question}
执行的 SQL：{sql}
查询结果（列名 + 前若干行）：
{preview}

请根据上述数据特征选择最合适的图表类型，并输出 ECharts 的 option JSON。
- 图表类型只能为：bar（柱状图）、line（折线图）、pie（饼图）、scatter（散点图）、radar（雷达图）、table（表格，当数据不适合用图表展示时选此项）。
- option 须为合法 JSON 对象，包含 title、xAxis、yAxis、series 等（饼图可为 title + series 且 series 中 data 为 {{name, value}} 数组）。
- 若数据只有一列或极难可视化，chart_type 选 table，option 可为 {{"title": {{"text": "数据表"}} }}。"""
    llm = get_llm()
    structured_llm = llm.with_structured_output(ChartOutput)
    out = structured_llm.invoke(prompt)
    if not isinstance(out, ChartOutput):
        return ChartOutput(chart_type="table", option={"title": {"text": "数据表"}})
    return out
