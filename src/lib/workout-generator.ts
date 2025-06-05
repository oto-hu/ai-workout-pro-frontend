import { aiClient } from './ai-client';
import { generateWorkoutMenu } from './mockData';
import { SafeStorage } from './storage-utils';
import { 
  WorkoutRequest, 
  AIWorkoutResponse, 
  WorkoutMenu, 
  Exercise, 
  UserPreferences,
  AIExercise
} from '@/types/workout';

const STORAGE_KEY = 'aiWorkoutPro_userPreferences';

export class WorkoutGenerator {
  private static instance: WorkoutGenerator;

  static getInstance(): WorkoutGenerator {
    if (!WorkoutGenerator.instance) {
      WorkoutGenerator.instance = new WorkoutGenerator();
    }
    return WorkoutGenerator.instance;
  }

  /**
   * Load user preferences from localStorage
   */
  private getUserPreferences(): UserPreferences | null {
    if (typeof window === 'undefined') return null;
    
    const result = SafeStorage.getItem<UserPreferences>(STORAGE_KEY);
    return result.success ? result.data : null;
  }

  /**
   * Convert body part IDs to user-friendly names
   */
  private mapBodyPartsToTargetMuscles(bodyParts: string[]): string[] {
    const mapping: Record<string, string[]> = {
      chest: ['大胸筋', '上部大胸筋', '下部大胸筋'],
      back: ['広背筋', '僧帽筋', '菱形筋', '脊柱起立筋'],
      shoulders: ['三角筋', '前部三角筋', '中部三角筋', '後部三角筋'],
      arms: ['上腕二頭筋', '上腕三頭筋', '前腕筋群'],
      abs: ['腹直筋', '腹斜筋', '腹横筋', 'コア'],
      legs: ['大腿四頭筋', 'ハムストリング', '大臀筋', '下腿三頭筋'],
      fullbody: ['全身']
    };

    const muscles: string[] = [];
    bodyParts.forEach(part => {
      const mapped = mapping[part];
      if (mapped) {
        muscles.push(...mapped);
      }
    });

    return [...new Set(muscles)]; // Remove duplicates
  }

  /**
   * Create a workout request from selected body parts and user preferences
   */
  private createWorkoutRequest(selectedBodyParts: string[], options?: { generateImages?: boolean }): WorkoutRequest {
    const userPrefs = this.getUserPreferences();
    
    const defaultRequest: WorkoutRequest = {
      targetMuscles: this.mapBodyPartsToTargetMuscles(selectedBodyParts),
      fitnessLevel: 'beginner',
      duration: 30,
      equipment: ['bodyweight'],
      goals: ['fitness'],
      generateImages: options?.generateImages ?? false
    };

    if (!userPrefs) {
      return defaultRequest;
    }

    return {
      targetMuscles: this.mapBodyPartsToTargetMuscles(selectedBodyParts),
      fitnessLevel: userPrefs.fitnessLevel,
      duration: userPrefs.preferredDuration,
      equipment: userPrefs.availableEquipment,
      goals: userPrefs.goals,
      limitations: userPrefs.limitations,
      userPreferences: userPrefs,
      generateImages: options?.generateImages ?? false
    };
  }

  /**
   * Convert AI response to internal WorkoutMenu format
   */
  private convertAIResponseToWorkoutMenu(
    aiResponse: AIWorkoutResponse,
    selectedBodyParts: string[],
    isAIGenerated: boolean = true
  ): WorkoutMenu {
    const exercises: Exercise[] = aiResponse.exercises.map((aiExercise: AIExercise, index: number) => ({
      id: `ai-exercise-${index}`,
      name: aiExercise.name,
      sets: aiExercise.sets,
      reps: aiExercise.reps,
      restTime: this.parseRestTime(aiExercise.restTime),
      difficulty: this.parseDifficulty(aiExercise.difficulty),
      instructions: aiExercise.instructions,
      tips: [aiExercise.tips],
      targetMuscles: aiExercise.targetMuscles,
      imageUrl: aiExercise.imageUrl // Use DALL-E 3 generated image URL if available
    }));

    // Parse calories and duration
    const totalCalories = this.parseCalories(aiResponse.totalCalories);
    const totalDuration = this.parseDuration(aiResponse.estimatedTime);

    return {
      id: `ai-workout-${Date.now()}`,
      title: aiResponse.workoutTitle,
      description: isAIGenerated 
        ? `AIが生成したパーソナライズドワークアウト`
        : `${aiResponse.workoutTitle} (AI生成に失敗したため、代替メニューを表示しています)`,
      targetBodyParts: selectedBodyParts,
      exercises,
      totalDuration,
      difficulty: this.parseDifficulty(aiResponse.difficulty),
      calories: totalCalories,
      equipment: [aiResponse.equipment],
      createdAt: new Date()
    };
  }

