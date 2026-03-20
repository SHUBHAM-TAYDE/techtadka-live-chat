import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import Sidebar  from '../components/layout/Sidebar'
import ChatRoom from './ChatRoom'

const Chat = () => {
  const [activeRoom, setActiveRoom] = useState(null)

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar activeRoomId={activeRoom?.id} onSelectRoom={setActiveRoom} />

      {/* Main area */}
      <main className="flex flex-1 min-w-0 h-full bg-base">
        {activeRoom ? (
          <ChatRoom key={activeRoom.id} room={activeRoom} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center mb-2">
              <MessageSquare size={28} className="text-ink-3" />
            </div>
            <h3 className="text-base font-semibold text-ink-1">Pick a room</h3>
            <p className="text-sm text-ink-3 max-w-xs">
              Choose a room from the sidebar or create a new one to start chatting.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Chat
