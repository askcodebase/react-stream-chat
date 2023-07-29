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

interface Props {
  stopConversationRef: MutableRefObject<boolean>
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const {
    state: { selectedConversation, conversations, apiKey },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(ReactStreamChatContext)

  const [currentMessage, setCurrentMessage] = useState<Message>()
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
  const [showSettings, setShowSettings] = useState<boolean>(false)
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
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        })
        homeDispatch({ field: 'loading', value: true })
        homeDispatch({ field: 'messageIsStreaming', value: true })
        if (updatedConversation.messages.length === 1) {
          const { content } = message
          const customName =
            content.length > 30 ? content.substring(0, 30) + '...' : content
          updatedConversation = {
            ...updatedConversation,
            name: customName,
          }
        }
        homeDispatch({ field: 'loading', value: false })
        const interval = 500 // 500ms
        const encoder = new TextEncoder()

        let intervalId: NodeJS.Timeout
        const markdown = `
# QuickSort Algorithm in JavaScript

The QuickSort algorithm is a popular sorting algorithm, which is used to sort elements in an array. This divide-and-conquer algorithm works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays according to whether they are less than or greater than the pivot. The sub-arrays are then recursively sorted.

Below is a simple implementation of the QuickSort algorithm in JavaScript.

\`\`\`javascript
function quickSort(array, low = 0, high = array.length - 1) {
    if (low < high) {
        // Partition the array
        let pivotIndex = partition(array, low, high);

        // Sort the sub-arrays
        quickSort(array, low, pivotIndex);
        quickSort(array, pivotIndex + 1, high);
    }

    return array;
}

function partition(array, low, high) {
    let pivot = array[Math.floor((low + high) / 2)];
    let i = low - 1;
    let j = high + 1;

    while (true) {
        do {
            i++;
        } while (array[i] < pivot);

        do {
            j--;
        } while (array[j] > pivot);

        if (i >= j) {
            return j;
        }

        // Swap elements at indices i and j
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// Usage
let array = [10, 7, 8, 9, 1, 5];
let sortedArray = quickSort(array);
console.log(sortedArray); // Output: [1, 5, 7, 8, 9, 10]
\`\`\`

This implementation of QuickSort uses the Lomuto partition scheme, where we pick the pivot as the middle element of the array. 

QuickSort is an efficient, in-place sorting algorithm that, in practice, outperforms other sorting algorithms for large datasets, especially when the data is stored in a slow-to-access sequential medium like a hard disk. It has an average and worst-case time complexity of O(n log n).
`

        const uint8array = encoder.encode(markdown)
        const data = new ReadableStream({
          start(controller) {
            let i = 0
            const intervalId = setInterval(() => {
              if (i < uint8array.length) {
                controller.enqueue(uint8array.subarray(i, i + 5)) // Enqueue 5 tokens per 500ms
                i += 5
              } else {
                controller.close()
                clearInterval(intervalId)
              }
            }, 100) // 500ms interval
          },
          pull(controller) {
            // This method is called when the reader wants more data
            // You could produce more data here if needed
          },
          cancel(reason) {
            // This method is called when the reader cancels the stream
            clearInterval(intervalId)
          },
        })
        const reader = data.getReader()
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
            homeDispatch({
              field: 'selectedConversation',
              value: updatedConversation,
            })
          } else {
            const updatedMessages: Message[] = updatedConversation.messages.map(
              (message, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  return {
                    ...message,
                    content: text,
                  }
                }
                return message
              },
            )
            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            }
            homeDispatch({
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
        homeDispatch({ field: 'conversations', value: updatedConversations })
        saveConversations(updatedConversations)
        homeDispatch({ field: 'messageIsStreaming', value: false })
      }
    },
    [apiKey, conversations, selectedConversation, stopConversationRef],
  )

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
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

  const handleSettings = () => {
    setShowSettings(!showSettings)
  }

  const onClearAll = () => {
    if (
      confirm('Are you sure you want to clear all messages?') &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      })
    }
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
        selectedConversation.messages[selectedConversation.messages.length - 2],
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
            onEdit={(editedMessage) => {
              setCurrentMessage(editedMessage)
              // discard edited message and the ones that come after then resend
              handleSend(
                editedMessage,
                selectedConversation?.messages.length - index,
              )
            }}
          />
        ))}

        <div
          className="h-[162px] bg-white dark:bg-[#343541]"
          ref={messagesEndRef}
        />
      </div>

      <ChatInput
        stopConversationRef={stopConversationRef}
        textareaRef={textareaRef}
        onSend={(message) => {
          setCurrentMessage(message)
          handleSend(message, 0)
        }}
        onScrollDownClick={handleScrollDown}
        onRegenerate={() => {
          if (currentMessage) {
            handleSend(currentMessage, 2)
          }
        }}
        showScrollDownButton={showScrollDownButton}
      />
    </div>
  )
})
Chat.displayName = 'Chat'
