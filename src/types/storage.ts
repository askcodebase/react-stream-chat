import { Conversation } from './chat'

// keep track of local storage schema
export interface LocalStorage {
  conversationHistory: Conversation[]
  selectedConversation: Conversation
  theme: 'light' | 'dark'
}
