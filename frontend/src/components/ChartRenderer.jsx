import ReactECharts from 'echarts-for-react'

export default function ChartRenderer({ option, chartType = 'chart' }) {
  if (chartType === 'table') {
    return (
      <div className="overflow-x-auto text-sm">
        <table className="min-w-full border border-slate-200">
          <thead>
            <tr className="bg-slate-50">
              {(option?.columns || []).map((col, i) => (
                <th key={i} className="px-4 py-2 border-b text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(option?.rows || []).map((row, i) => (
              <tr key={i} className="border-b hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!option || !option.series) {
    return null
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', minHeight: 280 }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
