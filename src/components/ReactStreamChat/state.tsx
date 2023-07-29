import { Conversation, Message } from '@/types/chat'
import { OpenAIModel, OpenAIModelID } from '@/types/openai'

export interface ReactStreamChatInitialState {
  loading: boolean
  lightMode: 'light' | 'dark'
  messageIsStreaming: boolean
  models: OpenAIModel[]
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined
  temperature: number
  showPromptbar: boolean
  messageError: boolean
  searchTerm: string
  defaultModelId: OpenAIModelID | undefined
}

export const initialState: ReactStreamChatInitialState = {
  loading: false,
  lightMode: 'dark',
  messageIsStreaming: false,
  models: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  temperature: 1,
  showPromptbar: true,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
}
