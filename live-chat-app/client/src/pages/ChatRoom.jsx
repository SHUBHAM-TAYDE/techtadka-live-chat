import { Hash, Users } from 'lucide-react'
import { useState } from 'react'
import MessageList  from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'
import MembersList  from '../components/chat/MembersList'
import { useRoom }  from '../hooks/useRoom'
import { useSocket } from '../context/SocketContext'

const ChatRoom = ({ room }) => {
  const { connected } = useSocket()
  const {
    messages, members, typingUsers,
    hasMore, loadingMore, loadMore,
    sendMessage, sendTypingStart, sendTypingStop,
  } = useRoom(room.id)

  const [showMembers, setShowMembers] = useState(false)

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">

      {/* Room header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Hash size={16} className="text-ink-3 flex-shrink-0" />
          <h2 className="font-semibold text-ink-1 text-[15px] truncate">{room.name}</h2>
          {room.description && (
            <>
              <span className="text-border mx-1 hidden sm:block">·</span>
              <p className="text-xs text-ink-3 truncate hidden sm:block">{room.description}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-3 bg-panel border border-border px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-online rounded-full" />
            {members.filter(m => m.is_online).length} online
          </span>
          <button
            onClick={() => setShowMembers(v => !v)}
            className={"btn-ghost lg:hidden " + (showMembers ? 'text-accent-light bg-accent/10' : '')}
            title="Toggle members"
          >
            <Users size={15} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0">
          {!connected && (
            <div className="mx-4 mt-3 flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger text-xs px-3 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
              Reconnecting to server…
            </div>
          )}

          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />

          <MessageInput
            onSend={sendMessage}
            onTypingStart={sendTypingStart}
            onTypingStop={sendTypingStop}
            disabled={!connected}
          />
        </div>

        <div className={"lg:flex " + (showMembers ? 'flex' : 'hidden')}>
          <MembersList members={members} />
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
