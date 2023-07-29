import { Dispatch, createContext } from 'react'
import { ActionType } from '@/hooks/useCreateReducer'
import { Conversation } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { ReactStreamChatInitialState } from './state'

export interface HomeContextProps {
  state: ReactStreamChatInitialState
  dispatch: Dispatch<ActionType<ReactStreamChatInitialState>>
  handleNewConversation: () => void
  handleSelectConversation: (conversation: Conversation) => void
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void
}

export const ReactStreamChatContext = createContext<HomeContextProps>(
  undefined!,
)
