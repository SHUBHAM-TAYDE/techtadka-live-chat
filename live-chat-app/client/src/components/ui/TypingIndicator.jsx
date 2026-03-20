const TypingIndicator = ({ users }) => {
  if (!users.length) return null

  const label =
    users.length === 1 ? `${users[0].username} is typing` :
    users.length === 2 ? `${users[0].username} and ${users[1].username} are typing` :
    `${users.length} people are typing`

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-fade-in">
      <div className="flex items-end gap-[3px] h-4">
        <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-dot-1" />
        <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-dot-2" />
        <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-dot-3" />
      </div>
      <span className="text-xs text-ink-3 italic">{label}…</span>
    </div>
  )
}

export default TypingIndicator
