import { Conversation } from '@/types/chat'
import { OpenAIModelID, OpenAIModels } from '@/types/openai'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from './const'

export const cleanSelectedConversation = (conversation: Conversation) => {
  let updatedConversation = conversation

  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || OpenAIModels[OpenAIModelID.GPT_3_5],
    }
  }

  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT,
    }
  }

  if (!updatedConversation.temperature) {
    updatedConversation = {
      ...updatedConversation,
      temperature: updatedConversation.temperature || DEFAULT_TEMPERATURE,
    }
  }

  if (!updatedConversation.folderId) {
    updatedConversation = {
      ...updatedConversation,
      folderId: updatedConversation.folderId || null,
    }
  }

  if (!updatedConversation.messages) {
    updatedConversation = {
      ...updatedConversation,
      messages: updatedConversation.messages || [],
    }
  }

  return updatedConversation
}

export const cleanConversationHistory = (history: any[]): Conversation[] => {
  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.')
    return []
  }

  return history.reduce((acc: any[], conversation) => {
    try {
      if (!conversation.model) {
        conversation.model = OpenAIModels[OpenAIModelID.GPT_3_5]
      }

      if (!conversation.prompt) {
        conversation.prompt = DEFAULT_SYSTEM_PROMPT
      }

      if (!conversation.temperature) {
        conversation.temperature = DEFAULT_TEMPERATURE
      }

      if (!conversation.folderId) {
        conversation.folderId = null
      }

      if (!conversation.messages) {
        conversation.messages = []
      }

      acc.push(conversation)
      return acc
    } catch (error) {
      console.warn(
        `error while cleaning conversations' history. Removing culprit`,
        error,
      )
    }
    return acc
  }, [])
}
