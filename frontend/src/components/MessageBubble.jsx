import { useState, useEffect } from 'react'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('sql', sql)

export default function MessageBubble({ message, onSelect }) {
  const [sqlExpanded, setSqlExpanded] = useState(true)
  const isUser = message.role === 'user'

  useEffect(() => {
    if (message.sql_query) {
      document.querySelectorAll('.message-sql pre code').forEach((el) => {
        hljs.highlightElement(el)
      })
    }
  }, [message.sql_query])

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${!isUser ? 'cursor-pointer' : ''}`}
      onClick={!isUser ? () => onSelect?.(message) : undefined}
    >
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 text-slate-800 border border-slate-200'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {!isUser && message.sql_query && (
          <div className="mt-3 message-sql">
            <button
              onClick={() => setSqlExpanded(!sqlExpanded)}
              className="text-xs text-slate-500 hover:text-slate-700 mb-1"
            >
              {sqlExpanded ? '收起 SQL' : '展开 SQL'}
            </button>
            {sqlExpanded && (
              <pre className="rounded-lg bg-slate-800 p-3 overflow-x-auto text-xs">
                <code className="language-sql">{message.sql_query}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
