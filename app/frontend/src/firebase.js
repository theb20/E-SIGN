import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyA9OGo4tCiW984kRPuG36y6EG7vOh_JR_Y',
  authDomain:        'app-esign.firebaseapp.com',
  projectId:         'app-esign',
  storageBucket:     'app-esign.firebasestorage.app',
  messagingSenderId: '66743517778',
  appId:             '1:66743517778:web:7fcc5624554d9f2168d58b',
  measurementId:     'G-YP4K1SL628',
}

export const app       = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const auth      = getAuth(app)
