import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './components/Auth/AuthPage'
import Dashboard from './pages/Dashboard'
import BoardPage from './pages/BoardPage'
import Landing from './pages/Landing'
import './styles/globals.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  return user ? children : <Navigate to="/landing" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter basename="/flowboard">
      <Routes>
        <Route path="/landing" element={
          <PublicRoute><Landing /></PublicRoute>
        }/>
        <Route path="/auth" element={
          <PublicRoute><AuthPage /></PublicRoute>
        }/>
        <Route path="/" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        }/>
        <Route path="/board/:boardId" element={
          <PrivateRoute><BoardPage /></PrivateRoute>
        }/>
        {/* Root redirect */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
