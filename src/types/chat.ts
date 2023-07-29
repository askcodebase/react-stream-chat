import { OpenAIModel } from './openai'

export interface Message {
  role: Role
  content: string
}

export type Role = 'assistant' | 'user'

export interface Conversation {
  id: string
  name: string
  messages: Message[]
  model: OpenAIModel
  prompt: string
  temperature: number
  folderId: string | null
}
