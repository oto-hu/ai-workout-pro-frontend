import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WorkoutRequest, AIWorkoutResponse } from '@/types/workout';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getRateLimitKey(request: NextRequest): string {
  // In production, use user ID or session ID
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetTime: record.resetTime };
}

function createWorkoutPrompt(request: WorkoutRequest): string {
  const bodyPartNames = {
    chest: '胸筋',
    back: '背中',
    shoulders: '肩',
    arms: '腕',
    abs: '腹筋',
    legs: '脚',
    fullbody: '全身'
  };

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

function validateWorkoutRequest(body: unknown): { valid: boolean; error?: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be an object' };
  }

  const bodyObj = body as Record<string, unknown>;

  if (!bodyObj.targetMuscles || !Array.isArray(bodyObj.targetMuscles) || bodyObj.targetMuscles.length === 0) {
    return { valid: false, error: 'targetMuscles is required and must be a non-empty array' };
  }

  if (!bodyObj.fitnessLevel || !['beginner', 'intermediate', 'advanced'].includes(bodyObj.fitnessLevel as string)) {
    return { valid: false, error: 'fitnessLevel must be beginner, intermediate, or advanced' };
  }

  if (!bodyObj.duration || typeof bodyObj.duration !== 'number' || bodyObj.duration < 5 || bodyObj.duration > 120) {
    return { valid: false, error: 'duration must be a number between 5 and 120 minutes' };
  }

  if (!bodyObj.equipment || !Array.isArray(bodyObj.equipment) || bodyObj.equipment.length === 0) {
    return { valid: false, error: 'equipment is required and must be a non-empty array' };
  }

  if (!bodyObj.goals || !Array.isArray(bodyObj.goals) || bodyObj.goals.length === 0) {
    return { valid: false, error: 'goals is required and must be a non-empty array' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          type: 'rate_limit',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          type: 'configuration_error'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateWorkoutRequest(body);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: validation.error,
          type: 'validation_error'
        },
        { status: 400 }
      );
    }

    const workoutRequest: WorkoutRequest = body;
    const prompt = createWorkoutPrompt(workoutRequest);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは専門的なパーソナルトレーナーです。安全で効果的なワークアウトメニューを作成し、JSON形式で回答してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let aiResponse: AIWorkoutResponse;
    try {
      aiResponse = JSON.parse(content);
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    // Validate AI response structure
    const requiredFields = ['workoutTitle', 'estimatedTime', 'difficulty', 'exercises', 'cooldown', 'totalCalories', 'equipment'];
    for (const field of requiredFields) {
      if (!(field in aiResponse)) {
        throw new Error(`Missing required field in AI response: ${field}`);
      }
    }

    if (!Array.isArray(aiResponse.exercises) || aiResponse.exercises.length === 0) {
      throw new Error('Exercises array is empty or invalid');
    }

    // Return successful response with rate limit headers
    return NextResponse.json(aiResponse, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });

  } catch (error: unknown) {
    console.error('AI workout generation error:', error);

    // Handle different types of errors
    const errorObj = error as any;
    
    if (errorObj?.status === 429) {
      return NextResponse.json(
        { 
          error: 'APIリクエスト制限に達しました。しばらくお待ちください。',
          type: 'rate_limit',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    if (errorObj?.status >= 500) {
      return NextResponse.json(
        { 
          error: 'AI サービスで一時的な問題が発生しています。',
          type: 'api_error'
        },
        { status: 503 }
      );
    }

    if (errorObj?.code === 'ENOTFOUND' || errorObj?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'ネットワーク接続に問題があります。',
          type: 'network_error'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: errorObj?.message || '予期しないエラーが発生しました。',
        type: 'unknown'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Workout generation API is running',
      endpoint: 'POST /api/generate-workout',
      rateLimit: `${RATE_LIMIT} requests per hour`
    }
  );
}