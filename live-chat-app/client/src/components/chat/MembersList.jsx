import Avatar from '../ui/Avatar'
import { useSocket } from '../../context/SocketContext'

const MembersList = ({ members }) => {
  const { onlineUsers } = useSocket()
  const onlineIds = new Set(onlineUsers.map((u) => u.id))

  const online  = members.filter((m) => onlineIds.has(m.id))
  const offline = members.filter((m) => !onlineIds.has(m.id))

  const Section = ({ title, users }) => {
    if (!users.length) return null
    return (
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest mb-2 px-3">
          {title} — {users.length}
        </p>
        <ul className="space-y-0.5">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-muted/20 transition-colors">
              <Avatar username={u.username} size="sm" online={onlineIds.has(u.id)} />
              <span className={`text-sm truncate ${onlineIds.has(u.id) ? 'text-ink-1' : 'text-ink-3'}`}>
                {u.username}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <aside className="w-52 border-l border-border bg-surface flex-shrink-0 overflow-y-auto py-4 hidden lg:block">
      <p className="text-[11px] font-semibold text-ink-2 px-3 mb-4 uppercase tracking-wider">
        Members
      </p>
      <Section title="Online"  users={online} />
      <Section title="Offline" users={offline} />
    </aside>
  )
}

export default MembersList
