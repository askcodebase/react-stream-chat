import { useEffect, useRef } from 'react'
import { useCreateReducer } from '@/hooks/useCreateReducer'
import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation'
import { Conversation } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { OpenAIModelID, OpenAIModels } from '@/types/openai'
import { Chat } from '@/components/Chat/Chat'
import { ReactStreamChatContext } from './context'
import { ReactStreamChatInitialState, initialState } from './state'
import { v4 as uuidv4 } from 'uuid'

const defaultModelId = OpenAIModelID.GPT_3_5

export const ReactStreamChat = () => {
  const contextValue = useCreateReducer<ReactStreamChatInitialState>({
    initialState,
  })

  const {
    state: { lightMode, conversations, selectedConversation },
    dispatch,
  } = contextValue

  const stopConversationRef = useRef<boolean>(false)

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    })

    saveConversation(conversation)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    const newConversation: Conversation = {
      id: uuidv4(),
      name: 'New Conversation',
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    }

    const updatedConversations = [...conversations, newConversation]

    dispatch({ field: 'selectedConversation', value: newConversation })
    dispatch({ field: 'conversations', value: updatedConversations })

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    dispatch({ field: 'loading', value: false })
  }

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    }

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    )

    dispatch({ field: 'selectedConversation', value: single })
    dispatch({ field: 'conversations', value: all })
  }

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory)
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      )

      dispatch({ field: 'conversations', value: cleanedConversationHistory })
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      )

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      })
    } else {
      const lastConversation = conversations[conversations.length - 1]
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: 'New Conversation',
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      })
    }
  }, [dispatch])

  return (
    <ReactStreamChatContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>
          </div>
        </main>
      )}
    </ReactStreamChatContext.Provider>
  )
}
