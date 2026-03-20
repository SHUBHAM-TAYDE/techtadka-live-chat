import { format, isToday, isYesterday } from 'date-fns'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'MMM d, HH:mm')
}

const MessageBubble = ({ message, showHeader }) => {
  const { user } = useAuth()
  const isOwn    = message.sender?.id === user?.id

  if (message.is_deleted) {
    return (
      <div className={`flex items-start gap-3 px-4 py-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className={isOwn ? 'w-9' : 'w-9'} />
        <p className="text-xs text-ink-3 italic px-3 py-2 rounded-xl border border-border/50">
          Message deleted
        </p>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-3 px-4 py-0.5 group animate-slide-up ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar — only show on first message in a group */}
      <div className="w-9 flex-shrink-0 mb-1">
        {showHeader && <Avatar username={message.sender?.username || '?'} size="md" />}
      </div>

      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Header */}
        {showHeader && (
          <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-semibold text-ink-1">
              {isOwn ? 'You' : message.sender?.username}
            </span>
            <span className="text-[10px] text-ink-3">{formatTime(message.created_at)}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`
            relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-accent text-white rounded-br-sm'
              : 'bg-panel text-ink-1 rounded-bl-sm border border-border/60'
            }
          `}
        >
          {message.content}

          {/* Timestamp on hover (non-header messages) */}
          {!showHeader && (
            <span className={`
              absolute top-1/2 -translate-y-1/2 text-[10px] text-ink-3
              opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap
              ${isOwn ? '-left-16' : '-right-16'}
            `}>
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
