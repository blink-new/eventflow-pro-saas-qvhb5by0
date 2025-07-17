import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink, User, DatabaseService } from './lib/blink'
import Dashboard from './pages/Dashboard'
import EventCreation from './pages/EventCreation'
import EventOverview from './pages/EventOverview'
import { Toaster } from './components/ui/toaster'
import { Loader2 } from 'lucide-react'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes using Blink SDK
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user ? {
        id: state.user.id,
        email: state.user.email,
        fullName: state.user.displayName || state.user.name,
        avatarUrl: state.user.avatar,
        role: 'organizer' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : null)
      setLoading(state.isLoading)
    })

    return unsubscribe
  }, [])

  const handleSignOut = async () => {
    try {
      blink.auth.logout()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading EventFlow Pro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a4 4 0 118 0v2" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">EventFlow Pro</h2>
          <p className="text-gray-600 mb-6">AI-powered event management platform</p>
          <button 
            onClick={() => blink.auth.login()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard user={user} onSignOut={handleSignOut} />} />
          <Route path="/create-event" element={<EventCreation user={user} />} />
          <Route path="/event/:id" element={<EventOverview user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App