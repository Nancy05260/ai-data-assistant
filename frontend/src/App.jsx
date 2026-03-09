import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import ChartPanel from './components/ChartPanel'
import { getConversations, createConversation, deleteConversation, getMessages } from './services/api'

export default function App() {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [currentMessages, setCurrentMessages] = useState([])
  const [liveChartConfig, setLiveChartConfig] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loadingConv, setLoadingConv] = useState(true)
  const [convError, setConvError] = useState(null)

  useEffect(() => {
    setConvError(null)
    getConversations()
      .then((list) => {
        setConversations(list)
        if (list.length > 0 && !activeConversationId) setActiveConversationId(list[0].id)
      })
      .catch((e) => setConvError(e.message || '加载会话列表失败'))
      .finally(() => setLoadingConv(false))
  }, [])

  useEffect(() => {
    if (!activeConversationId) {
      setCurrentMessages([])
      return
    }
    getMessages(activeConversationId)
      .then(setCurrentMessages)
      .catch(() => setCurrentMessages([]))
    setSelectedMessage(null)
  }, [activeConversationId])

  const handleNewConversation = () => {
    setConvError(null)
    createConversation()
      .then((c) => {
        setConversations((prev) => [c, ...prev])
        setActiveConversationId(c.id)
        setCurrentMessages([])
      })
      .catch((e) => setConvError(e.message || '新建会话失败'))
  }

  const handleDeleteConversation = (id) => {
    deleteConversation(id)
      .then(() => {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeConversationId === id) {
          const rest = conversations.filter((c) => c.id !== id)
          setActiveConversationId(rest[0]?.id ?? null)
          setCurrentMessages(rest[0] ? [] : [])
        }
      })
      .catch((e) => setConvError(e.message || '删除失败'))
  }

  const handleStreamStart = (userMsg) => {
    setCurrentMessages((prev) => [...prev, userMsg])
  }

  const handleStreamDone = (assistantMsg) => {
    setLiveChartConfig(null)
    setCurrentMessages((prev) => {
      const next = [...prev, assistantMsg]
      const lastUser = prev.filter((m) => m.role === 'user').pop()
      if (lastUser) {
        const conv = conversations.find((c) => c.id === activeConversationId)
        if (conv?.title === '新会话') {
          const title = lastUser.content.slice(0, 20) + (lastUser.content.length > 20 ? '...' : '')
          setConversations((prevConv) =>
            prevConv.map((c) => (c.id === activeConversationId ? { ...c, title, updated_at: new Date().toISOString() } : c))
          )
        }
      }
      return next
    })
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
        loading={loadingConv}
        error={convError}
      />
      <ChatPanel
        key={activeConversationId}
        activeConversationId={activeConversationId}
        messages={currentMessages}
        onMessageSelect={setSelectedMessage}
        onStreamStart={handleStreamStart}
        onStreamDone={handleStreamDone}
        onChart={setLiveChartConfig}
      />
      <ChartPanel selectedMessage={selectedMessage} liveChartConfig={liveChartConfig} />
    </div>
  )
}
