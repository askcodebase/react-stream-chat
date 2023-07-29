import { createRoot } from 'react-dom/client'
import { ReactStreamChat } from '@/components/ReactStreamChat'
import '@/styles/globals.css'

const root = createRoot(document.getElementById('root')!)
root.render(<ReactStreamChat />)
