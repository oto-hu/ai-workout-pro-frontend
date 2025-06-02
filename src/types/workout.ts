export interface BodyPart {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string;
  restTime: number;
  difficulty: number; // 1-5 stars
  instructions: string[];
  tips: string[];
  targetMuscles: string[];
  imageUrl?: string;
  videoUrl?: string;
  duration?: number; // for time-based exercises (seconds)
}

export interface WorkoutMenu {
  id: string;
  title: string;
  description: string;
  targetBodyParts: string[];
  exercises: Exercise[];
  totalDuration: number; // estimated minutes
  difficulty: number; // 1-5 average
  calories: number; // estimated calories burned
  equipment: string[];
  duration?: number; // for compatibility with favorites
  target_muscles?: string[]; // for compatibility with favorites
  createdAt: Date | import('firebase/firestore').Timestamp;
}

export interface WorkoutGeneration {
  status: 'idle' | 'loading' | 'success' | 'error';
  progress: number; // 0-100
  message: string;
  menu?: WorkoutMenu;
  error?: string;
}

export interface UserPreferences {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredDuration: number; // minutes
  availableEquipment: string[];
  goals: string[];
  injuries?: string[];
  limitations?: string[];
}

export interface WorkoutRequest {
  targetMuscles: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  equipment: string[];
  goals: string[];
  limitations?: string[];
  userPreferences?: UserPreferences;
}

export interface AIExercise {
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  targetMuscles: string[];
  difficulty: string;
  instructions: string[];
  tips: string;
  safetyNotes: string;
}

export interface AIWorkoutResponse {
  workoutTitle: string;
  estimatedTime: string;
  difficulty: string;
  exercises: AIExercise[];
  cooldown: string[];
  totalCalories: string;
  equipment: string;
}

export interface AIGenerationError {
  name: string;
  type: 'rate_limit' | 'api_error' | 'network_error' | 'validation_error' | 'unknown';
  message: string;
  retryAfter?: number;
}