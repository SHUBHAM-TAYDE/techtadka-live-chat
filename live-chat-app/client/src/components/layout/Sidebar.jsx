import { useState, useEffect } from 'react'
import { Hash, Plus, Wifi, WifiOff, LogOut, X, Loader2 } from 'lucide-react'
import { useAuth }   from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import Avatar from '../ui/Avatar'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Sidebar = ({ activeRoomId, onSelectRoom }) => {
  const { user, logout }    = useAuth()
  const { connected, onlineUsers } = useSocket()
  const [rooms,      setRooms]      = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [creating,   setCreating]   = useState(false)

  useEffect(() => {
    api.get('/rooms').then(({ data }) => setRooms(data.rooms)).catch(console.error)
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/rooms', { name: newName, description: newDesc })
      setRooms((prev) => [...prev, data.room])
      onSelectRoom(data.room)
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      toast.success(`#${data.room.name} created!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-ink-1 text-[15px] tracking-tight">LiveChat</h1>
          <span className={`flex items-center gap-1 text-[10px] font-medium ${connected ? 'text-online' : 'text-danger'}`}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'live' : 'offline'}
          </span>
        </div>
        <p className="text-[10px] text-ink-3 mt-0.5">Tech Tadka With Shubham</p>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest">Rooms</span>
          <button
            onClick={() => setShowCreate(true)}
            className="w-5 h-5 rounded flex items-center justify-center text-ink-3 hover:text-ink-1 hover:bg-muted/40 transition-colors"
            title="Create room"
          >
            <Plus size={13} />
          </button>
        </div>

        <ul className="space-y-0.5">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => onSelectRoom(room)}
                className={`room-pill w-full text-left ${
                  activeRoomId === room.id
                    ? 'bg-accent/15 text-accent-light'
                    : 'text-ink-2 hover:bg-muted/30 hover:text-ink-1'
                }`}
              >
                <Hash size={14} className="flex-shrink-0 opacity-70" />
                <span className="truncate">{room.name}</span>
                {room.member_count > 0 && (
                  <span className="ml-auto text-[10px] text-ink-3">{room.member_count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Create Room modal */}
        {showCreate && (
          <div className="mt-3 bg-panel border border-border rounded-xl p-3 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-ink-1">New room</p>
              <button onClick={() => setShowCreate(false)} className="text-ink-3 hover:text-ink-1">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="room-name"
                className="input-base text-xs py-2"
                maxLength={50}
                autoFocus
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="input-base text-xs py-2"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="btn-primary py-2 text-xs flex items-center justify-center gap-2"
              >
                {creating && <Loader2 size={12} className="animate-spin" />}
                Create
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Online count */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-ink-3">
          <span className="text-online font-semibold">{onlineUsers.length}</span> online
        </p>
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border flex items-center gap-2.5">
        <Avatar username={user?.username || ''} size="sm" online />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink-1 truncate">{user?.username}</p>
          <p className="text-[10px] text-ink-3 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-3 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
