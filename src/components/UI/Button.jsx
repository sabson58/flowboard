export default function Button({
  children, onClick, variant = 'primary',
  size = 'md', disabled, style, type = 'button'
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, border: 'none', borderRadius: 8, fontWeight: 600,
    transition: 'all 0.15s', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 16px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  }

  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    danger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,77,77,0.2)' },
    surface: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
    >
      {children}
    </button>
  )
}