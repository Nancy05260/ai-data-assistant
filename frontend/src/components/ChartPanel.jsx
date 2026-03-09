import ChartRenderer from './ChartRenderer'

/**
 * 与后端 chart 事件 / GET messages 的 chart_config 一致：{ chart_type, option }
 * chart_type: bar | line | pie | scatter | radar | table
 * liveChartConfig: 当前 SSE 流式推送的图表，优先于 selectedMessage
 */
export default function ChartPanel({ selectedMessage, liveChartConfig }) {
  const chart_config = liveChartConfig ?? selectedMessage?.chart_config
  const chartType = chart_config?.chart_type ?? null
  const option = chart_config?.option ?? null
  const query_result = selectedMessage?.query_result

  if (!chart_config || !chartType) {
    return (
      <div className="flex flex-col h-full bg-slate-50 w-[400px] shrink-0 border-l border-slate-200">
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-slate-500 text-sm">
            提出数据问题，图表将在此展示
          </p>
        </div>
      </div>
    )
  }

  const rows = Array.isArray(query_result) ? query_result : option?.rows
  const tableOption =
    chartType === 'table'
      ? {
          ...option,
          columns: option?.columns ?? (rows?.[0] ? rows[0].map((_, i) => `列${i + 1}`) : []),
          rows: rows ?? [],
        }
      : option

  return (
    <div className="flex flex-col h-full bg-slate-50 w-[400px] shrink-0 border-l border-slate-200">
      <div className="flex-1 overflow-auto p-4">
        <ChartRenderer option={tableOption} chartType={chartType} />
      </div>
    </div>
  )
}
