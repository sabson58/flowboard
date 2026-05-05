import confetti from 'canvas-confetti'
import { logActivity } from '../hooks/useActivity'
import { inviteMember } from '../hooks/useMembers'
import { useKeyboard } from '../hooks/useKeyboard'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, onSnapshot, collection, addDoc,
  updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── CONSTANTS ─────────────────────────────────────────────
const DEFAULT_COLUMNS = [
  { id: 'todo',       title: 'To Do',       color: '#6b7280' },
  { id: 'inprogress', title: 'In Progress',  color: '#7c6aff' },
  { id: 'review',     title: 'Review',       color: '#f59e0b' },
  { id: 'done',       title: 'Done',         color: '#10b981' },
]

const PRIORITY_CONFIG = {
  high:   { color: '#ff4d4d', bg: 'rgba(255,77,77,0.12)',   label: 'High'   },
  medium: { color: '#ffd44d', bg: 'rgba(255,212,77,0.12)',  label: 'Medium' },
  low:    { color: '#4dff91', bg: 'rgba(77,255,145,0.12)',  label: 'Low'    },
}

// ── CARD DETAIL MODAL ─────────────────────────────────────
function CardDetailModal({ card, columnId, boardId, onClose, onSave, onDelete }) {
  const { user } = useAuth()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [priority, setPriority] = useState(card.priority || 'medium')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [labels, setLabels] = useState(card.labels || [])
  const [newLabel, setNewLabel] = useState('')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [editingTitle, setEditingTitle] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'boards', boardId, 'columns', columnId, 'cards', card.id, 'comments'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [card.id])

  async function handleSave() {
    await updateDoc(
      doc(db, 'boards', boardId, 'columns', columnId, 'cards', card.id),
      { title, description, priority, dueDate, labels }
    )
  }

  async function addComment() {
    if (!comment.trim()) return
    await addDoc(
      collection(db, 'boards', boardId, 'columns', columnId, 'cards', card.id, 'comments'),
      {
        text: comment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: Date.now(),
      }
    )
    setComment('')
  }

  async function deleteComment(commentId) {
    await deleteDoc(
      doc(db, 'boards', boardId, 'columns', columnId, 'cards', card.id, 'comments', commentId)
    )
  }

  function addLabel() {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()])
      setNewLabel('')
    }
  }

  const p = PRIORITY_CONFIG[priority]

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000, display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: '3rem 1rem', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20, width: '100%',
          maxWidth: 680,
          boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
          animation: 'slideUp 0.25s ease',
          overflow: 'hidden',
        }}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>

        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: '0.75rem' }}>
            {editingTitle ? (
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); handleSave() }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setEditingTitle(false); handleSave() }
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                autoFocus
                style={{
                  flex: 1, fontSize: 20, fontWeight: 700,
                  background: 'var(--surface2)', border: '1px solid var(--accent)',
                  borderRadius: 8, padding: '6px 10px', color: 'var(--text)',
                  outline: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em',
                }}
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                style={{ flex: 1, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', cursor: 'text', color: 'var(--text)', lineHeight: 1.3 }}
                title="Click to edit"
              >{title}</h2>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700, background: p.bg, color: p.color, textTransform: 'uppercase' }}>{p.label}</span>
            {dueDate && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>📅 {new Date(dueDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
            {labels.map((l, i) => <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent2)', border: '1px solid rgba(124,106,255,0.2)' }}>{l}</span>)}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px' }}>
          {/* Left */}
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={sideLabel}>Description</div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Add a description..."
                rows={4}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; handleSave() }}
              />
            </div>

            {/* Comments */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Comments ({comments.length})</div>
              <div style={{ marginBottom: 12 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {c.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.userName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(c.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {c.userId === user.uid && <button onClick={() => deleteComment(c.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>×</button>}
                      </div>
                      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 2 }}>
                  {user?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                    placeholder="Write a comment... (Enter to post)"
                    rows={2}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {comment && <button onClick={addComment} style={{ marginTop: 6, padding: '6px 16px', background: 'var(--accent)', border: 'none', borderRadius: 7, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Post comment</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sideLabel}>Priority</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => { setPriority(key); handleSave() }} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${priority === key ? cfg.color : 'var(--border)'}`, background: priority === key ? cfg.bg : 'var(--surface2)', color: priority === key ? cfg.color : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>{cfg.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sideLabel}>Due Date</div>
              <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); handleSave() }} style={{ width: '100%', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sideLabel}>Labels</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {labels.map((l, i) => (
                  <span key={i} onClick={() => setLabels(labels.filter((_, j) => j !== i))} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, cursor: 'pointer', background: 'var(--accent-dim)', color: 'var(--accent2)', border: '1px solid rgba(124,106,255,0.2)' }} title="Click to remove">{l} ×</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} placeholder="Add label" style={{ flex: 1, padding: '6px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                <button onClick={addLabel} style={{ padding: '6px 10px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>+</button>
              </div>
            </div>
            {/* Assign to */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sideLabel}>Assigned To</div>

              {/* Current assignee */}
              {card.assignedTo ? (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, padding: '8px 10px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, marginBottom: 8,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11,
                    fontWeight: 700, color: 'white',
                  }}>
                    {card.assignedName?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
                    {card.assignedName}
                  </span>
                  <button
                    onClick={async () => {
                      await updateDoc(
                        doc(db, 'boards', boardId, 'columns', columnId, 'cards', card.id),
                        { assignedTo: null, assignedName: null }
                      )
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--text3)', cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >×</button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                  Not assigned
                </p>
              )}

              {/* Assign to me button */}
              <button
                onClick={async () => {
                  await updateDoc(
                    doc(db, 'boards', boardId, 'columns', columnId, 'cards', card.id),
                    {
                      assignedTo: user.uid,
                      assignedName: user.displayName || user.email
                    }
                  )
                  await logActivity(boardId, user, `self-assigned a card`)
                }}
                style={{
                  width: '100%', padding: '7px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text2)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center',
                  gap: 6, justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-dim)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text2)'
                  e.currentTarget.style.background = 'var(--surface2)'
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 9,
                  fontWeight: 700, color: 'white',
                }}>
                  {user?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                Assign to me
              </button>
            </div>

            {/* Mark as done */}
            {columnId !== 'done' && (
              <button
                onClick={async () => {
                  await deleteDoc(doc(db, 'boards', boardId, 'columns', columnId, 'cards', card.id))
                  await addDoc(
                    collection(db, 'boards', boardId, 'columns', 'done', 'cards'),
                    { ...card, order: Date.now(), createdAt: Date.now() }
                  )
                  onClose()
                  confetti({
                    particleCount: 150, spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#7c6aff', '#4dff91', '#ffd44d', '#ff4d4d'],
                  })
                }}
                style={{
                  width: '100%', padding: '8px',
                  background: 'rgba(77,255,145,0.1)',
                  border: '1px solid rgba(77,255,145,0.25)',
                  borderRadius: 8, color: 'var(--green)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', marginBottom: 8,
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,255,145,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(77,255,145,0.1)'}
              >
                🎉 Mark as Done
              </button>
            )}
            <button
              onClick={() => { if (confirm('Delete this card?')) { onDelete(card.id, columnId); onClose() } }}
              style={{ width: '100%', padding: '8px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
            >🗑 Delete card</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const sideLabel = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
}

// ── KANBAN CARD ───────────────────────────────────────────
function KanbanCard({ card, columnId, onEdit, onDelete, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { card, columnId } })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const p = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.medium

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'grab', transition: 'all 0.15s', position: 'relative', userSelect: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        {card.labels?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {card.labels.map((l, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-dim)', color: 'var(--accent2)' }}>{l}</span>)}
          </div>
        )}
        {/* Done indicator */}
        {columnId === 'done' && (
          <div style={{
            position: 'absolute',
            top: 8, right: 8,
            width: 18, height: 18,
            borderRadius: '50%',
            background: 'rgba(77,255,145,0.15)',
            border: '1px solid rgba(77,255,145,0.3)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10, color: 'var(--green)',
          }}>✓</div>
        )}
        {/* Clickable title */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onOpen(card, columnId) }}
          style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
        >{card.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: p.bg, color: p.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label}</span>
            {card.dueDate && <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>📅 {new Date(card.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Assigned avatar */}
            {card.assignedTo && (
              <div
                title={card.assignedName}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10,
                  fontWeight: 700, color: 'white',
                  border: '2px solid var(--surface2)',
                  flexShrink: 0,
                }}
              >
                {card.assignedName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onEdit(card, columnId) }} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface3)', color: 'var(--text2)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
            <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(card.id, columnId) }} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface3)', color: 'var(--text2)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── KANBAN COLUMN ─────────────────────────────────────────
function KanbanColumn({ column, cards, onAddCard, onEditCard, onDeleteCard, onOpenCard, onRename, onDeleteColumn }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({
    id: column.id,
    data: { type: 'column', column }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  function handleAdd() {
    if (!newTitle.trim()) { setAdding(false); return }
    onAddCard(column.id, newTitle.trim())
    setNewTitle(''); setAdding(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: 300, flexShrink: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* Column header — drag handle here */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0, cursor: 'grab',
        }}
        {...attributes}
        {...listeners}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: column.color, flexShrink: 0,
            boxShadow: `0 0 8px ${column.color}`,
          }}/>
          <span
            style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--text)', letterSpacing: '-0.01em',
              cursor: 'text',
            }}
            onPointerDown={e => e.stopPropagation()}
            onDoubleClick={() => onRename(column.id, column.title)}
            title="Double-click to rename"
          >
            {column.title}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--text3)', background: 'var(--surface2)',
            padding: '1px 7px', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            {cards.length}
          </span>
        </div>

        {/* Column actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setAdding(true) }}
            style={{
              width: 26, height: 26, borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text2)', cursor: 'pointer',
              fontSize: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-dim)'
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.color = 'var(--text2)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >+</button>

          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDeleteColumn(column.id) }}
            style={{
              width: 26, height: 26, borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text3)', cursor: 'pointer',
              fontSize: 12, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--red-dim)'
              e.currentTarget.style.color = 'var(--red)'
              e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.color = 'var(--text3)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            title="Delete column"
          >✕</button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
        <SortableContext
          items={cards.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !adding && (
          <div style={{
            textAlign: 'center', padding: '2rem 1rem',
            color: 'var(--text3)', fontSize: 13,
            border: '2px dashed var(--border)', borderRadius: 10,
          }}>
            No cards yet
          </div>
        )}

        {adding && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--accent)',
            borderRadius: 10, padding: 10, marginTop: 4,
          }}>
            <textarea
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
              }}
              placeholder="Card title... (Enter to save)"
              autoFocus rows={2}
              style={{
                width: '100%', background: 'none',
                border: 'none', color: 'var(--text)',
                fontSize: 14, resize: 'none',
                outline: 'none', fontFamily: 'Inter, sans-serif',
                marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleAdd} style={{
                padding: '5px 14px', background: 'var(--accent)',
                border: 'none', borderRadius: 7,
                color: 'white', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}>Add card</button>
              <button onClick={() => { setAdding(false); setNewTitle('') }} style={{
                padding: '5px 10px', background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 7, color: 'var(--text2)',
                fontSize: 12, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── CARD EDIT MODAL ───────────────────────────────────────
function CardModal({ card, onClose, onSave }) {
  const [title, setTitle] = useState(card?.title || '')
  const [priority, setPriority] = useState(card?.priority || 'medium')
  const [dueDate, setDueDate] = useState(card?.dueDate || '')
  const [label, setLabel] = useState('')
  const [labels, setLabels] = useState(card?.labels || [])

  function addLabel() {
    if (label.trim() && !labels.includes(label.trim())) { setLabels([...labels, label.trim()]); setLabel('') }
  }

  function save() {
    if (!title.trim()) return
    onSave({ title: title.trim(), priority, dueDate, labels }); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>{card ? 'Edit Card' : 'New Card'}</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>TITLE</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus style={{ width: '100%', padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>PRIORITY</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => setPriority(key)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${priority === key ? cfg.color : 'var(--border)'}`, background: priority === key ? cfg.bg : 'var(--surface2)', color: priority === key ? cfg.color : 'var(--text2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>{cfg.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>DUE DATE</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>LABELS</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} placeholder="Add label..." style={{ flex: 1, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
            <button onClick={addLabel} style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}>+</button>
          </div>
          {labels.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {labels.map((l, i) => <span key={i} onClick={() => setLabels(labels.filter((_, j) => j !== i))} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', background: 'var(--accent-dim)', color: 'var(--accent2)', border: '1px solid rgba(124,106,255,0.2)' }}>{l} ×</span>)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={!title.trim()} style={{ flex: 2, padding: 11, background: 'var(--accent)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: !title.trim() ? 0.5 : 1 }}>{card ? 'Save Changes' : 'Create Card'}</button>
        </div>
      </div>
    </div>
  )
}

// ── INVITE MODAL ──────────────────────────────────────────
function InviteModal({ boardId, board, user, onClose }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true); setStatus(null)
    const result = await inviteMember(boardId, email.trim())
    if (result.error) {
      setStatus({ type: 'error', msg: result.error })
    } else {
      setStatus({ type: 'success', msg: `${email} has been added to the board!` })
      await logActivity(boardId, user, `invited ${email} to the board`)
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'slideUp 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>👥 Invite Members</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Invite a teammate by their email. They need to have a FlowBoard account first.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="teammate@email.com"
            type="email"
            autoFocus
            style={{ flex: 1, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleInvite}
            disabled={!email.trim() || loading}
            style={{ padding: '10px 18px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !email.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>

        {status && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: status.type === 'success' ? 'rgba(77,255,145,0.1)' : 'var(--red-dim)', color: status.type === 'success' ? 'var(--green)' : 'var(--red)', border: `1px solid ${status.type === 'success' ? 'rgba(77,255,145,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
            {status.msg}
          </div>
        )}

        {/* Current members */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Current Members</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(board?.members || []).map((uid, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                  {uid === user.uid ? user.displayName?.[0]?.toUpperCase() : '?'}
                </div>
                <span style={{ color: 'var(--text2)' }}>{uid === user.uid ? 'You (owner)' : 'Member'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI GENERATE MODAL ────────────────────────────────────
function AIGenerateModal({ boardId, user, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('https://freshguard-proxy.muhammadsaniahmad007.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are a project manager. Generate a kanban board task list for this project: "${prompt}".

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "tasks": [
    { "title": "Task name", "column": "todo", "priority": "high" },
    { "title": "Task name", "column": "inprogress", "priority": "medium" },
    { "title": "Task name", "column": "review", "priority": "low" },
    { "title": "Task name", "column": "done", "priority": "low" }
  ]
}

Rules:
- column must be one of: todo, inprogress, review, done
- priority must be one of: high, medium, low
- Generate 8-12 realistic tasks spread across columns
- Most tasks should be in "todo", a few in other columns
- Make tasks specific and actionable`
          }]
        })
      })
      const data = await r.json()
      const text = data.content.map(i => i.text || '').join('')
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      await onGenerate(parsed.tasks)
      onClose()
    } catch (e) {
      setError('Failed to generate tasks. Check your API connection and try again.')
    }
    setLoading(false)
  }

  const examples = [
    'Build a mobile e-commerce app',
    'Launch a company blog',
    'Redesign the company website',
    'Build a user authentication system',
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', animation: 'slideUp 0.25s ease' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>✨ AI Task Generator</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Describe your project and AI will fill your board</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '1rem', marginTop: '1.25rem' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate() }}
            placeholder="e.g. Build a React e-commerce store with product listings, cart, and checkout..."
            rows={3}
            autoFocus
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, transition: 'border 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Examples */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Try an example</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                style={{ padding: '5px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text2)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
              >{ex}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,77,77,0.2)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            style={{ flex: 2, padding: 11, background: loading ? 'var(--surface3)' : 'var(--accent)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: !prompt.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                Generating tasks...
              </>
            ) : '✨ Generate Tasks'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 10 }}>⌘ + Enter to generate</p>
      </div>
    </div>
  )
}

