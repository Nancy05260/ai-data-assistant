import { useState, useEffect } from 'react'
import ChartRenderer from './ChartRenderer'

const MOCK_CHARTS = [
  {
    type: 'bar',
    option: {
      title: { text: '各品类销售额对比' },
      tooltip: {},
      xAxis: { type: 'category', data: ['电子', '服装', '家居', '食品', '美妆'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [32000, 18000, 15000, 12000, 8000], itemStyle: { color: '#3b82f6' } }],
    },
  },
  {
    type: 'pie',
    option: {
      title: { text: '销售占比' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: [
          { value: 32000, name: '电子' },
          { value: 18000, name: '服装' },
          { value: 15000, name: '家居' },
          { value: 12000, name: '食品' },
          { value: 8000, name: '美妆' },
        ],
      }],
    },
  },
  {
    type: 'line',
    option: {
      title: { text: '月度趋势' },
      tooltip: {},
      xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [120, 180, 150, 220, 190, 250], smooth: true }],
    },
  },
]

export default function ChartPanel({ selectedMessage }) {
  const [chartIndex, setChartIndex] = useState(0)
  const charts = MOCK_CHARTS
  useEffect(() => {
    if (selectedMessage?.chartIndex != null) setChartIndex(selectedMessage.chartIndex)
  }, [selectedMessage?.id])
  const current = charts[chartIndex] || charts[0]

  if (!current) {
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

  return (
    <div className="flex flex-col h-full bg-slate-50 w-[400px] shrink-0 border-l border-slate-200">
      <div className="p-3 border-b border-slate-200 flex gap-2 flex-wrap">
        {charts.length > 1 && charts.map((_, i) => (
          <button
            key={i}
            onClick={() => setChartIndex(i)}
            className={`px-3 py-1.5 rounded text-sm ${
              chartIndex === i ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {['柱状图', '饼图', '折线图'][i] || `图表 ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ChartRenderer
          option={current.option}
          chartType={current.chart_type || current.type}
        />
      </div>
    </div>
  )
}
