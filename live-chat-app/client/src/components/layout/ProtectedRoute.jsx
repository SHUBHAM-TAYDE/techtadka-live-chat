import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <Loader2 size={22} className="text-accent animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
