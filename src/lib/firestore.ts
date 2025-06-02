import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface UserProfile {
  userId: string
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  availableEquipment: string[]
  availableTime: number
  limitations?: string[]
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface WorkoutSession {
  id?: string
  userId: string
  title: string
  targetMuscles: string[]
  duration: number
  exercises: import('../types/workout').Exercise[]
  difficulty: 'easy' | 'medium' | 'hard'
  caloriesBurned?: number
  rating?: number
  notes?: string
  completedAt?: Date | Timestamp
  createdAt?: Date | Timestamp
}

export interface FavoriteWorkout {
  id?: string
  userId: string
  workoutData: import('../types/workout').WorkoutMenu
  title: string
  createdAt?: Date | Timestamp
}

export class FirestoreService {
  static async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    const userRef = doc(db, 'users', user.id)
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  static async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User
    }
    return null
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  static async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    const profileRef = doc(db, 'userProfiles', profile.userId)
    await setDoc(profileRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profileRef = doc(db, 'userProfiles', userId)
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile
    }
    return null
  }

  static async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const profileRef = doc(db, 'userProfiles', userId)
    await updateDoc(profileRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  static async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<string> {
    const sessionsRef = collection(db, 'workoutSessions')
    const docRef = await addDoc(sessionsRef, {
      ...session,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  static async getWorkoutSession(sessionId: string): Promise<WorkoutSession | null> {
    const sessionRef = doc(db, 'workoutSessions', sessionId)
    const sessionSnap = await getDoc(sessionRef)
    
    if (sessionSnap.exists()) {
      return { id: sessionSnap.id, ...sessionSnap.data() } as WorkoutSession
    }
    return null
  }

  static async getUserWorkoutSessions(userId: string, limitCount = 50): Promise<WorkoutSession[]> {
    const sessionsRef = collection(db, 'workoutSessions')
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    const querySnap = await getDocs(q)
    return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutSession))
  }

  static async updateWorkoutSession(sessionId: string, data: Partial<WorkoutSession>): Promise<void> {
    const sessionRef = doc(db, 'workoutSessions', sessionId)
    await updateDoc(sessionRef, data)
  }

  static async deleteWorkoutSession(sessionId: string): Promise<void> {
    const sessionRef = doc(db, 'workoutSessions', sessionId)
    await deleteDoc(sessionRef)
  }

  static async createFavoriteWorkout(favorite: Omit<FavoriteWorkout, 'id' | 'createdAt'>): Promise<string> {
    const favoritesRef = collection(db, 'favoriteWorkouts')
    const docRef = await addDoc(favoritesRef, {
      ...favorite,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  static async getUserFavoriteWorkouts(userId: string): Promise<FavoriteWorkout[]> {
    const favoritesRef = collection(db, 'favoriteWorkouts')
    const q = query(
      favoritesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnap = await getDocs(q)
    return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FavoriteWorkout))
  }

  static async deleteFavoriteWorkout(favoriteId: string): Promise<void> {
    const favoriteRef = doc(db, 'favoriteWorkouts', favoriteId)
    await deleteDoc(favoriteRef)
  }

  static async queryCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    const collectionRef = collection(db, collectionName)
    const q = query(collectionRef, ...constraints)
    
    const querySnap = await getDocs(q)
    return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
  }
}