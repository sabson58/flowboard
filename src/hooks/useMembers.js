import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function inviteMember(boardId, email) {
  try {
    const emailDoc = await getDoc(doc(db, 'userEmails', email))
    if (!emailDoc.exists()) {
      return { error: 'No account found with that email. Ask them to sign up on FlowBoard first.' }
    }
    const { uid, name } = emailDoc.data()

    // Add uid to board members
    await updateDoc(doc(db, 'boards', boardId), {
      members: arrayUnion(uid)
    })

    // Save uid→profile mapping so we can look up by uid
    await setDoc(doc(db, 'users', uid), {
      uid, name, email,
    }, { merge: true })

    return { success: true, name: name || email }
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
