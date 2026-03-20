import { useEffect, useRef, useCallback } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import MessageBubble from './MessageBubble'
import TypingIndicator from '../ui/TypingIndicator'
import { Loader2 } from 'lucide-react'

const DateDivider = ({ date }) => {
  const d     = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10px] text-ink-3 font-medium tracking-wider uppercase">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  )
}

const MessageList = ({ messages, typingUsers, hasMore, loadingMore, onLoadMore }) => {
  const bottomRef    = useRef(null)
  const containerRef = useRef(null)
  const prevScrollHeight = useRef(0)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    const el = containerRef.current
    if (!el || !loadingMore) { prevScrollHeight.current = 0; return }
    prevScrollHeight.current = el.scrollHeight
  }, [loadingMore])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !prevScrollHeight.current) return
    el.scrollTop = el.scrollHeight - prevScrollHeight.current
  }, [messages.length])

  // Intersection observer for infinite scroll trigger
  const topSentinelRef = useCallback((node) => {
    if (!node) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) onLoadMore()
    }, { threshold: 0.1 })
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  // Group consecutive messages from the same sender
  const shouldShowHeader = (msg, idx) => {
    if (idx === 0) return true
    const prev = messages[idx - 1]
    return prev.sender?.id !== msg.sender?.id ||
      new Date(msg.created_at) - new Date(prev.created_at) > 5 * 60 * 1000
  }

  const shouldShowDateDivider = (msg, idx) => {
    if (idx === 0) return true
    return !isSameDay(new Date(messages[idx - 1].created_at), new Date(msg.created_at))
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
      {/* Load-more sentinel */}
      <div ref={topSentinelRef} className="h-1" />

      {/* Loading spinner */}
      {loadingMore && (
        <div className="flex justify-center py-3">
          <Loader2 size={16} className="text-ink-3 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!messages.length && !loadingMore && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-8">
          <div className="w-12 h-12 rounded-2xl bg-panel border border-border flex items-center justify-center mb-1">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-sm font-medium text-ink-1">No messages yet</p>
          <p className="text-xs text-ink-3">Be the first to say something!</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => (
        <div key={msg.id}>
          {shouldShowDateDivider(msg, idx) && <DateDivider date={msg.created_at} />}
          <MessageBubble message={msg} showHeader={shouldShowHeader(msg, idx)} />
        </div>
      ))}

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      <div ref={bottomRef} className="h-2" />
    </div>
  )
}

export default MessageList
