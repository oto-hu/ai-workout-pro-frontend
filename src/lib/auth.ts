import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { FirestoreService } from './firestore'

export interface AuthUser {
  id: string
  email: string | null
  name?: string | null
  image?: string | null
}

export class AuthService {
  static async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return this.mapFirebaseUser(user)
  }

  static async signUpWithEmail(email: string, password: string, name?: string): Promise<AuthUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    
    // Create user in Firestore
    await FirestoreService.createUser({
      id: user.uid,
      email: user.email!,
      name: name || user.displayName || undefined,
      image: user.photoURL || undefined,
    })

    // Create default user profile
    await FirestoreService.createUserProfile({
      userId: user.uid,
      fitnessLevel: 'beginner',
      goals: [],
      availableEquipment: ['bodyweight'],
      availableTime: 30,
    })

    return this.mapFirebaseUser(user)
  }

  static async signInWithGoogle(): Promise<AuthUser> {
    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(auth, provider)
    
    // Check if user exists in Firestore
    const existingUser = await FirestoreService.getUser(user.uid)
    
    if (!existingUser) {
      // Create new user in Firestore
      await FirestoreService.createUser({
        id: user.uid,
        email: user.email!,
        name: user.displayName || undefined,
        image: user.photoURL || undefined,
      })

      // Create default user profile
      await FirestoreService.createUserProfile({
        userId: user.uid,
        fitnessLevel: 'beginner',
        goals: [],
        availableEquipment: ['bodyweight'],
        availableTime: 30,
      })
    }

    return this.mapFirebaseUser(user)
  }

  static async signInWithGithub(): Promise<AuthUser> {
    const provider = new GithubAuthProvider()
    const { user } = await signInWithPopup(auth, provider)
    
    // Check if user exists in Firestore
    const existingUser = await FirestoreService.getUser(user.uid)
    
    if (!existingUser) {
      // Create new user in Firestore
      await FirestoreService.createUser({
        id: user.uid,
        email: user.email!,
        name: user.displayName || undefined,
        image: user.photoURL || undefined,
      })

      // Create default user profile
      await FirestoreService.createUserProfile({
        userId: user.uid,
        fitnessLevel: 'beginner',
        goals: [],
        availableEquipment: ['bodyweight'],
        availableTime: 30,
      })
    }

    return this.mapFirebaseUser(user)
  }

  static async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  }

  static getCurrentUser(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user ? this.mapFirebaseUser(user) : null)
      })
    })
  }

  static onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.mapFirebaseUser(user) : null)
    })
  }

  private static mapFirebaseUser(user: User): AuthUser {
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      image: user.photoURL,
    }
  }
}
