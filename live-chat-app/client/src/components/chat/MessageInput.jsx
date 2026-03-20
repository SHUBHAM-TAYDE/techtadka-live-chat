import { useState, useRef, useCallback, useEffect } from 'react'
import { Send } from 'lucide-react'

const TYPING_DEBOUNCE = 1500

const MessageInput = ({ onSend, onTypingStart, onTypingStop, disabled }) => {
  const [value,    setValue]    = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timerRef = useRef(null)
  const textareaRef = useRef(null)

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false)
      onTypingStop?.()
    }
    clearTimeout(timerRef.current)
  }, [isTyping, onTypingStop])

  const handleChange = useCallback((e) => {
    setValue(e.target.value)

    if (e.target.value.trim()) {
      if (!isTyping) {
        setIsTyping(true)
        onTypingStart?.()
      }
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE)
    } else {
      stopTyping()
    }

    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }, [isTyping, onTypingStart, stopTyping])

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    stopTyping()
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [value, disabled, onSend, stopTyping])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }, [submit])

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="flex items-end gap-3 bg-panel border border-border rounded-2xl px-4 py-3 focus-within:border-accent/60 transition-colors duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-ink-1 placeholder-ink-3 resize-none outline-none leading-relaxed max-h-40 disabled:opacity-50"
          style={{ height: 'auto' }}
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className={`
            flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mb-0.5
            transition-all duration-200
            ${canSend
              ? 'bg-accent text-white hover:bg-accent-hover active:scale-95'
              : 'bg-muted/40 text-ink-3 cursor-not-allowed'
            }
          `}
        >
          <Send size={14} strokeWidth={2.5} />
        </button>
      </div>
      <p className="text-[10px] text-ink-3 mt-1.5 ml-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

export default MessageInput
