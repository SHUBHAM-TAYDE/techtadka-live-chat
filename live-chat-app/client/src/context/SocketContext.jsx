import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth()
  const socketRef       = useRef(null)
  const [connected,    setConnected]    = useState(false)
  const [onlineUsers,  setOnlineUsers]  = useState([])

  useEffect(() => {
    if (!token || !user) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    })

    socketRef.current = socket

    socket.on('connect',      () => setConnected(true))
    socket.on('disconnect',   () => setConnected(false))
    socket.on('online_users', (users) => setOnlineUsers(users))
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider')
  return ctx
}
