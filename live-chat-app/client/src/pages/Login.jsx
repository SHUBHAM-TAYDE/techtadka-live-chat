import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/15 border border-accent/30 rounded-2xl mb-4">
            <MessageSquare size={22} className="text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-1 tracking-tight">Welcome back</h1>
          <p className="text-sm text-ink-3 mt-1">Sign in to LiveChat</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Email</label>
              <input
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Password</label>
              <input
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-3 mt-5">
          No account?{' '}
          <Link to="/register" className="text-accent-light hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
