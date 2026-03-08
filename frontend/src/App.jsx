import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import ChartPanel from './components/ChartPanel'

const INITIAL_CONVERSATIONS = [
  { id: '1', title: '各品类销售额对比', updatedAt: '2026-03-08 14:30' },
  { id: '2', title: '城市客户分布分析', updatedAt: '2026-03-08 13:15' },
  { id: '3', title: '月度订单趋势', updatedAt: '2026-03-08 12:00' },
  { id: '4', title: '新会话', updatedAt: '2026-03-08 11:45' },
]

export default function App() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [activeConversationId, setActiveConversationId] = useState('1')
  const [hoverId, setHoverId] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)

  const handleNewConversation = () => {
    const id = String(Date.now())
    setConversations((prev) => [
      { id, title: '新会话', updatedAt: new Date().toLocaleString('zh-CN') },
      ...prev,
    ])
    setActiveConversationId(id)
  }

  const handleDeleteConversation = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || null)
    }
  }

  const handleUpdateConversationTitle = (convId, title) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, title, updatedAt: new Date().toLocaleString('zh-CN') } : c
      )
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        hoverId={hoverId}
        onHover={setHoverId}
      />
      <ChatPanel
        key={activeConversationId}
        activeConversationId={activeConversationId}
        onMessageSelect={setSelectedMessage}
        onSend={(userMsg, assistantMsg) => {
          if (assistantMsg && conversations.find((c) => c.id === activeConversationId)?.title === '新会话') {
            handleUpdateConversationTitle(
              activeConversationId,
              userMsg.content.slice(0, 20) + (userMsg.content.length > 20 ? '...' : '')
            )
          }
        }}
      />
      <ChartPanel selectedMessage={selectedMessage} />
    </div>
  )
}
