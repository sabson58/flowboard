import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../../firebase/config'
import { saveUserEmail } from '../../hooks/useMembers'
import Button from '../UI/Button'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        await saveUserEmail(email, cred.user.uid, name)
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          name,
          email,
          createdAt: Date.now(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    }
    setLoading(false)
  }

  async function handleGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const u = result.user
      await saveUserEmail(u.email, u.uid, u.displayName)
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        createdAt: Date.now(),
      }, { merge: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(friendlyError(err.code))
    }
  }

  function friendlyError(code) {
    const map = {
      'auth/user-not-found': 'No account with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/email-already-in-use': 'Email already registered.',
      'auth/weak-password': 'Password must be at least 6 characters.',
    }
    return map[code] || 'Something went wrong.'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '2rem',
    }}>
      {/* BG glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,255,0.06), transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{
        width: '100%', maxWidth: 400, position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--accent)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 1rem',
            boxShadow: '0 0 40px rgba(124,106,255,0.3)',
          }}>
            ◈
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.03em', color: 'var(--text)',
          }}>
            FlowBoard
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
            Real-time collaborative kanban
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: '1.5rem',
            background: 'var(--surface2)', borderRadius: 10, padding: 4,
          }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }} style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: tab === t ? 'var(--surface3)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  FULL NAME
                </label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required
                  style={inputStyle}
                />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid rgba(255,77,77,0.2)',
                borderRadius: 8, padding: '10px 12px',
                fontSize: 13, color: 'var(--red)', marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '1.25rem 0', color: 'var(--text3)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            or
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.7-7.1l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none',
  transition: 'border-color 0.15s',
}