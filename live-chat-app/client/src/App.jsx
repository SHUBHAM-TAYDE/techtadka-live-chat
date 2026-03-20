import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }   from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute     from './components/layout/ProtectedRoute'
import Login              from './pages/Login'
import Register           from './pages/Register'
import Chat               from './pages/Chat'

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  </AuthProvider>
)

export default App
