import { User as NextAuthUser } from "next-auth"

export interface User extends NextAuthUser {
  id: string
}

export interface UserProfile {
  id: string
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  available_equipment: string[]
  available_time: number // minutes
  limitations?: string
  created_at: string
  updated_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  title: string
  target_muscles: string[]
  duration: number // minutes
  exercises: any // Will be the workout data from AI
  difficulty: string
  calories_burned?: number
  completed_at?: string
  rating?: number // 1-5 stars
  notes?: string
  created_at: string
}

export interface FavoriteWorkout {
  id: string
  user_id: string
  workout_data: any // Workout menu data
  title: string
  created_at: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>
}

declare module "next-auth" {
  interface Session {
    user: User
  }
  
  interface User {
    id: string
  }
}