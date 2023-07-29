import { createRoot } from 'react-dom/client'
import { Message } from './types/chat'
import { ChatInputComponent } from './components/Chat/Chat'
import { ChatInput } from './components/Chat/ChatInput'
import { ReactStreamChat } from '@/components/ReactStreamChat'
import '@/styles/globals.css'

const root = createRoot(document.getElementById('root')!)

const CustomChatInput: ChatInputComponent = ({
  stopConversationRef,
  textareaRef,
  onSend,
  onScrollDownClick,
  onRegenerate,
  showScrollDownButton,
}) => (
  <ChatInput
    stopConversationRef={stopConversationRef}
    textareaRef={textareaRef}
    onSend={onSend}
    onScrollDownClick={onScrollDownClick}
    onRegenerate={onRegenerate}
    showScrollDownButton={showScrollDownButton}
  />
)

const getResponseStream = async (message: Message) => {
  if (Math.random() > 0.3) {
    throw new Error('Netowrk Timeout')
  }
  const encoder = new TextEncoder()
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
  let intervalId: NodeJS.Timeout
  return new ReadableStream({
    start(controller) {
      let i = 0
      const intervalId = setInterval(() => {
        if (i < uint8array.length) {
          controller.enqueue(uint8array.subarray(i, i + 5))
          i += 5
        } else {
          controller.close()
          clearInterval(intervalId)
        }
      }, 100)
    },
    pull(controller) {},
    cancel(reason) {
      clearInterval(intervalId)
    },
  })
}

root.render(
  <ReactStreamChat
    CustomChatInput={CustomChatInput}
    getResponseStream={getResponseStream}
  />,
)