// ── SHORTCUTS MODAL ───────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: ['/'],    label: 'Focus search' },
    { keys: ['A'],    label: 'Toggle activity log' },
    { keys: ['I'],    label: 'Toggle invite panel' },
    { keys: ['G'],    label: 'Toggle AI generator' },
    { keys: ['Esc'],  label: 'Close modals / clear search' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'slideUp 0.25s ease' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>⌨️ Keyboard Shortcuts</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.keys.map((k, j) => (
                  <kbd key={j} style={{ padding: '3px 10px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 0 var(--border)' }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: '1.25rem', textAlign: 'center' }}>
          Shortcuts are disabled when typing in an input
        </p>
      </div>
    </div>
  )
}

// ── STATS PANEL ───────────────────────────────────────────
function StatsPanel({ cards, columns, columnOrder, board, onClose }) {
  const allCards = Object.values(cards).flat()
  const total = allCards.length
  const done = (cards['done'] || []).length
  const highPriority = allCards.filter(c => c.priority === 'high').length
  const overdue = allCards.filter(c => {
    if (!c.dueDate || c.completed) return false
    return new Date(c.dueDate) < new Date()
  }).length
  const assigned = allCards.filter(c => c.assignedTo).length
  const completion = total ? Math.round((done / total) * 100) : 0

  const colData = columnOrder.map(id => {
    const col = columns.find(c => c.id === id)
    return { title: col?.title || id, count: (cards[id] || []).length, color: col?.color || '#6b7280' }
  })

  const priorities = [
    { label: 'High', color: '#ff4d4d', bg: 'rgba(255,77,77,0.12)', count: allCards.filter(c => c.priority === 'high').length },
    { label: 'Medium', color: '#ffd44d', bg: 'rgba(255,212,77,0.12)', count: allCards.filter(c => c.priority === 'medium').length },
    { label: 'Low', color: '#4dff91', bg: 'rgba(77,255,145,0.12)', count: allCards.filter(c => c.priority === 'low').length },
  ]

  const maxCol = Math.max(...colData.map(c => c.count), 1)

  return (
    <div style={{
      position: 'fixed', top: 56, right: 0, bottom: 0,
      width: 340, background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      zIndex: 50, display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s ease',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'var(--surface)', zIndex: 1,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>📊 Board Stats</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total Cards', value: total, color: 'var(--text)' },
            { label: 'Completed', value: done, color: 'var(--green)' },
            { label: 'High Priority', value: highPriority, color: 'var(--red)' },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? 'var(--red)' : 'var(--text3)' },
            { label: 'Assigned', value: assigned, color: 'var(--accent)' },
            { label: 'Unassigned', value: total - assigned, color: 'var(--text3)' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px', textAlign: 'center', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, marginBottom: 4, letterSpacing: '-0.03em' }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Completion progress */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Overall Progress</span>
            <span style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
              color: completion >= 70 ? 'var(--green)' : completion >= 40 ? 'var(--yellow)' : 'var(--red)',
            }}>{completion}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${completion}%`,
              background: completion >= 70 ? 'var(--green)' : completion >= 40 ? 'var(--yellow)' : 'var(--accent)',
              borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, textAlign: 'right' }}>
            {done} of {total} cards done
          </div>
        </div>

        {/* Cards per column bar chart */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>Cards per Column</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {colData.map((col, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.count > 0 ? 'var(--text2)' : 'transparent' }}>{col.count}</span>
                <div style={{
                  width: '100%',
                  height: `${Math.max((col.count / maxCol) * 60, col.count > 0 ? 6 : 2)}px`,
                  background: col.count > 0 ? col.color : 'var(--border)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: col.count > 0 ? `0 0 12px ${col.color}40` : 'none',
                }}/>
                <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {col.title.slice(0, 6)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority breakdown */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>Priority Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {priorities.map(p => (
              <div key={p.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.color, background: p.bg, padding: '2px 8px', borderRadius: 6 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>
                    {p.count} card{p.count !== 1 ? 's' : ''}
                    {total > 0 && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> ({Math.round((p.count / total) * 100)}%)</span>}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: total > 0 ? `${(p.count / total) * 100}%` : '0%',
                    background: p.color, borderRadius: 3,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board info */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>Board Info</div>
          {[
            { label: 'Members', value: board?.members?.length || 1 },
            { label: 'Columns', value: columnOrder.length },
            { label: 'Created', value: board?.createdAt ? new Date(board.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
          ].map(info => (
            <div key={info.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{info.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{info.value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── ACTIVITY PANEL ────────────────────────────────────────
function ActivityPanel({ log, onClose }) {
  return (
    <div style={{
      position: 'fixed', top: 56, right: 0, bottom: 0,
      width: 300, background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      zIndex: 50, display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.25s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Activity</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {log.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: 13 }}>
            No activity yet
          </div>
        )}
        {log.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', gap: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11,
              fontWeight: 700, color: 'white',
            }}>
              {entry.userName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {entry.userName}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}> {entry.text}</span>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                {new Date(entry.createdAt).toLocaleDateString('en', {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── BOARD PAGE ────────────────────────────────────────────
export default function BoardPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [board, setBoard] = useState(null)
  const [cards, setCards] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState(null)
  const [editingColumnId, setEditingColumnId] = useState(null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [activeCard, setActiveCard] = useState(null)
  const [activeColumn, setActiveColumn] = useState(null)
  const [columnOrder, setColumnOrder] = useState(['todo', 'inprogress', 'review', 'done'])
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [openCard, setOpenCard] = useState(null)
  const [openCardColumnId, setOpenCardColumnId] = useState(null)
  const [showActivity, setShowActivity] = useState(false)
  const [activityLog, setActivityLog] = useState([])
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  function toast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  function fireConfetti() {
    const count = 200
    const defaults = { origin: { y: 0.7 } }
    function fire(particleRatio, opts) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) })
    }
    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#7c6aff', '#a78bfa'] })
    fire(0.2,  { spread: 60, colors: ['#ffd44d', '#f59e0b'] })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#4dff91', '#10b981'] })
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ff4d4d', '#f43f5e'] })
    fire(0.1,  { spread: 120, startVelocity: 45, colors: ['#ffffff', '#e8d48a'] })
  }

  // Keyboard shortcuts
  useKeyboard([
    { key: '/', action: () => document.querySelector('input[placeholder="Search cards..."]')?.focus() },
    { key: 'Escape', action: () => {
      setOpenCard(null)
      setOpenCardColumnId(null)
      setShowCardModal(false)
      setShowActivity(false)
      setShowInvite(false)
      setShowShortcuts(false)
      setShowAI(false)
      setShowStats(false)
      setSearch('')
    }},
    { key: 'a', action: () => setShowActivity(prev => !prev) },
    { key: 'i', action: () => setShowInvite(prev => !prev) },
    { key: 'g', action: () => setShowAI(prev => !prev) },
    { key: 's', action: () => setShowStats(prev => !prev) },
  ])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'boards', boardId), snap => {
      if (snap.exists()) setBoard({ id: snap.id, ...snap.data() })
      else navigate('/')
      setLoading(false)
    })
    return unsub
  }, [boardId])

  useEffect(() => {
    if (board?.columns) setColumns(board.columns)
    if (board?.columnOrder) setColumnOrder(board.columnOrder)
  }, [board])

  useEffect(() => {
    if (!boardId) return
    const q = query(
      collection(db, 'boards', boardId, 'activity'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setActivityLog(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [boardId])

  useEffect(() => {
    const unsubs = DEFAULT_COLUMNS.map(col => {
      const q = query(collection(db, 'boards', boardId, 'columns', col.id, 'cards'), orderBy('order', 'asc'))
      return onSnapshot(q, snap => {
        setCards(prev => ({ ...prev, [col.id]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [boardId])

  async function addCard(columnId, title) {
    const colCards = cards[columnId] || []
    await addDoc(collection(db, 'boards', boardId, 'columns', columnId, 'cards'), {
      title, priority: 'medium', labels: [], dueDate: '',
      assignedTo: null, assignedName: null,
      order: colCards.length, createdAt: Date.now(), createdBy: user.uid,
    })
    const colName = DEFAULT_COLUMNS.find(c => c.id === columnId)?.title
    await logActivity(boardId, user, `added "${title}" to ${colName}`)
  }

  function openEditCard(card, columnId) {
    setEditingCard(card); setEditingColumnId(columnId); setShowCardModal(true)
  }

  async function saveCard(data) {
    if (editingCard) {
      await updateDoc(doc(db, 'boards', boardId, 'columns', editingColumnId, 'cards', editingCard.id), data)
    }
    setEditingCard(null); setEditingColumnId(null)
  }

  async function deleteCard(cardId, columnId) {
    const card = (cards[columnId] || []).find(c => c.id === cardId)
    await deleteDoc(doc(db, 'boards', boardId, 'columns', columnId, 'cards', cardId))
    if (card) await logActivity(boardId, user, `deleted "${card.title}"`)
  }

  function openCardDetail(card, columnId) {
    setOpenCard(card); setOpenCardColumnId(columnId)
  }

  async function assignCard(cardId, columnId, uid, name) {
    await updateDoc(
      doc(db, 'boards', boardId, 'columns', columnId, 'cards', cardId),
      { assignedTo: uid, assignedName: name }
    )
    await logActivity(boardId, user, `assigned "${name}" to a card`)
  }

  async function generateTasks(tasks) {
    for (const task of tasks) {
      const colCards = cards[task.column] || []
      await addDoc(
        collection(db, 'boards', boardId, 'columns', task.column, 'cards'),
        {
          title: task.title,
          priority: task.priority,
          labels: [], dueDate: '',
          order: colCards.length,
          createdAt: Date.now(),
          createdBy: user.uid,
        }
      )
    }
    await logActivity(boardId, user, `generated ${tasks.length} tasks with AI`)
    toast('Tasks generated successfully!')
  }

  async function addColumn() {
    const title = prompt('Column name:')
    if (!title?.trim()) return
    const id = title.toLowerCase().replace(/\s+/g, '') + Date.now()
    const color = ['#7c6aff','#f59e0b','#10b981','#3b82f6','#f43f5e'][
      Math.floor(Math.random() * 5)
    ]
    const newCol = { id, title: title.trim(), color }
    const newColumns = [...columns, newCol]
    const newOrder = [...columnOrder, id]
    setColumns(newColumns)
    setColumnOrder(newOrder)
    await updateDoc(doc(db, 'boards', boardId), {
      columns: newColumns,
      columnOrder: newOrder,
    })
    await logActivity(boardId, user, `added column "${title.trim()}"`)
  }

  async function renameColumn(colId, currentTitle) {
    const title = prompt('New column name:', currentTitle)
    if (!title?.trim() || title === currentTitle) return
    const newColumns = columns.map(c =>
      c.id === colId ? { ...c, title: title.trim() } : c
    )
    setColumns(newColumns)
    await updateDoc(doc(db, 'boards', boardId), { columns: newColumns })
    await logActivity(boardId, user, `renamed column to "${title.trim()}"`)
  }

  async function deleteColumn(colId) {
    const col = columns.find(c => c.id === colId)
    const colCards = cards[colId] || []
    if (colCards.length > 0) {
      if (!confirm(`"${col.title}" has ${colCards.length} card(s). Delete anyway?`)) return
    } else {
      if (!confirm(`Delete "${col.title}" column?`)) return
    }
    const newColumns = columns.filter(c => c.id !== colId)
    const newOrder = columnOrder.filter(id => id !== colId)
    setColumns(newColumns)
    setColumnOrder(newOrder)
    await updateDoc(doc(db, 'boards', boardId), {
      columns: newColumns,
      columnOrder: newOrder,
    })
    await logActivity(boardId, user, `deleted column "${col.title}"`)
  }

  function handleDragStart(event) {
    const { type } = event.active.data.current
    if (type === 'column') {
      setActiveColumn(event.active.data.current.column)
      return
    }
    const { card, columnId } = event.active.data.current
    setActiveCard({ ...card, columnId })
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveCard(null)
    setActiveColumn(null)
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    // ── Column reorder ──────────────────────────
    if (activeType === 'column') {
      const oldIdx = columnOrder.indexOf(active.id)
      const newIdx = columnOrder.indexOf(over.id)
      if (oldIdx === newIdx) return
      const newOrder = arrayMove(columnOrder, oldIdx, newIdx)
      setColumnOrder(newOrder)
      await updateDoc(doc(db, 'boards', boardId), { columnOrder: newOrder })
      await logActivity(boardId, user, `reordered columns`)
      return
    }

    // ── Card move ───────────────────────────────
    const fromCol = active.data.current.columnId
    const toCol = over.data.current?.columnId || fromCol

    if (fromCol === toCol) {
      const colCards = [...(cards[fromCol] || [])]
      const oldIdx = colCards.findIndex(c => c.id === active.id)
      const newIdx = colCards.findIndex(c => c.id === over.id)
      if (oldIdx === newIdx) return
      const reordered = arrayMove(colCards, oldIdx, newIdx)
      setCards(prev => ({ ...prev, [fromCol]: reordered }))
      reordered.forEach((card, i) =>
        updateDoc(doc(db, 'boards', boardId, 'columns', fromCol, 'cards', card.id), { order: i })
      )
    } else {
      const card = (cards[fromCol] || []).find(c => c.id === active.id)
      if (!card) return
      await deleteDoc(doc(db, 'boards', boardId, 'columns', fromCol, 'cards', card.id))
      const toCards = cards[toCol] || []
      await addDoc(
        collection(db, 'boards', boardId, 'columns', toCol, 'cards'),
        { ...card, order: toCards.length, createdAt: Date.now() }
      )
      const colName = columns.find(c => c.id === toCol)?.title
      await logActivity(boardId, user, `moved "${card.title}" to ${colName}`)

      if (toCol === 'done') {
        fireConfetti()
      }
    }
  }

  const totalCards = Object.values(cards).flat().length
  const doneCards = (cards['done'] || []).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Board background */}
      {board?.background && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: board.background,
          opacity: 0.06,
          pointerEvents: 'none',
          zIndex: 0,
        }}/>
      )}
      {/* Top bar */}
      <div style={{ background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, padding: '4px 8px', borderRadius: 8, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 22 }}>{board?.emoji}</span>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{board?.title}</span>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cards..."
            style={{
              width: '100%', padding: '7px 12px 7px 32px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13,
              color: 'var(--text)', outline: 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: 'var(--text3)', cursor: 'pointer',
                fontSize: 14, padding: 0,
              }}
            >×</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{doneCards}/{totalCards} done</span>
          <div style={{ width: 100, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: totalCards > 0 ? `${(doneCards / totalCards) * 100}%` : '0%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }}/>
          </div>
        </div>
        {/* Member avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {board?.members?.slice(0, 5).map((uid, i) => (
            <div
              key={uid}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `hsl(${(i * 60) % 360}, 70%, 60%)`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11,
                fontWeight: 700, color: 'white',
                border: '2px solid var(--bg)',
                marginLeft: i > 0 ? -8 : 0,
                zIndex: 5 - i,
                position: 'relative',
              }}
              title={uid === user.uid ? 'You' : 'Member'}
            >
              {uid === user.uid
                ? user.displayName?.[0]?.toUpperCase()
                : '?'
              }
            </div>
          ))}
          {board?.members?.length > 5 && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--surface3)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10,
              fontWeight: 700, color: 'var(--text2)',
              border: '2px solid var(--bg)',
              marginLeft: -8,
            }}>
              +{board.members.length - 5}
            </div>
          )}
        </div>
        {/* AI Generate button */}
        <button
          onClick={() => setShowAI(true)}
          style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            border: 'none',
            borderRadius: 8, color: 'white',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,106,255,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ✨ AI Generate
        </button>
        {/* Invite button */}
        <button
          onClick={() => setShowInvite(true)}
          style={{
            padding: '6px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text2)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
        >
          👥 Invite
        </button>
        {/* Shortcuts button */}
        <button
          onClick={() => setShowShortcuts(prev => !prev)}
          style={{
            padding: '6px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text2)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          title="Keyboard shortcuts"
        >
          ⌨️ Shortcuts
        </button>
        {/* Stats toggle */}
        <button
          onClick={() => setShowStats(prev => !prev)}
          style={{
            padding: '6px 14px',
            background: showStats ? 'var(--accent-dim)' : 'var(--surface2)',
            border: `1px solid ${showStats ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8, color: showStats ? 'var(--accent)' : 'var(--text2)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          📊 Stats
        </button>
        {/* Activity toggle */}
        <button
          onClick={() => setShowActivity(prev => !prev)}
          style={{
            padding: '6px 14px',
            background: showActivity ? 'var(--accent-dim)' : 'var(--surface2)',
            border: `1px solid ${showActivity ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8, color: showActivity ? 'var(--accent)' : 'var(--text2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          📋 Activity
        </button>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '2rem' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <div style={{
              display: 'flex', gap: 16,
              alignItems: 'flex-start',
              minWidth: 'max-content',
            }}>
              {columnOrder.map(colId => {
                const col = columns.find(c => c.id === colId)
                if (!col) return null
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cards={
                      search.trim()
                        ? (cards[col.id] || []).filter(c =>
                            c.title.toLowerCase().includes(search.toLowerCase()) ||
                            c.labels?.some(l => l.toLowerCase().includes(search.toLowerCase()))
                          )
                        : (cards[col.id] || [])
                    }
                    onAddCard={addCard}
                    onEditCard={openEditCard}
                    onDeleteCard={deleteCard}
                    onOpenCard={openCardDetail}
                    onRename={renameColumn}
                    onDeleteColumn={deleteColumn}
                  />
                )
              })}

              {/* Add column button */}
              <button
                onClick={addColumn}
                style={{
                  width: 300, flexShrink: 0,
                  height: 54,
                  background: 'rgba(255,255,255,0.03)',
                  border: '2px dashed var(--border)',
                  borderRadius: 16,
                  color: 'var(--text3)', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-dim)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text3)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                + Add Column
              </button>
            </div>
          </SortableContext>

          {/* Drag overlays */}
          <DragOverlay>
            {activeCard && (
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--accent)',
                borderRadius: 12, padding: '12px 14px',
                width: 276,
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                cursor: 'grabbing', transform: 'rotate(2deg)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  {activeCard.title}
                </div>
              </div>
            )}
            {activeColumn && (
              <div style={{
                width: 300, background: 'var(--surface)',
                border: '1px solid var(--accent)',
                borderRadius: 16, padding: '14px 16px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                cursor: 'grabbing', transform: 'rotate(1deg)',
                opacity: 0.9,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: activeColumn.color,
                  }}/>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {activeColumn.title}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit modal */}
      {showCardModal && (
        <CardModal
          card={editingCard}
          onClose={() => { setShowCardModal(false); setEditingCard(null) }}
          onSave={saveCard}
        />
      )}

      {/* Detail modal */}
      {openCard && (
        <CardDetailModal
          card={openCard}
          columnId={openCardColumnId}
          boardId={boardId}
          onClose={() => { setOpenCard(null); setOpenCardColumnId(null) }}
          onSave={saveCard}
          onDelete={deleteCard}
        />
      )}

      {/* Activity panel */}
      {showActivity && (
        <ActivityPanel
          log={activityLog}
          onClose={() => setShowActivity(false)}
        />
      )}

      {showInvite && (
        <InviteModal
          boardId={boardId}
          board={board}
          user={user}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showAI && (
        <AIGenerateModal
          boardId={boardId}
          user={user}
          onClose={() => setShowAI(false)}
          onGenerate={generateTasks}
        />
      )}

      {/* Stats panel */}
      {showStats && (
        <StatsPanel
          cards={cards}
          columns={columns}
          columnOrder={columnOrder}
          board={board}
          onClose={() => setShowStats(false)}
        />
      )}

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent)', color: 'white',
          padding: '12px 24px', borderRadius: 30,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(124,106,255,0.4)',
          zIndex: 9999, animation: 'slideUp 0.3s ease',
        }}>
          ✨ {toastMsg}
        </div>
      )}
    </div>
  )
}