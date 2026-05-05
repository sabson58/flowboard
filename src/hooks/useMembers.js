import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function inviteMember(boardId, email) {
  try {
    // Look up uid from userEmails collection
    const emailDoc = await getDoc(doc(db, 'userEmails', email))

    if (!emailDoc.exists()) {
      return {
        error: 'No account found with that email. Ask them to sign up on FlowBoard first.'
      }
    }

    const { uid } = emailDoc.data()

    // Add uid to board's members array
    await updateDoc(doc(db, 'boards', boardId), {
      members: arrayUnion(uid)
    })

    return { success: true }

  } catch (err) {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// Call this when a user registers or signs in with Google
export async function saveUserEmail(email, uid, name) {
  try {
    await setDoc(doc(db, 'userEmails', email), { uid, name })
  } catch (err) {
    console.error('Failed to save user email:', err)
  }
}
