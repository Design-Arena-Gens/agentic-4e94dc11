'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Upload, Download, Trash2, Send } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CatalogData {
  [key: string]: string | number
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [catalogData, setCatalogData] = useState<CatalogData[]>([])
  const [catalogFile, setCatalogFile] = useState<string>('')
  const [referenceData, setReferenceData] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        handleSendMessage(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    addMessage('assistant', "Hello! I'm Jarvis, your personal AI assistant. I can help you manage your e-commerce catalog for Amazon, Flipkart, Meesho, and Myntra. Upload your catalog sheet and provide reference data, and I'll help you fill it out!")
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'catalog' | 'reference') => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (type === 'catalog') {
        setCatalogData(jsonData as CatalogData[])
        setCatalogFile(file.name)
        addMessage('assistant', `Catalog file "${file.name}" uploaded successfully! I found ${jsonData.length} rows. Now upload your reference data or tell me what you need help with.`)
      } else {
        const textData = XLSX.utils.sheet_to_csv(worksheet)
        setReferenceData(textData)
        addMessage('assistant', `Reference data uploaded! I can now help you fill your catalog based on this information.`)
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText
    if (!messageText.trim()) return

    addMessage('user', messageText)
    setInputText('')
    setIsProcessing(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          catalogData,
          referenceData,
          hasFiles: catalogData.length > 0 || referenceData !== ''
        })
      })

      const data = await response.json()

      if (data.updatedCatalog) {
        setCatalogData(data.updatedCatalog)
        addMessage('assistant', data.message + '\n\nCatalog has been updated! You can download it now.')
      } else {
        addMessage('assistant', data.message)
      }
    } catch (error) {
      addMessage('assistant', "I'm having trouble processing that. Could you try again?")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadCatalog = () => {
    if (catalogData.length === 0) {
      alert('No catalog data to download!')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(catalogData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalog')
    XLSX.writeFile(workbook, `updated_catalog_${Date.now()}.xlsx`)
    addMessage('assistant', 'Catalog downloaded successfully!')
  }

  const clearChat = () => {
    setMessages([])
    setCatalogData([])
    setCatalogFile('')
    setReferenceData('')
    addMessage('assistant', "Chat cleared! Ready to help you with a new task.")
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">J.A.R.V.I.S.</h1>
              <p className="text-indigo-200 text-sm">Just A Rather Very Intelligent System</p>
            </div>
            <div className="flex gap-2">
              {catalogFile && (
                <span className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm">
                  📁 {catalogFile}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-50 p-4 border-b flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition">
            <Upload size={18} />
            <span className="text-sm">Upload Catalog</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileUpload(e, 'catalog')}
              className="hidden"
            />
          </label>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600 transition">
            <Upload size={18} />
            <span className="text-sm">Upload Reference Data</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileUpload(e, 'reference')}
              className="hidden"
            />
          </label>
          {catalogData.length > 0 && (
            <button
              onClick={downloadCatalog}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              <Download size={18} />
              <span className="text-sm">Download Catalog</span>
            </button>
          )}
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition ml-auto"
          >
            <Trash2 size={18} />
            <span className="text-sm">Clear</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full pulse-animation"></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full pulse-animation" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full pulse-animation" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={toggleVoiceInput}
              className={`p-4 rounded-full transition ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Jarvis anything... or click the mic to speak"
              className="flex-1 px-6 py-4 rounded-full border-2 border-gray-200 focus:border-indigo-600 focus:outline-none"
              disabled={isProcessing}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !inputText.trim()}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