  private parseRestTime(restTime: string): number {
    const match = restTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  }

  private parseDifficulty(difficulty: string): number {
    const stars = (difficulty.match(/★/g) || []).length;
    return Math.max(1, Math.min(5, stars));
  }

  private parseCalories(caloriesStr: string): number {
    const match = caloriesStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 150;
  }

  private parseDuration(timeStr: string): number {
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }

  /**
   * Generate workout with AI, fallback to mock if AI fails
   */
  async generateWorkout(
    selectedBodyParts: string[],
    onProgress?: (progress: number, message: string) => void,
    options?: { generateImages?: boolean }
  ): Promise<WorkoutMenu> {
    if (selectedBodyParts.length === 0) {
      throw new Error('少なくとも1つの部位を選択してください。');
    }

    onProgress?.(10, 'ユーザー設定を読み込み中...');

    const workoutRequest = this.createWorkoutRequest(selectedBodyParts, options);
    
    onProgress?.(20, 'AIに最適なメニューを依頼中...');

    try {
      // Try to generate with AI
      const aiResponse = await aiClient.generateWorkout(workoutRequest);
      
      onProgress?.(80, 'AI生成完了、メニューを最適化中...');
      
      const workoutMenu = this.convertAIResponseToWorkoutMenu(aiResponse, selectedBodyParts, true);
      
      onProgress?.(100, 'メニュー生成完了！');
      
      return workoutMenu;

    } catch (error) {
      console.error('AI generation failed, falling back to mock data:', error);
      
      // Log the error for monitoring
      this.logError(error, workoutRequest);
      
      // Check if it's an AIGenerationError with specific type
      const aiError = error as { name?: string; type?: string; message?: string; retryAfter?: number };
      
      if (aiError?.name === 'AIGenerationError') {
        // For certain error types, we might want to re-throw instead of falling back
        if (aiError.type === 'rate_limit') {
          throw {
            name: 'AIGenerationError',
            type: 'rate_limit',
            message: aiError.message || 'APIリクエスト制限に達しました。しばらくお待ちください。',
            retryAfter: aiError.retryAfter
          };
        }
        
        if (aiError.type === 'configuration_error') {
          throw {
            name: 'AIGenerationError',
            type: 'configuration_error',
            message: aiError.message || 'AIサービスの設定に問題があります。'
          };
        }
      }
      
      // Fallback to mock data for other errors
      onProgress?.(60, 'AI生成に失敗、フォールバックメニューを作成中...');
      
      const mockMenu = generateWorkoutMenu(selectedBodyParts);
      
      // Add notice that this is a fallback with more informative message
      const errorType = aiError?.type || 'unknown';
      mockMenu.description = `${mockMenu.description} (AI生成に失敗したため、代替メニューを表示しています。エラー: ${errorType})`;
      
      onProgress?.(100, 'メニュー生成完了！');
      
      return mockMenu;
    }
  }

