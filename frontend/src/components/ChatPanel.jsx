import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import { streamChat } from '../services/api'

export default function ChatPanel({
  messages = [],
  activeConversationId,
  onMessageSelect,
  onStreamStart,
  onStreamDone,
  onChart,
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamError, setStreamError] = useState(null)
  const [streamingMsg, setStreamingMsg] = useState(null)
  const scrollRef = useRef(null)

  const displayMessages = [...messages, ...(streamingMsg ? [streamingMsg] : [])]

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [displayMessages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading || !activeConversationId) return

    setStreamError(null)
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    onStreamStart?.(userMsg)
    setInput('')
    setLoading(true)
    setStreamingMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      sql_query: null,
      query_result: null,
      chart_config: null,
      created_at: new Date().toISOString(),
    })

    streamChat(activeConversationId, text, {
      onThinking: () => {},
      onSql: (sql) => {
        setStreamingMsg((prev) => (prev ? { ...prev, sql_query: sql } : null))
      },
      onAnswer: (chunk) => {
        setStreamingMsg((prev) => (prev ? { ...prev, content: (prev.content || '') + chunk } : null))
      },
      onChart: (config) => {
        setStreamingMsg((prev) => (prev ? { ...prev, chart_config: config } : null))
        onChart?.(config)
      },
      onError: (errMsg) => {
        setStreamError(typeof errMsg === 'string' ? errMsg : '请求出错，请重试')
        setLoading(false)
        setStreamingMsg(null)
      },
      onDone: () => {
        setLoading(false)
        setStreamingMsg((prev) => {
          if (prev) onStreamDone?.(prev)
          return null
        })
      },
    }).catch((err) => {
      setStreamError(err?.message || '连接已断开，请重试')
      setLoading(false)
      setStreamingMsg(null)
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const noConversation = !activeConversationId

  return (
    <div className="flex flex-col h-full bg-white flex-1 min-w-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {noConversation && (
          <p className="text-slate-400 text-center py-8 text-sm">
            请先新建或选择一个会话
          </p>
        )}
        {!noConversation && displayMessages.length === 0 && (
          <p className="text-slate-400 text-center py-8 text-sm">
            输入数据问题，获取分析结果
          </p>
        )}
        {!noConversation && displayMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onSelect={m.role === 'assistant' ? onMessageSelect : undefined}
          />
        ))}
        {streamError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-red-700 text-sm">
            {streamError}
          </div>
        )}
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
            disabled={noConversation || loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || noConversation}
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
