import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('检查中...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status === 'ok' ? '后端连接成功' : '后端异常')
      })
      .catch(() => setStatus('后端连接失败'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        智能数据分析系统
      </h1>
      <p
        className={`text-lg ${
          status === '后端连接成功' ? 'text-green-600' : 'text-amber-600'
        }`}
      >
        {status}
      </p>
    </div>
  )
}

export default App
