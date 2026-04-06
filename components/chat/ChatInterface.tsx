'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, Sparkles, Trash2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !user) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chatId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setChatId(data.chatId)
    } catch (error) {
      toast.error('Failed to send message')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full glass-panel rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl relative">
      {/* Chat Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 glow-olive-sm">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Campus Buddy <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-widest font-black">Elite AI</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Neural Context Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-muted-foreground" onClick={() => setMessages([])}>
             <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-muted-foreground">
             <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-8">
        <div className="space-y-8 pb-4">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-tight">How can I assist you today?</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  I have real-time access to your **Attendance**, **Marks**, **Timetable**, and **Campus Map**. Ask me anything.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {['What is my attendance?', 'Show my MST-1 marks', 'Where is Block E-323?', 'What is my CGPA?'].map((q) => (
                    <button 
                      key={q} 
                      onClick={() => setInput(q)}
                      className="px-4 py-2 rounded-xl glass border-white/5 text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, x: message.role === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg",
                  message.role === 'user' 
                    ? "bg-secondary border-white/10" 
                    : "bg-primary/20 border-primary/30"
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className={cn(
                  "max-w-[85%] rounded-[1.75rem] px-6 py-4 shadow-xl",
                  message.role === 'user'
                    ? "bg-white text-black font-medium rounded-tr-none"
                    : "glass-strong text-white rounded-tl-none border border-white/5"
                )}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-strong:text-primary prose-table:border-collapse prose-table:w-full prose-th:bg-white/5 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-white/5 prose-td:px-4 prose-td:py-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="glass rounded-[1.75rem] rounded-tl-none px-6 py-4 border border-white/5">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-white/[0.01] backdrop-blur-xl border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl group-focus-within:bg-primary/30 transition-all rounded-3xl -z-10 opacity-30" />
          <div className="flex gap-3 items-center glass rounded-2xl p-2 pl-4 border-white/10 group-focus-within:border-primary/50 transition-all">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your schedule, attendance, or locate any block..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 text-sm font-medium h-10 px-0"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size="icon"
              className="rounded-xl w-10 h-10 shadow-lg transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-50">
          Powered by Gemini 1.5 & Neural Mapping
        </p>
      </div>
    </div>
  )
}
