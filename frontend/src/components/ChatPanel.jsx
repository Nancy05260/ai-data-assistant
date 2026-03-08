import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

const MOCK_SQL = `SELECT category, SUM(quantity * unit_price) AS total_sales
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY category
ORDER BY total_sales DESC;`

export default function ChatPanel({ messages = [], onSend, onMessageSelect, activeConversationId }) {
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState(messages)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  const displayMessages = messages.length ? messages : localMessages

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [displayMessages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: text }
    setLocalMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Mock 延迟返回
    setTimeout(() => {
      const chartIndex = Math.floor(Math.random() * 3)
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `根据您的问题「${text}」，我分析了销售数据。各品类销售额对比如下：\n\n电子类产品销售额最高，其次是服装和家居。`,
        sql_query: MOCK_SQL,
        chartIndex,
      }
      setLocalMessages((prev) => [...prev, assistantMsg])
      setLoading(false)
      onSend?.(userMsg, assistantMsg)
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white flex-1 min-w-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {displayMessages.length === 0 && (
          <p className="text-slate-400 text-center py-8 text-sm">
            输入数据问题，获取分析结果
          </p>
        )}
        {displayMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onSelect={m.role === 'assistant' ? onMessageSelect : undefined}
          />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-xl px-4 py-2 text-slate-500 text-sm">
              正在分析...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入数据问题，如：各品类商品的销售额对比"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Enter 发送 / Shift+Enter 换行</p>
      </div>
    </div>
  )
}
