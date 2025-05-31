import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from './firebase'
import { createClient } from './supabase'

export type User = {
  id: string
  email: string | null
  name: string | null
  image: string | null
}

// Convert Firebase user to our User type
export const convertFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    image: firebaseUser.photoURL,
  }
}

// Sign in with email and password
export const signInWithCredentials = async (email: string, password: string): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return convertFirebaseUser(result.user)
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Sign up with email and password
export const signUpWithCredentials = async (email: string, password: string, name: string): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = convertFirebaseUser(result.user)
    
    if (user) {
      // Create user in Supabase
      await createUserInSupabase(user, name)
    }
    
    return user
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    const result = await signInWithPopup(auth, provider)
    const user = convertFirebaseUser(result.user)
    
    if (user) {
      // Check if user exists in Supabase, if not create them
      await ensureUserInSupabase(user)
    }
    
    return user
  } catch (error) {
    console.error('Google sign in error:', error)
    throw error
  }
}

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe()
      resolve(convertFirebaseUser(firebaseUser))
    })
  })
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(convertFirebaseUser(firebaseUser))
  })
}

// Create user in Supabase
const createUserInSupabase = async (user: User, name?: string): Promise<void> => {
  const supabase = createClient()
  
  try {
    // Insert user
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: name || user.name,
        image: user.image,
      })

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    // Create user profile
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        fitness_level: 'beginner',
        goals: [],
        available_equipment: ['bodyweight'],
        available_time: 30,
      })
  } catch (error) {
    console.error('Error in createUserInSupabase:', error)
  }
}

// Ensure user exists in Supabase (for OAuth providers)
const ensureUserInSupabase = async (user: User): Promise<void> => {
  const supabase = createClient()
  
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      await createUserInSupabase(user)
    }
  } catch (error) {
    console.error('Error in ensureUserInSupabase:', error)
  }
}

// Get Firebase ID token for Supabase RLS
export const getFirebaseIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  } catch (error) {
    console.error('Error getting Firebase ID token:', error)
    return null
  }
}