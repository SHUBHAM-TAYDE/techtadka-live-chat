import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth }   from '../context/AuthContext'
import api from '../utils/api'

export const useRoom = (roomId) => {
  const { socket }    = useSocket()
  const { user }      = useAuth()
  const [messages,    setMessages]    = useState([])
  const [members,     setMembers]     = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [hasMore,     setHasMore]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const typingTimers = useRef({})

  // Load initial history
  useEffect(() => {
    if (!roomId) return
    setMessages([])
    setHasMore(true)

    api.get(`/rooms/${roomId}/messages`).then(({ data }) => {
      setMessages(data.messages)
      setHasMore(data.hasMore)
    }).catch(console.error)
  }, [roomId])

  // Load older messages (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !messages.length) return
    setLoadingMore(true)
    try {
      const oldest = messages[0]
      const { data } = await api.get(`/rooms/${roomId}/messages`, {
        params: { before: oldest.id, limit: 50 },
      })
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.hasMore)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [roomId, messages, hasMore, loadingMore])

  // Socket events
  useEffect(() => {
    if (!socket || !roomId) return

    socket.emit('join_room', { roomId })

    const onJoined = ({ members: m }) => setMembers(m)

    const onMessage = ({ message }) =>
      setMessages((prev) => [...prev, message])

    const onUserJoined = ({ user: u }) =>
      setMembers((prev) => prev.find((m) => m.id === u.id) ? prev : [...prev, u])

    const onUserLeft = ({ userId }) =>
      setMembers((prev) => prev.filter((m) => m.id !== userId))

    const onTypingStart = ({ userId, username }) => {
      if (userId === user?.id) return
      setTypingUsers((prev) => prev.find((u) => u.id === userId) ? prev : [...prev, { id: userId, username }])
      // Auto-clear after 3s of no update
      clearTimeout(typingTimers.current[userId])
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.id !== userId))
      }, 3000)
    }

    const onTypingStop = ({ userId }) => {
      clearTimeout(typingTimers.current[userId])
      setTypingUsers((prev) => prev.filter((u) => u.id !== userId))
    }

    socket.on('room_joined',      onJoined)
    socket.on('message_received', onMessage)
    socket.on('user_joined',      onUserJoined)
    socket.on('user_left',        onUserLeft)
    socket.on('user_typing',      onTypingStart)
    socket.on('user_stop_typing', onTypingStop)

    return () => {
      socket.emit('leave_room', { roomId })
      socket.off('room_joined',      onJoined)
      socket.off('message_received', onMessage)
      socket.off('user_joined',      onUserJoined)
      socket.off('user_left',        onUserLeft)
      socket.off('user_typing',      onTypingStart)
      socket.off('user_stop_typing', onTypingStop)
      Object.values(typingTimers.current).forEach(clearTimeout)
    }
  }, [socket, roomId, user?.id])

  const sendMessage = useCallback((content) => {
    if (!socket || !content.trim()) return
    socket.emit('send_message', { roomId, content })
  }, [socket, roomId])

  const sendTypingStart = useCallback(() => {
    socket?.emit('typing_start', { roomId })
  }, [socket, roomId])

  const sendTypingStop = useCallback(() => {
    socket?.emit('typing_stop', { roomId })
  }, [socket, roomId])

  return { messages, members, typingUsers, hasMore, loadingMore, loadMore, sendMessage, sendTypingStart, sendTypingStop }
}
