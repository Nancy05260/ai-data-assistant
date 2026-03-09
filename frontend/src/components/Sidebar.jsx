import { FiPlus, FiMessageSquare, FiTrash2 } from 'react-icons/fi'

/** 后端返回字段：id, title, created_at, updated_at (ISO 字符串) */
function formatUpdatedAt(updated_at) {
  if (!updated_at) return ''
  try {
    const d = new Date(updated_at)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return updated_at
  }
}

export default function Sidebar({
  conversations = [],
  activeId,
  onSelect,
  onNew,
  onDelete,
  hoverId,
  onHover,
  loading = false,
  error = null,
}) {
  return (
    <div className="flex flex-col h-full bg-slate-800 text-slate-100 w-[250px] shrink-0">
      {error && (
        <div className="mx-3 mt-2 px-3 py-2 rounded bg-red-900/50 text-red-200 text-xs">
          {error}
        </div>
      )}
      <button
        onClick={onNew}
        disabled={loading}
        className="flex items-center gap-2 m-3 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
      >
        <FiPlus className="w-5 h-5" />
        新建会话
      </button>
      <div className="flex-1 overflow-y-auto px-2">
        {loading && conversations.length === 0 && (
          <p className="px-3 py-2 text-slate-400 text-sm">加载中...</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onMouseEnter={() => onHover?.(c.id)}
            onMouseLeave={() => onHover?.(null)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeId === c.id ? 'bg-slate-600' : 'hover:bg-slate-700'
            }`}
            onClick={() => onSelect?.(c.id)}
          >
            <FiMessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{c.title}</p>
              <p className="text-xs text-slate-500">{formatUpdatedAt(c.updated_at)}</p>
            </div>
            {hoverId === c.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(c.id)
                }}
                className="p-1 rounded hover:bg-red-500/30 text-slate-400 hover:text-red-400"
                title="删除"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
