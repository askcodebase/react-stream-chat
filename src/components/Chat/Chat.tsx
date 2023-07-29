import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { saveConversation, saveConversations } from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'
import { Conversation, Message } from '@/types/chat'
import { ReactStreamChatContext } from '@/components/ReactStreamChat/context'
import { ChatInput } from './ChatInput'
import { MemoizedChatMessage } from './MemoizedChatMessage'

export type ChatInputComponent = (props: {
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  onSend: (message: Message) => void
  onScrollDownClick: () => void
  onRegenerate: () => void
  showScrollDownButton: boolean
}) => React.ReactNode

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  getResponseStream: (message: Message) => Promise<ReadableStream<Uint8Array>>
  CustomChatInput?: ChatInputComponent
}

export const Chat = memo(
  ({ stopConversationRef, CustomChatInput, getResponseStream }: Props) => {
    const {
      state: { selectedConversation, conversations },
      dispatch,
    } = useContext(ReactStreamChatContext)

    const [currentMessage, setCurrentMessage] = useState<Message>()
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = useCallback(
      async (message: Message, deleteCount = 0) => {
        if (selectedConversation) {
          let updatedConversation: Conversation
          if (deleteCount) {
            const updatedMessages = [...selectedConversation.messages]
            for (let i = 0; i < deleteCount; i++) {
              updatedMessages.pop()
            }
            updatedConversation = {
              ...selectedConversation,
              messages: [...updatedMessages, message],
            }
          } else {
            updatedConversation = {
              ...selectedConversation,
              messages: [...selectedConversation.messages, message],
            }
          }
          dispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          })
          dispatch({ field: 'loading', value: true })
          dispatch({ field: 'messageIsStreaming', value: true })
          if (updatedConversation.messages.length === 1) {
            const { content } = message
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            }
          }
          dispatch({ field: 'loading', value: false })
          let stream
          try {
            stream = await getResponseStream(message)
          } catch (e) {
            stream = new ReadableStream({
              start(controller) {
                const encoder = new TextEncoder()
                const details = (e as Error)?.message as string
                const output =
                  `Something went wrong. Error: "${details}". ` +
                  'Please contact support@askcodebase.com if you need help.'
                const error = encoder.encode(output)
                controller.enqueue(error)
                controller.close()
              },
              pull(controller) {},
              cancel(reason) {},
            })
          }
          const reader = stream.getReader()
          const decoder = new TextDecoder()

          let done = false
          let isFirst = true
          let text = ''
          while (!done) {
            if (stopConversationRef.current === true) {
              done = true
              break
            }
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            const chunkValue = decoder.decode(value)
            text += chunkValue
            if (isFirst) {
              isFirst = false
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: chunkValue },
              ]
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }
              dispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              })
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    }
                  }
                  return message
                })
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }
              dispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              })
            }
          }
          saveConversation(updatedConversation)

          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation
              }
              return conversation
            },
          )

          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation)
          }
          dispatch({ field: 'conversations', value: updatedConversations })
          saveConversations(updatedConversations)
          dispatch({ field: 'messageIsStreaming', value: false })
        }
      },
      [
        conversations,
        getResponseStream,
        selectedConversation,
        stopConversationRef,
      ],
    )

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current
        const bottomTolerance = 30

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false)
          setShowScrollDownButton(true)
        } else {
          setAutoScrollEnabled(true)
          setShowScrollDownButton(false)
        }
      }
    }

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true)
      }
    }
    const throttledScrollDown = throttle(scrollDown, 250)

    useEffect(() => {
      throttledScrollDown()
      selectedConversation &&
        setCurrentMessage(
          selectedConversation.messages[
            selectedConversation.messages.length - 2
          ],
        )
    }, [selectedConversation, throttledScrollDown])

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry.isIntersecting)
          if (entry.isIntersecting) {
            textareaRef.current?.focus()
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      )
      const messagesEndElement = messagesEndRef.current
      if (messagesEndElement) {
        observer.observe(messagesEndElement)
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement)
        }
      }
    }, [messagesEndRef])

    return (
      <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
        <div
          className="max-h-full overflow-x-hidden"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {selectedConversation?.messages.map((message, index) => (
            <MemoizedChatMessage
              key={index}
              message={message}
              messageIndex={index}
            />
          ))}

          <div
            className="h-[162px] bg-white dark:bg-[#343541]"
            ref={messagesEndRef}
          />
        </div>

        {CustomChatInput !== undefined ? (
          CustomChatInput({
            stopConversationRef,
            textareaRef,
            onSend: (message) => {
              setCurrentMessage(message)
              handleSend(message, 0)
            },
            onScrollDownClick: handleScrollDown,
            onRegenerate: () => {
              if (currentMessage) {
                handleSend(currentMessage, 2)
              }
            },
            showScrollDownButton,
          })
        ) : (
          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message) => {
              setCurrentMessage(message)
              handleSend(message, 0)
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={throttle(() => {
              console.log('-----------------onRenerate', currentMessage)
              if (currentMessage) {
                handleSend(currentMessage, 2)
              }
            }, 1000)}
            showScrollDownButton={showScrollDownButton}
          />
        )}
      </div>
    )
  },
)
Chat.displayName = 'Chat'
