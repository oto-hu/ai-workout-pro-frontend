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
  createdAt: Date;
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
  injuries?: string[];
}