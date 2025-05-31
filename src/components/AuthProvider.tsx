'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  onAuthStateChange, 
  signInWithCredentials, 
  signUpWithCredentials, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  User 
} from '@/lib/auth'
import { AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await signInWithCredentials(email, password)
      return !!user
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const user = await signUpWithCredentials(email, password, name)
      return !!user
    } catch (error) {
      console.error('Sign up error:', error)
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithGoogleProvider = async (): Promise<boolean> => {
    try {
      const user = await signInWithGoogle()
      return !!user
    } catch (error) {
      console.error('Google sign in error:', error)
      return false
    }
  }

  const updateProfile = async (): Promise<boolean> => {
    // TODO: Implement profile update functionality
    return false
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    signInWithGoogleProvider,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}