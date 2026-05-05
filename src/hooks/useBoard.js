import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useBoard(boardId) {
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!boardId) return
    const unsub = onSnapshot(doc(db, 'boards', boardId), snap => {
      if (snap.exists()) setBoard({ id: snap.id, ...snap.data() })
      else setBoard(null)
      setLoading(false)
    })
    return unsub
  }, [boardId])

  return { board, loading }
}