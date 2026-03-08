import { FiPlus, FiMessageSquare, FiTrash2 } from 'react-icons/fi'

const MOCK_CONVERSATIONS = [
  { id: '1', title: '各品类销售额对比', updatedAt: '2026-03-08 14:30' },
  { id: '2', title: '城市客户分布分析', updatedAt: '2026-03-08 13:15' },
  { id: '3', title: '月度订单趋势', updatedAt: '2026-03-08 12:00' },
  { id: '4', title: '新会话', updatedAt: '2026-03-08 11:45' },
]

export default function Sidebar({
  conversations = MOCK_CONVERSATIONS,
  activeId,
  onSelect,
  onNew,
  onDelete,
  hoverId,
  onHover,
}) {
  return (
    <div className="flex flex-col h-full bg-slate-800 text-slate-100 w-[250px] shrink-0">
      <button
        onClick={onNew}
        className="flex items-center gap-2 m-3 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
      >
        <FiPlus className="w-5 h-5" />
        新建会话
      </button>
      <div className="flex-1 overflow-y-auto px-2">
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
              <p className="text-xs text-slate-500">{c.updatedAt}</p>
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
