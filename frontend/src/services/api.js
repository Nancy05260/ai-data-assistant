/**
 * 前后端接口层 - 与后端返回字段完全一致，不做重命名
 *
 * 后端规范（Plan「接口规范汇总」）：
 * - GET /api/conversations → [{ id, title, created_at, updated_at }, ...]
 * - POST /api/conversations → { id, title, created_at, updated_at }
 * - DELETE /api/conversations/{id} → 204
 * - GET /api/conversations/{id}/messages → [{ id, role, content, sql_query?, query_result?, chart_config?, created_at }, ...]
 * - POST /api/chat 请求体 → { conversation_id, message }；SSE 事件：thinking | sql | answer | chart | error | done
 *   chart data → { chart_type, option }
 */

const BASE = '/api'

/**
 * 会话列表，按 updated_at 倒序
 * @returns {Promise<Array<{ id: string, title: string, created_at: string, updated_at: string }>>}
 */
export async function getConversations() {
  const res = await fetch(`${BASE}/conversations`)
  if (!res.ok) throw new Error(res.statusText || '获取会话列表失败')
  return res.json()
}

/**
 * 新建会话，标题默认「新会话」
 * @returns {Promise<{ id: string, title: string, created_at: string, updated_at: string }>}
 */
export async function createConversation() {
  const res = await fetch(`${BASE}/conversations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (!res.ok) throw new Error(res.statusText || '新建会话失败')
  return res.json()
}

/**
 * 删除会话，级联删除消息
 * @param {string} id - 会话 id
 */
export async function deleteConversation(id) {
  const res = await fetch(`${BASE}/conversations/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(res.statusText || '删除会话失败')
}

/**
 * 获取会话消息，按 created_at 正序
 * @param {string} conversationId
 * @returns {Promise<Array<{ id: string, role: string, content: string, sql_query?: string, query_result?: any, chart_config?: { chart_type: string, option: object }, created_at: string }>>}
 */
export async function getMessages(conversationId) {
  const res = await fetch(`${BASE}/conversations/${conversationId}/messages`)
  if (!res.ok) throw new Error(res.statusText || '获取消息失败')
  return res.json()
}

/**
 * 建立 POST /api/chat 的 SSE 连接，按事件回调
 * @param {string} conversationId
 * @param {string} message - 用户输入文本
 * @param {object} callbacks - { onThinking?, onSql?, onAnswer?, onChart?, onError?, onDone? }
 * @returns {Promise<void>} 在 done 或 error 后 resolve
 */
export function streamChat(conversationId, message, callbacks = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ conversation_id: conversationId, message })
    const controller = new AbortController()
    fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body,
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          res.text().then((t) => reject(new Error(t || res.statusText)))
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        function processLine(line) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
            return
          }
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            if (currentEvent === 'done') {
              callbacks.onDone?.()
              return
            }
            if (data === '') return
            try {
              const parsed = data.startsWith('{') ? JSON.parse(data) : data
              if (currentEvent === 'thinking') callbacks.onThinking?.(parsed)
              else if (currentEvent === 'sql') callbacks.onSql?.(parsed)
              else if (currentEvent === 'answer') callbacks.onAnswer?.(parsed)
              else if (currentEvent === 'chart') callbacks.onChart?.(typeof parsed === 'object' ? parsed : JSON.parse(parsed))
              else if (currentEvent === 'error') callbacks.onError?.(parsed)
            } catch (e) {
              if (currentEvent === 'answer' || currentEvent === 'error') callbacks[currentEvent === 'error' ? 'onError' : 'onAnswer']?.(data)
            }
          }
        }

        let currentEvent = ''
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              resolve()
              return
            }
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split(/\r?\n/)
            buf = lines.pop() || ''
            lines.forEach((line) => processLine(line))
            return pump()
          })
        }
        return pump()
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        reject(err)
      })
  })
}