  /**
   * Generate workout with streaming updates
   */
  async generateWorkoutWithStreaming(
    selectedBodyParts: string[],
    onProgress: (progress: number, message: string) => void,
    options?: { generateImages?: boolean }
  ): Promise<WorkoutMenu> {
    const messages = options?.generateImages 
      ? [
          'ユーザー設定を分析中...',
          'AI モデルに接続中...',
          '最適な運動を選定中...',
          'セット数と回数を計算中...',
          '安全性をチェック中...',
          'エクササイズ画像を生成中...',
          'メニューを最終調整中...'
        ]
      : [
          'ユーザー設定を分析中...',
          'AI モデルに接続中...',
          '最適な運動を選定中...',
          'セット数と回数を計算中...',
          '安全性をチェック中...',
          'メニューを最終調整中...'
        ];

    let currentProgress = 0;
    const progressIncrement = 80 / messages.length;

    // Simulate streaming with progress updates
    for (let i = 0; i < messages.length; i++) {
      currentProgress += progressIncrement;
      onProgress(Math.round(currentProgress), messages[i]);
      
      // Simulate network delay (longer for image generation)
      const delay = options?.generateImages && i === messages.length - 2 ? 2000 : 600;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return this.generateWorkout(selectedBodyParts, onProgress, options);
  }

  /**
   * Regenerate workout with different parameters
   */
  async regenerateWorkout(
    selectedBodyParts: string[],
    modifications: {
      makeDifficult?: boolean;
      makeEasier?: boolean;
      shortenTime?: boolean;
      extendTime?: boolean;
    },
    onProgress?: (progress: number, message: string) => void
  ): Promise<WorkoutMenu> {
    onProgress?.(10, '新しいバリエーションを生成中...');

    const baseRequest = this.createWorkoutRequest(selectedBodyParts);
    
    // Apply modifications
    if (modifications.makeDifficult && baseRequest.fitnessLevel !== 'advanced') {
      baseRequest.fitnessLevel = baseRequest.fitnessLevel === 'beginner' ? 'intermediate' : 'advanced';
    }
    
    if (modifications.makeEasier && baseRequest.fitnessLevel !== 'beginner') {
      baseRequest.fitnessLevel = baseRequest.fitnessLevel === 'advanced' ? 'intermediate' : 'beginner';
    }
    
    if (modifications.shortenTime) {
      baseRequest.duration = Math.max(15, baseRequest.duration - 15);
    }
    
    if (modifications.extendTime) {
      baseRequest.duration = Math.min(90, baseRequest.duration + 15);
    }

    onProgress?.(30, 'AIに新しいメニューを依頼中...');

    try {
      const aiResponse = await aiClient.generateWorkout(baseRequest);
      onProgress?.(90, 'メニューを最適化中...');
      
      const workoutMenu = this.convertAIResponseToWorkoutMenu(aiResponse, selectedBodyParts, true);
      onProgress?.(100, '新しいメニュー生成完了！');
      
      return workoutMenu;
    } catch (error) {
      console.error('Regeneration failed, using mock data:', error);
      onProgress?.(70, 'フォールバックメニューを生成中...');
      
      const mockMenu = generateWorkoutMenu(selectedBodyParts);
      onProgress?.(100, 'メニュー生成完了！');
      
      return mockMenu;
    }
  }

  /**
   * Log errors for monitoring and improvement
   */
  private logError(error: unknown, request: WorkoutRequest): void {
    // Enhanced error extraction
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    } else if (typeof error === 'object' && error !== null) {
      // Handle object errors (like API response errors)
      errorDetails = {
        ...error,
        message: (error as any).message || 'Unknown error',
        toString: String(error)
      };
    } else {
      errorDetails = {
        message: String(error),
        type: typeof error,
        value: error
      };
    }

    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: errorDetails.message || 'Unknown error occurred',
        type: errorDetails.type || (error as { type?: string }).type || 'unknown',
        name: errorDetails.name || 'UnknownError',
        stack: errorDetails.stack,
        details: errorDetails,
        originalError: error
      },
      request: {
        targetMuscles: request.targetMuscles,
        fitnessLevel: request.fitnessLevel,
        duration: request.duration,
        equipment: request.equipment,
        goals: request.goals
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    };

    // In a real app, send this to your monitoring service
    console.error('Workout generation error:', JSON.stringify(errorLog, null, 2));
    
    // Also log the raw error for immediate debugging
    console.error('Raw error object:', error);
    
    // Store locally for debugging (optional) with safe storage
    if (typeof window !== 'undefined') {
      const existingResult = SafeStorage.getItem<any[]>('aiWorkoutPro_errors', { defaultValue: [] });
      const errors = existingResult.success ? existingResult.data || [] : [];
      
      errors.push(errorLog);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      const saveResult = SafeStorage.setItem('aiWorkoutPro_errors', errors);
      if (!saveResult.success) {
        console.warn('Failed to store error in storage:', saveResult.error);
      }
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { totalErrors: number; recentErrors: number; errorTypes: Record<string, number> } | null {
    if (typeof window === 'undefined') return null;
    
    const result = SafeStorage.getItem<any[]>('aiWorkoutPro_errors', { defaultValue: [] });
    if (!result.success) return null;
    
    const errors = result.data || [];
    return {
      totalErrors: errors.length,
      recentErrors: errors.filter((e: { timestamp: string }) => 
        Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
      ).length,
      errorTypes: errors.reduce((acc: Record<string, number>, error: { error: { type?: string } }) => {
        const type = error.error.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

export const workoutGenerator = WorkoutGenerator.getInstance();

// Export for backward compatibility
export { generateWorkoutMenu } from './mockData';