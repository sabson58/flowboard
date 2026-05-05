import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCRSWQ1t5ic2puT5kg6TO7SK3JalgSMh5c",
  authDomain: "flowboard-kanban-85ad5.firebaseapp.com",
  projectId: "flowboard-kanban-85ad5",
  storageBucket: "flowboard-kanban-85ad5.firebasestorage.app",
  messagingSenderId: "424651584633",
  appId: "1:424651584633:web:b9d81d3279dd4fff3010a8"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()