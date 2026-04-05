import { create } from 'zustand'
import type { Chat, Message } from '@/types/database'

interface ChatState {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  setChats: (chats: Chat[]) => void
  setCurrentChat: (chat: Chat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  clearCurrentChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearCurrentChat: () => set({ currentChat: null, messages: [] }),
}))
