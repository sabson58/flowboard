import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, arrayUnion, query,
  where, getDocs
} from 'firebase/firestore'
import { db } from './config'

// ── ACTIVITY LOG ─────────────────────────────
export async function logActivity(boardId, userId, userName, text) {
  await addDoc(collection(db, 'activity', boardId, 'logs'), {
    text,
    userId,
    userName,
    timestamp: serverTimestamp(),
  })
}

// ── INVITE MEMBER ────────────────────────────
export async function inviteMember(boardId, email, inviterName) {
  // Find user by email
  const q = query(collection(db, 'users'), where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return { error: 'No user found with that email' }

  const invitedUser = snap.docs[0]
  const uid = invitedUser.id

  // Add to board members
  await updateDoc(doc(db, 'boards', boardId), {
    members: arrayUnion(uid)
  })

  // Add member record
  await addDoc(collection(db, 'members', boardId, 'users'), {
    uid,
    email,
    role: 'editor',
    joinedAt: serverTimestamp(),
  })

  return { success: true, uid }
}