'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Loader2, Sparkles, Maximize2, Minimize2, History, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@/lib/api-config'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  
  // New States
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [chats, setChats] = useState<any[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)
  const supabase = createClient()

  // Load chat history list
  useEffect(() => {
    if (!user) return
    const fetchChats = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setChats(data)
    }
    fetchChats()
  }, [user, chatId]) // Refresh list when chatId changes (new chat created)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const loadChat = async (id: string) => {
    setChatId(id)
    setShowHistory(false)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
    
    if (data) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
    }
  }

  const startNewChat = () => {
    setChatId(null)
    setMessages([])
    setShowHistory(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !user) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
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
    <div className={cn(
      "flex flex-col w-full glass-panel overflow-hidden border-white/5 relative transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-[100] h-[100dvh] max-w-none rounded-none shadow-none bg-background md:p-4" 
        : "h-[calc(100dvh-7rem)] md:h-[calc(100vh-8rem)] max-w-5xl mx-auto rounded-3xl md:rounded-[2.5rem] shadow-2xl"
    )}>
      
      {/* Settings / History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-md z-40" 
              onClick={() => setShowHistory(false)} 
            />
            <motion.div 
               initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute left-0 top-0 bottom-0 w-full md:w-80 glass-strong border-r border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/5">
                 <h3 className="font-bold text-foreground">Chat History</h3>
                 <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-xl hover:bg-white/5">
                   <X className="w-5 h-5 text-muted-foreground" />
                 </Button>
              </div>
              <div className="p-4 border-b border-white/5">
                 <Button onClick={startNewChat} className="w-full justify-start gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/20" variant="outline">
                    <Plus className="w-4 h-4" /> New Conversation
                 </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                 {chats.map(chat => (
                    <button 
                      key={chat.id} 
                      onClick={() => loadChat(chat.id)} 
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl transition-all text-sm group", 
                        chatId === chat.id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      )}
                    >
                       <div className="font-semibold truncate">{chat.title || 'Untitled Chat'}</div>
                       <div className={cn("text-[10px] mt-1.5", chatId === chat.id ? "text-primary-foreground/70" : "opacity-50 group-hover:opacity-100")}>
                         {new Date(chat.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </button>
                 ))}
                 {chats.length === 0 && (
                   <p className="text-center text-xs text-muted-foreground pt-10 px-4">No previous conversations found. Start a new one!</p>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <div className={cn(
        "p-6 border-b border-white/5 flex items-center justify-between",
        isFullscreen ? "bg-background/80 backdrop-blur-xl rounded-t-3xl" : "bg-white/[0.02]"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 glow-olive-sm">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              Campus Buddy <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-widest font-black hidden sm:inline-block">Elite AI</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Neural Context Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors" 
            onClick={() => setShowHistory(true)}
            title="Chat History"
          >
             <History className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
             {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Messages Area - Switched to Standard Scrollable Div for Robust Scrolling */}
      <div className={cn("flex-1 overflow-y-auto px-4 md:px-8 py-8", isFullscreen && "bg-black/5 dark:bg-transparent")}>
        <div className="space-y-8 pb-4 max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 md:py-20 text-center"
              >
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary via-primary/50 to-transparent p-[2px] mx-auto mb-8 shadow-2xl relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <div className="w-full h-full bg-background rounded-[2rem] flex items-center justify-center relative z-10">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4 tracking-tight">How can I assist you today?</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                  I have real-time access to your <span className="text-primary font-bold">Attendance</span>, <span className="text-primary font-bold">Marks</span>, <span className="text-primary font-bold">Timetable</span>, and <span className="text-primary font-bold">Campus Map</span>. Ask me anything.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                  {['What is my attendance?', 'Show my MST-1 marks', 'Where is room 412?', 'What is my CGPA?'].map((q) => (
                    <button 
                      key={q} 
                      onClick={() => setInput(q)}
                      className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
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
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-md",
                  message.role === 'user' 
                    ? "bg-secondary border-black/5 dark:border-white/10" 
                    : "bg-primary/10 border-primary/30"
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-foreground" />
                  )}
                </div>

                <div className={cn(
                  "max-w-[85%] rounded-[1.75rem] px-5 py-4 sm:px-6 sm:py-5 shadow-xl",
                  message.role === 'user'
                    ? "bg-foreground text-background font-medium rounded-tr-none"
                    : "glass text-foreground rounded-tl-none border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl"
                )}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-strong:text-primary prose-table:border-collapse prose-table:w-full prose-th:bg-black/5 dark:prose-th:bg-white/5 prose-th:px-4 prose-th:py-3 prose-td:border prose-td:border-black/5 dark:prose-td:border-white/5 prose-td:px-4 prose-td:py-3 prose-tr:transition-colors hover:prose-tr:bg-black/[0.02] dark:hover:prose-tr:bg-white/[0.02]">
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
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-md">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="glass bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-[1.75rem] rounded-tl-none px-6 py-5 border border-black/5 dark:border-white/10 shadow-xl">
                  <div className="flex gap-1.5 items-center h-full">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4 w-full" />
        </div>
      </div>

      {/* Input Area */}
      <div className={cn(
        "p-4 md:p-6 border-t border-white/5 flex-shrink-0 z-10",
        isFullscreen ? "bg-background/80 backdrop-blur-xl rounded-b-3xl" : "bg-white/[0.01] backdrop-blur-xl"
      )}>
        <form onSubmit={handleSubmit} className="relative group max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-primary/20 blur-2xl group-focus-within:bg-primary/30 transition-all rounded-3xl -z-10 opacity-30" />
          <div className="flex gap-2 md:gap-3 items-center glass bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-1.5 md:p-2 pl-4 md:pl-5 border-black/10 dark:border-white/10 group-focus-within:border-primary/50 transition-all shadow-lg">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your schedule, attendance, or locate any block..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 text-sm font-medium h-11 px-0 placeholder:text-muted-foreground/60"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size="icon"
              className="rounded-xl w-11 h-11 shadow-lg transition-transform active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-bold opacity-60">
          Powered by Gemini 1.5 & Neural Mapping
        </p>
      </div>
    </div>
  )
}
