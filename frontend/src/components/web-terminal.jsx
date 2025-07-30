"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, X, Maximize2, Minimize2 } from "lucide-react"

const translations = {
  en: {
    title: "Excel Database CLI Terminal",
    connected: "Connected",
    disconnected: "Disconnected",
    maximize: "Maximize",
    minimize: "Minimize",
    close: "Close",
    run: "Run",
    inputPlaceholder: "Enter command... (type help for assistance)",
    historyHint: "Use ↑/↓ keys to navigate command history",
    historyCount: "command(s) in history",
    connectionEstablished: "Terminal connection established...\n",
    connectionClosed: "\nTerminal connection closed.\n",
    connectionError: "\nConnection error occurred.\n",
    wsError: "\nWebSocket connection failed: ",
  },
  tr: {
    title: "Excel Database CLI Terminal",
    connected: "Bağlı",
    disconnected: "Bağlantı Kesildi",
    maximize: "Büyüt",
    minimize: "Küçült",
    close: "Kapat",
    run: "Çalıştır",
    inputPlaceholder: "Komut girin... (help ile yardım alabilirsiniz)",
    historyHint: "↑/↓ tuşları ile komut geçmişinde gezinebilirsiniz",
    historyCount: "komut geçmişi",
    connectionEstablished: "Terminal bağlantısı kuruldu...\n",
    connectionClosed: "\nTerminal bağlantısı kesildi.\n",
    connectionError: "\nBağlantı hatası oluştu.\n",
    wsError: "\nWebSocket bağlantısı kurulamadı: ",
  },
}

const WebTerminal = ({ isOpen, onClose }) => {
  const [output, setOutput] = useState("")
  const [input, setInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lang, setLang] = useState("en")

  const t = translations[lang]

  const wsRef = useRef(null)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      connectWebSocket()
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    } else {
      disconnectWebSocket()
    }
    return () => {
      disconnectWebSocket()
    }
  }, [isOpen])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  const connectWebSocket = () => {
    try {
      let wsUrl
      if (window.location.hostname === "localhost" && window.location.port === "5173") {
        wsUrl = "ws://localhost:8080/"
      } else {
        wsUrl = `ws://${window.location.hostname}:8080/`
      }
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setOutput(t.connectionEstablished)
      }

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "clear") {
          setOutput("")
        } else if (data.type === "output") {
          setOutput((prev) => prev + data.data)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        setOutput((prev) => prev + t.connectionClosed)
      }

      wsRef.current.onerror = () => {
        setIsConnected(false)
        setOutput((prev) => prev + t.connectionError)
      }
    } catch (error) {
      setOutput((prev) => prev + `${t.wsError}${error.message}\n`)
    }
  }

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const sendCommand = (command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "command",
          command: command,
        }),
      )
      if (command.trim() && command.trim() !== "clear") {
        setCommandHistory((prev) => {
          const newHistory = [command.trim(), ...prev.filter((cmd) => cmd !== command.trim())]
          return newHistory.slice(0, 50)
        })
      }
      setHistoryIndex(-1)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      setOutput((prev) => prev + input + "\n")
      sendCommand(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex] || "")
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isMaximized ? "p-0" : "p-4"}`}
    >
      <div
        className={`bg-gray-900 rounded-lg shadow-2xl flex flex-col ${
          isMaximized ? "w-full h-full rounded-none" : "w-full max-w-4xl h-3/4 max-h-[600px]"
        }`}
      >
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-green-400" />
            <span className="text-white font-medium">{t.title}</span>
            <div className={`flex items-center gap-2 text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
              {isConnected ? t.connected : t.disconnected}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
              title="Language"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title={isMaximized ? t.minimize : t.maximize}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-red-600 rounded transition-colors"
              title={t.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={terminalRef}
          className="flex-1 p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
        >
          <pre className="whitespace-pre-wrap break-words">{output}</pre>
        </div>
        <div className="p-3 bg-gray-800 rounded-b-lg border-t border-gray-700">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-green-400 font-mono">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-green-400 font-mono border-none outline-none placeholder-gray-500"
              placeholder={t.inputPlaceholder}
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !input.trim()}
              className="px-3 py-1 bg-green-600 text-black rounded text-sm font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.run}
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{t.historyHint}</span>
            {commandHistory.length > 0 && (
              <span>
                {commandHistory.length} {t.historyCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebTerminal
