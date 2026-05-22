'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  Hash, 
  MessageSquare, 
  Users, 
  Settings, 
  Plus, 
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  Loader2,
  Phone,
  Video
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function SocialHubPage() {
  const user = useAuthStore(state => state.user)
  const supabase = createClient()
  
  const [servers, setServers] = useState<any[]>([])
  const [activeServer, setActiveServer] = useState<any>(null)
  
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannel, setActiveChannel] = useState<any>(null)
  
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Servers
  useEffect(() => {
    if (!user) return
    const fetchServers = async () => {
      const { data, error } = await supabase
        .from('servers')
        .select('*, server_members!inner(user_id)')
        .eq('server_members.user_id', user.id)
      
      if (!error && data) {
        setServers(data)
        if (data.length > 0) setActiveServer(data[0])
      }
      setIsLoading(false)
    }
    fetchServers()
  }, [user])

  // 2. Fetch Channels when Server changes
  useEffect(() => {
    if (!activeServer) return
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', activeServer.id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setChannels(data)
        if (data.length > 0) setActiveChannel(data[0])
      }
    }
    fetchChannels()
  }, [activeServer])

  // 3. Fetch Messages when Channel changes
  useEffect(() => {
    if (!activeChannel) return
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name, avatar_url)')
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMessages(data)
        setTimeout(() => scrollToBottom(), 100)
      }
    }
    fetchMessages()

    // Subscribe to realtime messages
    const channel = supabase.channel(`public:messages:channel_id=eq.${activeChannel.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${activeChannel.id}` 
      }, async (payload) => {
        // Fetch sender profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
          
        const newMsg = { ...payload.new, profiles: profile }
        setMessages(prev => [...prev, newMsg])
        setTimeout(() => scrollToBottom(), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeChannel])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || !user) return
    
    const content = newMessage
    setNewMessage('')
    
    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: activeChannel.id,
        user_id: user.id,
        content: content
      })
      
    if (error) {
      toast.error('Failed to send message')
      setNewMessage(content) // restore
    }
  }

  const createServer = async () => {
    const name = prompt('Enter new server name:')
    if (!name || !user) return
    
    const { data, error } = await supabase
      .from('servers')
      .insert({ name, created_by: user.id })
      .select()
      .single()
      
    if (error) {
      toast.error('Failed to create server')
    } else if (data) {
      setServers([...servers, data])
      setActiveServer(data)
      toast.success('Server created!')
    }
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] -m-4 md:-m-6 lg:-m-8 bg-background/50 backdrop-blur-3xl overflow-hidden rounded-t-3xl md:rounded-3xl border border-black/5 dark:border-white/5">
      
      {/* 1. SERVERS SIDEBAR (Narrow) */}
      <div className="w-[72px] bg-black/5 dark:bg-white/5 flex flex-col items-center py-4 gap-3 border-r border-black/5 dark:border-white/5 overflow-y-auto hide-scrollbar">
        <button 
          className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center hover:rounded-xl transition-all duration-300"
          title="Direct Messages"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        <div className="w-8 h-[2px] bg-black/10 dark:bg-white/10 rounded-full" />
        
        {servers.map(server => (
          <button 
            key={server.id}
            onClick={() => setActiveServer(server)}
            className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-300 ${
              activeServer?.id === server.id 
                ? 'bg-primary text-background rounded-xl' 
                : 'bg-black/10 dark:bg-white/10 text-foreground hover:bg-primary/50 hover:text-white rounded-2xl hover:rounded-xl'
            }`}
          >
            {activeServer?.id === server.id && (
              <motion.div layoutId="server-indicator" className="absolute -left-1 w-2 h-8 bg-primary rounded-r-full" />
            )}
            <span className="font-black text-lg">{server.name.substring(0, 2).toUpperCase()}</span>
          </button>
        ))}

        <button 
          onClick={createServer}
          className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:rounded-xl transition-all duration-300 mt-2"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 2. CHANNELS SIDEBAR */}
      {activeServer && (
        <div className="w-60 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col border-r border-black/5 dark:border-white/5 hidden md:flex">
          {/* Server Header */}
          <div className="h-14 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <h2 className="font-black truncate">{activeServer.name}</h2>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Channel List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <div className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest px-1 mb-2">Text Channels</div>
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  activeChannel?.id === channel.id
                    ? 'bg-black/10 dark:bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Hash className="w-4 h-4 opacity-50" />
                <span className="font-bold text-sm truncate">{channel.name}</span>
              </button>
            ))}
          </div>
          
          {/* User Status Area */}
          <div className="h-16 border-t border-black/5 dark:border-white/5 flex items-center px-3 bg-black/5 dark:bg-white/5 gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-black truncate">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-[10px] text-emerald-500 font-bold">Online</div>
            </div>
            <div className="flex gap-1 text-muted-foreground">
              <button className="hover:text-foreground"><Settings className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-black text-lg">{activeChannel.name}</h3>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <button className="hover:text-foreground transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="hover:text-foreground transition-colors"><Video className="w-5 h-5" /></button>
                <button className="hover:text-foreground transition-colors"><Users className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Welcome Message */}
              <div className="py-10 border-b border-black/5 dark:border-white/5 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Hash className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-black mb-2">Welcome to #{activeChannel.name}!</h1>
                <p className="text-muted-foreground">This is the start of the #{activeChannel.name} channel.</p>
              </div>

              {/* Message List */}
              {messages.map((msg, idx) => {
                const showHeader = idx === 0 || messages[idx - 1].user_id !== msg.user_id || new Date(msg.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 300000;
                
                return (
                  <div key={msg.id} className={`group flex gap-4 ${showHeader ? 'mt-6' : 'mt-1'}`}>
                    {showHeader ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-sm border border-primary/20">
                        {msg.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                    ) : (
                      <div className="w-10 shrink-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-muted-foreground mt-1">{format(new Date(msg.created_at), 'HH:mm')}</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-[15px]">{msg.profiles?.full_name || 'Unknown User'}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      )}
                      <p className="text-foreground/90 leading-relaxed break-words">{msg.content}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 pt-0 shrink-0">
              <form onSubmit={sendMessage} className="relative flex items-center">
                <button type="button" className="absolute left-4 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-5 h-5 bg-black/10 dark:bg-white/10 rounded-full p-0.5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-4 text-primary hover:text-primary/80 disabled:opacity-50 disabled:hover:text-primary transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
            <MessageSquare className="w-16 h-16" />
            <h3 className="text-xl font-bold">No Channel Selected</h3>
          </div>
        )}
      </div>

    </div>
  )
}
