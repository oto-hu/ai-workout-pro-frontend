import { AIWorkoutResponse, WorkoutRequest, AIGenerationError } from '@/types/workout';

// Rate limiting and caching
const API_CACHE = new Map<string, { data: AIWorkoutResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

export class AIClient {
  private static instance: AIClient;

  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
  }

  private generateCacheKey(request: WorkoutRequest): string {
    return JSON.stringify({
      targetMuscles: request.targetMuscles.sort(),
      fitnessLevel: request.fitnessLevel,
      duration: request.duration,
      equipment: request.equipment.sort(),
      goals: request.goals.sort(),
      limitations: request.limitations?.sort()
    });
  }

  private checkCache(cacheKey: string): AIWorkoutResponse | null {
    const cached = API_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      API_CACHE.delete(cacheKey);
    }
    return null;
  }

  private setCache(cacheKey: string, data: AIWorkoutResponse): void {
    API_CACHE.set(cacheKey, { data, timestamp: Date.now() });
  }

  private createWorkoutPrompt(request: WorkoutRequest): string {
    const targetMusclesJa = request.targetMuscles.join('・');

    const fitnessLevelJa = {
      beginner: '初心者',
      intermediate: '中級者',
      advanced: '上級者'
    }[request.fitnessLevel];

    const equipmentJa = request.equipment.includes('bodyweight') ? '自重のみ' : 
                       request.equipment.join('・');

    const goalsJa = request.goals.join('・');
    const limitationsJa = request.limitations?.join('・') || 'なし';

    return `
あなたは経験豊富なパーソナルトレーナーです。以下の条件に基づいて、安全で効果的なワークアウトメニューを作成してください。

【条件】
- 対象部位: ${targetMusclesJa}
- フィットネスレベル: ${fitnessLevelJa}
- 利用可能時間: ${request.duration}分
- 使用器具: ${equipmentJa}
- 目標: ${goalsJa}
- 制限事項: ${limitationsJa}

【重要な注意事項】
1. 安全性を最優先に考慮してください
2. 初心者には無理のない強度で設定してください
3. 怪我のリスクがある動作には適切な警告を含めてください
4. フォームの説明は具体的で分かりやすくしてください
5. 日本語で回答してください

以下のJSON形式で回答してください：

{
  "workoutTitle": "具体的なワークアウトタイトル",
  "estimatedTime": "予想時間（○分形式）",
  "difficulty": "難易度（★の数で表現）",
  "exercises": [
    {
      "name": "運動名",
      "sets": セット数（数値）,
      "reps": "回数または時間",
      "restTime": "休憩時間",
      "targetMuscles": ["対象筋肉1", "対象筋肉2"],
      "difficulty": "★★☆",
      "instructions": [
        "手順1",
        "手順2",
        "手順3"
      ],
      "tips": "効果を高めるコツ",
      "safetyNotes": "安全に行うための注意点"
    }
  ],
  "cooldown": [
    "クールダウン1",
    "クールダウン2"
  ],
  "totalCalories": "消費カロリー目安",
  "equipment": "使用器具"
}
`;
  }

  async generateWorkout(request: WorkoutRequest): Promise<AIWorkoutResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Enforce rate limiting
    await this.enforceRateLimit();

    try {
      // Call our API route instead of OpenAI directly
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          status: response.status,
          message: errorData.error,
          type: errorData.type,
          retryAfter: errorData.retryAfter
        };
      }

      const aiResponse: AIWorkoutResponse = await response.json();

      // Validate response structure
      this.validateAIResponse(aiResponse);

      // Cache the result
      this.setCache(cacheKey, aiResponse);

      return aiResponse;

    } catch (error: unknown) {
      throw this.handleAPIError(error);
    }
  }

  private validateAIResponse(response: unknown): void {
    const required = ['workoutTitle', 'estimatedTime', 'difficulty', 'exercises', 'cooldown', 'totalCalories', 'equipment'];
    
    if (typeof response !== 'object' || response === null) {
      throw new Error('Response is not an object');
    }

    const responseObj = response as Record<string, unknown>;
    
    for (const field of required) {
      if (!(field in responseObj)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(responseObj.exercises) || responseObj.exercises.length === 0) {
      throw new Error('Exercises array is empty or invalid');
    }

    for (const exercise of responseObj.exercises) {
      const requiredExerciseFields = ['name', 'sets', 'reps', 'restTime', 'targetMuscles', 'difficulty', 'instructions', 'tips', 'safetyNotes'];
      for (const field of requiredExerciseFields) {
        if (!(field in exercise)) {
          throw new Error(`Missing required exercise field: ${field}`);
        }
      }
    }
  }

  private handleAPIError(error: unknown): AIGenerationError {
    const errorObj = error as {
      status?: number;
      message?: string;
      code?: string;
      type?: string;
      headers?: Record<string, string>;
      retryAfter?: number;
      [key: string]: unknown;
    };

    if (errorObj?.status === 429) {
      return {
        name: 'AIGenerationError',
        type: 'rate_limit',
        message: 'APIリクエスト制限に達しました。しばらくお待ちください。',
        retryAfter: errorObj?.headers?.['retry-after'] ? parseInt(errorObj.headers['retry-after']) * 1000 : 60000
      };
    }

    if (errorObj?.status >= 500) {
      return {
        name: 'AIGenerationError',
        type: 'api_error',
        message: 'AI サービスで一時的な問題が発生しています。'
      };
    }

    if (errorObj?.code === 'ENOTFOUND' || errorObj?.code === 'ECONNREFUSED') {
      return {
        name: 'AIGenerationError',
        type: 'network_error',
        message: 'ネットワーク接続に問題があります。'
      };
    }

    if (errorObj?.message?.includes('JSON') || errorObj?.message?.includes('field')) {
      return {
        name: 'AIGenerationError',
        type: 'validation_error',
        message: 'AI レスポンスの形式に問題があります。'
      };
    }

    return {
      name: 'AIGenerationError',
      type: 'unknown',
      message: errorObj?.message || '予期しないエラーが発生しました。'
    };
  }
}


export const aiClient = AIClient.getInstance();
