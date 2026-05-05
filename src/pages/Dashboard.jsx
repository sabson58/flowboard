import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'

// ── BOARD CARD ────────────────────────────────────────────
function BoardCard({ board, onClick, onDelete }) {
  const [hovering, setHovering] = useState(false)

  const backgrounds = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ]

  const bg = board.background || backgrounds[board.colorIndex % backgrounds.length]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovering ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovering ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Color banner */}
      <div style={{
        height: 80, background: bg,
        position: 'relative',
      }}>
        {/* Delete button */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(board.id) }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(0,0,0,0.3)', border: 'none',
            color: 'white', fontSize: 14, cursor: 'pointer',
            display: hovering ? 'flex' : 'none',
            alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          ✕
        </button>
        {/* Board icon */}
        <div style={{
          position: 'absolute', bottom: -20, left: 16,
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20,
        }}>
          {board.emoji || '📋'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 16px 16px' }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: 'var(--text)', marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {board.title}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text2)',
          marginBottom: 12,
        }}>
          {board.description || 'No description'}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11, color: 'var(--text2)',
            background: 'var(--surface2)',
            padding: '3px 8px', borderRadius: 6,
            border: '1px solid var(--border)',
          }}>
            {board.cardCount || 0} cards
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {new Date(board.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── CREATE BOARD MODAL ────────────────────────────────────
function CreateBoardModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('📋')
  const [loading, setLoading] = useState(false)

  const emojis = ['📋', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '💎', '🎨', '📱', '🛠️', '🌍']

  const backgrounds = [
    { id: 'purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'pink',   value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'blue',   value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'green',  value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'orange', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'dark',   value: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 100%)' },
    { id: 'gold',   value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
    { id: 'teal',   value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  ]

  const [background, setBackground] = useState(backgrounds[0].value)

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    await onCreate({ title: title.trim(), description: description.trim(), emoji, background })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
      padding: '1rem',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '1.75rem',
          width: '100%', maxWidth: 460,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>

        <h2 style={{
          fontSize: 20, fontWeight: 700,
          marginBottom: '1.5rem', color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          Create new board
        </h2>

        {/* Emoji picker */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>ICON</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {emojis.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  border: `2px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                  background: emoji === e ? 'var(--accent-dim)' : 'var(--surface2)',
                  fontSize: 20, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Background picker */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>BACKGROUND</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {backgrounds.map(bg => (
              <div
                key={bg.id}
                onClick={() => setBackground(bg.value)}
                style={{
                  width: 44, height: 44,
                  borderRadius: 10,
                  background: bg.value,
                  cursor: 'pointer',
                  border: background === bg.value
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  transition: 'all 0.15s',
                  boxShadow: background === bg.value
                    ? '0 0 0 2px var(--bg), 0 0 0 4px var(--accent)'
                    : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>BOARD NAME</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Product Roadmap"
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>DESCRIPTION (optional)</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this board for?"
            style={inputStyle}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text2)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            style={{
              flex: 2, padding: '11px',
              background: 'var(--accent)',
              border: 'none', borderRadius: 10,
              color: 'white', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
              opacity: !title.trim() ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Creating...' : '+ Create Board'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 11, fontWeight: 600,
  color: 'var(--text2)', letterSpacing: '0.08em',
  display: 'block', marginBottom: 8,
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14,
  color: 'var(--text)', outline: 'none',
  transition: 'border-color 0.15s',
}

// ── DASHBOARD ─────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Load boards
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'boards'),
      where('members', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setBoards(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.error(err)
      setLoading(false)
    })
    return unsub
  }, [user])

  // Create board
  async function createBoard({ title, description, emoji, background }) {
    await addDoc(collection(db, 'boards'), {
      title, description, emoji, background,
      ownerId: user.uid,
      members: [user.uid],
      colorIndex: boards.length,
      cardCount: 0,
      createdAt: Date.now(),
    })
  }

  // Delete board
  async function deleteBoard(boardId) {
    if (!confirm('Delete this board? This cannot be undone.')) return
    await deleteDoc(doc(db, 'boards', boardId))
  }

  const filtered = boards.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase())
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      {/* Top nav */}
      <nav style={{
        background: 'rgba(13,13,13,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 2rem', height: 56,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30,
              background: 'var(--accent)',
              borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>◈</div>
            <span style={{
              fontSize: 16, fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>FlowBoard</span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13,
              fontWeight: 700, color: 'white',
            }}>
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              {user?.displayName || user?.email}
            </span>
            <button
              onClick={() => signOut(auth)}
              style={{
                padding: '6px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text2)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'var(--text)', marginBottom: 6,
            }}>
              {greeting()}, {user?.displayName?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>
              You have {boards.length} board{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '11px 20px',
              background: 'var(--accent)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: 8, transition: 'all 0.15s',
              boxShadow: '0 4px 20px rgba(124,106,255,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            + New Board
          </button>
        </div>

        {/* Search */}
        {boards.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: 400 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search boards..."
              style={{
                ...inputStyle,
                paddingLeft: 40,
              }}
            />
            <span style={{
              position: 'absolute', left: 14,
              top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text3)', fontSize: 14,
              pointerEvents: 'none',
            }}>🔍</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text2)' }}>
            Loading your boards...
          </div>
        )}

        {/* Empty state */}
        {!loading && boards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '6rem 2rem',
            color: 'var(--text2)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>◈</div>
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 700,
              color: 'var(--text)', marginBottom: 8,
              letterSpacing: '-0.02em',
            }}>
              No boards yet
            </h2>
            <p style={{ marginBottom: '1.5rem', fontSize: 15 }}>
              Create your first board to start organising your work
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '12px 28px',
                background: 'var(--accent)',
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 15,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Create your first board
            </button>
          </div>
        )}

        {/* Boards grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {filtered.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => navigate(`/board/${board.id}`)}
                onDelete={deleteBoard}
              />
            ))}
          </div>
        )}

        {/* No search results */}
        {!loading && boards.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)' }}>
            No boards match "{search}"
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateBoardModal
          onClose={() => setShowCreate(false)}
          onCreate={createBoard}
        />
      )}
    </div>
  )
}