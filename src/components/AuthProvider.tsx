'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, type AuthUser } from '../lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name?: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signInWithGithub: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        await AuthService.signInWithEmail(email, password)
        return true
      } catch {
        return false
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      try {
        await AuthService.signUpWithEmail(email, password, name)
        return true
      } catch {
        return false
      }
    },
    signInWithGoogle: async () => {
      try {
        await AuthService.signInWithGoogle()
        return true
      } catch {
        return false
      }
    },
    signInWithGithub: async () => {
      try {
        await AuthService.signInWithGithub()
        return true
      } catch {
        return false
      }
    },
    signOut: AuthService.signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}