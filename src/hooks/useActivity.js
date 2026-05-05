import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function logActivity(boardId, user, text) {
  await addDoc(collection(db, 'boards', boardId, 'activity'), {
    text,
    userId: user.uid,
    userName: user.displayName || user.email,
    createdAt: Date.now(),
  })
}