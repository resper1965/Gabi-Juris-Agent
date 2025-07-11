import React from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatWindow } from './components/ChatWindow'
import { MessageInput } from './components/MessageInput'

function App() {
  return (
    <div className="h-screen bg-white dark:bg-black flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <ChatWindow />
        <MessageInput />
      </div>
    </div>
  )
}

export default App 