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
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If we can't parse the error response, create a generic error
          throw {
            status: response.status,
            message: `HTTPエラー: ${response.status} ${response.statusText}`,
            type: 'http_error'
          };
        }
        
        throw {
          status: response.status,
          message: errorData.error || errorData.message || `HTTPエラー: ${response.status}`,
          type: errorData.type || 'api_error',
          retryAfter: errorData.retryAfter,
          details: errorData.details
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
    // Only validate essential fields - allow optional fields to be missing
    const essentialFields = ['workoutTitle', 'exercises'];
    
    if (typeof response !== 'object' || response === null) {
      throw new Error('Response is not an object');
    }

    const responseObj = response as Record<string, unknown>;
    
    // Check essential fields only
    for (const field of essentialFields) {
      if (!(field in responseObj)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Set defaults for missing optional fields
    if (!('estimatedTime' in responseObj)) responseObj.estimatedTime = '30分';
    if (!('difficulty' in responseObj)) responseObj.difficulty = '★★☆';
    if (!('cooldown' in responseObj)) responseObj.cooldown = ['ストレッチ'];
    if (!('totalCalories' in responseObj)) responseObj.totalCalories = '150kcal';
    if (!('equipment' in responseObj)) responseObj.equipment = '自重';

    if (!Array.isArray(responseObj.exercises) || responseObj.exercises.length === 0) {
      throw new Error('Exercises array is empty or invalid');
    }

    // Validate exercise fields with more lenient requirements
    for (const exercise of responseObj.exercises) {
      const requiredExerciseFields = ['name', 'sets', 'reps', 'restTime', 'targetMuscles', 'difficulty', 'instructions', 'tips'];
      for (const field of requiredExerciseFields) {
        if (!(field in exercise)) {
          // Set reasonable defaults for missing exercise fields
          switch (field) {
            case 'sets':
              (exercise as any)[field] = 3;
              break;
            case 'reps':
              (exercise as any)[field] = '10回';
              break;
            case 'restTime':
              (exercise as any)[field] = '30秒';
              break;
            case 'targetMuscles':
              (exercise as any)[field] = ['全身'];
              break;
            case 'difficulty':
              (exercise as any)[field] = '★★☆';
              break;
            case 'instructions':
              (exercise as any)[field] = ['正しいフォームで行ってください'];
              break;
            case 'tips':
              (exercise as any)[field] = 'ゆっくりとした動作で効果を高めましょう';
              break;
            default:
              throw new Error(`Missing required exercise field: ${field}`);
          }
        }
      }
      // Add safetyNotes if missing
      if (!('safetyNotes' in exercise)) {
        (exercise as any).safetyNotes = '無理をせず、体調に合わせて調整してください';
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
      details?: string;
      [key: string]: unknown;
    };

    // Handle rate limit errors
    if (errorObj?.status === 429 || errorObj?.type === 'rate_limit') {
      return {
        name: 'AIGenerationError',
        type: 'rate_limit',
        message: errorObj?.message || 'APIリクエスト制限に達しました。しばらくお待ちください。',
        retryAfter: errorObj?.retryAfter || 60000
      };
    }

    // Handle server errors (5xx)
    if (errorObj?.status && errorObj.status >= 500) {
      return {
        name: 'AIGenerationError',
        type: 'api_error',
        message: errorObj?.message || 'AI サービスで一時的な問題が発生しています。'
      };
    }

    // Handle client errors (4xx)
    if (errorObj?.status && errorObj.status >= 400 && errorObj.status < 500) {
      return {
        name: 'AIGenerationError',
        type: 'client_error',
        message: errorObj?.message || 'リクエストに問題があります。'
      };
    }

    // Handle network errors
    if (errorObj?.code === 'ENOTFOUND' || errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ECONNRESET') {
      return {
        name: 'AIGenerationError',
        type: 'network_error',
        message: 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
      };
    }

    // Handle timeout errors
    if (errorObj?.code === 'ECONNABORTED' || (errorObj?.message && errorObj.message.includes('timeout'))) {
      return {
        name: 'AIGenerationError',
        type: 'timeout_error',
        message: 'リクエストがタイムアウトしました。再試行してください。'
      };
    }

    // Handle JSON parsing errors
    if (errorObj?.message?.includes('JSON') || errorObj?.message?.includes('field') || errorObj?.type === 'json_parse_error') {
      return {
        name: 'AIGenerationError',
        type: 'validation_error',
        message: 'AI レスポンスの形式に問題があります。再試行してください。'
      };
    }

    // Handle response validation errors
    if (errorObj?.type === 'response_validation_error' || errorObj?.message?.includes('Missing required field')) {
      return {
        name: 'AIGenerationError',
        type: 'validation_error',
        message: 'AI レスポンスに必要な情報が不足しています。再試行してください。'
      };
    }

    // Handle configuration errors
    if (errorObj?.type === 'configuration_error') {
      return {
        name: 'AIGenerationError',
        type: 'configuration_error',
        message: 'AIサービスの設定に問題があります。管理者にお問い合わせください。'
      };
    }

    // Generic fallback
    return {
      name: 'AIGenerationError',
      type: errorObj?.type || 'unknown',
      message: errorObj?.message || '予期しないエラーが発生しました。再試行してください。'
    };
  }
}


export const aiClient = AIClient.getInstance();
