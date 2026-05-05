import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // If already logged in go straight to dashboard
  useEffect(() => {
    if (!loading && user) navigate('/')
  }, [user, loading])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4rem', height: 64,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)',
            borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18,
          }}>◈</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            FlowBoard
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '8px 20px', background: 'none',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text2)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '8px 20px', background: 'var(--accent)',
              border: 'none', borderRadius: 8,
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,106,255,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: '7rem 2rem 4rem',
        textAlign: 'center', position: 'relative',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,255,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}/>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(124,106,255,0.2)',
          fontSize: 12, fontWeight: 600, color: 'var(--accent2)',
          marginBottom: '1.5rem',
        }}>
          ⚡ Real-time collaboration
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.08, marginBottom: '1.5rem',
          position: 'relative', zIndex: 1,
        }}>
          Your team's work,{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            beautifully organised
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--text2)', maxWidth: 580,
          margin: '0 auto 2.5rem', lineHeight: 1.7,
          fontWeight: 300, position: 'relative', zIndex: 1,
        }}>
          FlowBoard is a real-time Kanban board that keeps your team in sync.
          Drag, drop, and ship — faster than ever.
        </p>

        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          flexWrap: 'wrap', position: 'relative', zIndex: 1,
        }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '14px 32px', background: 'var(--accent)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 8px 32px rgba(124,106,255,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,106,255,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,106,255,0.4)'
            }}
          >
            Start for free →
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '14px 32px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 12,
              color: 'var(--text)', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* BOARD PREVIEW */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 2rem 6rem',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
        }}>
          {/* Fake topbar */}
          <div style={{
            padding: '0 1.5rem', height: 48,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(13,13,13,0.5)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>
              ))}
            </div>
            <div style={{
              flex: 1, height: 24, background: 'var(--surface2)',
              borderRadius: 6, maxWidth: 300, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                flowboard.app/board/my-project
              </span>
            </div>
          </div>

          {/* Fake board */}
          <div style={{ padding: '1.5rem', display: 'flex', gap: 14, overflowX: 'auto' }}>
            {[
              { title: 'To Do', color: '#6b7280', cards: ['Design system audit', 'API documentation', 'User research'] },
              { title: 'In Progress', color: '#7c6aff', cards: ['Dashboard redesign', 'Auth flow'] },
              { title: 'Review', color: '#f59e0b', cards: ['Mobile responsiveness'] },
              { title: 'Done', color: '#10b981', cards: ['Set up Firebase', 'Deploy CI/CD', 'Initial wireframes'] },
            ].map(col => (
              <div key={col.title} style={{
                width: 220, flexShrink: 0,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: col.color,
                    boxShadow: `0 0 6px ${col.color}`,
                  }}/>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{col.title}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 10,
                    color: 'var(--text3)', background: 'var(--surface3)',
                    padding: '1px 6px', borderRadius: 10,
                  }}>{col.cards.length}</span>
                </div>
                <div style={{ padding: '10px' }}>
                  {col.cards.map(card => (
                    <div key={card} style={{
                      background: 'var(--surface3)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 10px',
                      marginBottom: 6, fontSize: 11,
                      color: 'var(--text2)', lineHeight: 1.4,
                    }}>
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 2rem 8rem',
      }}>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(1.8rem,3vw,2.5rem)',
          fontWeight: 800, letterSpacing: '-0.03em',
          marginBottom: '3rem',
        }}>
          Everything your team needs
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {[
            { icon: '⚡', title: 'Real-time sync', desc: 'Every change appears instantly for all team members. No refreshing, no conflicts.' },
            { icon: '🎯', title: 'Drag & drop', desc: 'Move cards between columns with a smooth drag. Prioritise work visually.' },
            { icon: '🔐', title: 'Secure auth', desc: 'Sign in with email or Google. Your boards are private by default.' },
            { icon: '🏷️', title: 'Labels & priorities', desc: 'Tag cards with labels and set High, Medium, or Low priority.' },
            { icon: '📅', title: 'Due dates', desc: 'Never miss a deadline. Set due dates and track progress at a glance.' },
            { icon: '👥', title: 'Team collaboration', desc: 'Invite teammates to boards. Work together in real time.' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '1.5rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border2)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{
                fontSize: 15, fontWeight: 700,
                marginBottom: 8, letterSpacing: '-0.01em',
              }}>{f.title}</div>
              <div style={{
                fontSize: 14, color: 'var(--text2)',
                lineHeight: 1.6, fontWeight: 300,
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        maxWidth: 700, margin: '0 auto',
        padding: '0 2rem 10rem', textAlign: 'center',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: '4rem 3rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-50%', left: '50%',
            transform: 'translateX(-50%)',
            width: 400, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,255,0.1), transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <h2 style={{
            fontSize: 'clamp(1.5rem,3vw,2.2rem)',
            fontWeight: 800, letterSpacing: '-0.03em',
            marginBottom: '1rem', position: 'relative', zIndex: 1,
          }}>
            Ready to ship faster?
          </h2>
          <p style={{
            color: 'var(--text2)', fontSize: 16,
            marginBottom: '2rem', fontWeight: 300,
            position: 'relative', zIndex: 1,
          }}>
            Join teams who use FlowBoard to stay organised and move fast.
          </p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '14px 40px', background: 'var(--accent)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 8px 32px rgba(124,106,255,0.4)',
              position: 'relative', zIndex: 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get started — it's free →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '2rem 4rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--text3)', fontSize: 13,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, background: 'var(--accent)',
            borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}>◈</div>
          <span style={{ fontWeight: 600, color: 'var(--text2)' }}>FlowBoard</span>
        </div>
        <span>Built by Muhammad Sani Ahmad</span>
        <span>© 2026 FlowBoard</span>
      </footer>
    </div>
  )
}