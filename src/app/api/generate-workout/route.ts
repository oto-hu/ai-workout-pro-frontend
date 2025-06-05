import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WorkoutRequest, AIWorkoutResponse } from '@/types/workout';

export const dynamic = 'force-static';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Stability AI API configuration
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
const STABILITY_API_KEY = process.env.STABILITY_AI_API_KEY;

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
${targetMusclesJa}向け${request.duration}分間ワークアウト作成。レベル:${fitnessLevelJa}、器具:${equipmentJa}、目標:${goalsJa}、制限:${limitationsJa}

JSON形式で3つのエクササイズ返答:
{
  "workoutTitle": "タイトル",
  "estimatedTime": "${request.duration}分",
  "difficulty": "★☆☆",
  "exercises": [
    {
      "name": "運動名",
      "sets": 3,
      "reps": "10回",
      "restTime": "30秒",
      "targetMuscles": ["筋肉"],
      "difficulty": "★☆☆",
      "instructions": ["手順1","手順2"],
      "tips": "短いコツ"
    }
  ],
  "cooldown": ["ストレッチ"],
  "totalCalories": "100kcal",
  "equipment": "${equipmentJa}"
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

  if (bodyObj.generateImages !== undefined && typeof bodyObj.generateImages !== 'boolean') {
    return { valid: false, error: 'generateImages must be a boolean' };
  }

  return { valid: true };
}

// Problematic exercises that consistently fail with DALL-E 3
const PROBLEMATIC_EXERCISES = new Set([
  'グルートブリッジ',
  'glute bridge',
  'ヒップブリッジ'
]);

// Exercise replacement mapping for problematic terms
const EXERCISE_REPLACEMENTS: Record<string, string> = {
  'グルートブリッジ': 'ヒップスラスト',
  'glute bridge': 'hip thrust',
  'ヒップブリッジ': 'ブリッジエクササイズ'
};

// Alternative exercises for problematic ones
const ALTERNATIVE_EXERCISES: Record<string, string[]> = {
  'グルートブリッジ': ['ヒップスラスト', 'ブリッジエクササイズ', 'シングルレッグブリッジ'],
  'glute bridge': ['hip thrust', 'bridge exercise', 'single leg bridge'],
  'ヒップブリッジ': ['ヒップスラスト', 'ブリッジエクササイズ', 'シングルレッグブリッジ']
};

// Check if exercise name contains problematic terms
function isProblematicExercise(exerciseName: string): boolean {
  return Array.from(PROBLEMATIC_EXERCISES).some(problem => 
    exerciseName.toLowerCase().includes(problem.toLowerCase())
  );
}

// Replace problematic exercise names with safer alternatives
function replaceProblematicExercise(exerciseName: string): string {
  for (const [problematic, replacement] of Object.entries(EXERCISE_REPLACEMENTS)) {
    if (exerciseName.toLowerCase().includes(problematic.toLowerCase())) {
      console.log(`[INFO] Replacing problematic exercise "${exerciseName}" with "${replacement}"`);
      return exerciseName.replace(new RegExp(problematic, 'gi'), replacement);
    }
  }
  return exerciseName;
}

// Get alternative exercise if original fails
function getAlternativeExercise(exerciseName: string): string | null {
  for (const [problematic, alternatives] of Object.entries(ALTERNATIVE_EXERCISES)) {
    if (exerciseName.toLowerCase().includes(problematic.toLowerCase())) {
      // Return first alternative that's not the same as original
      const alternative = alternatives.find(alt => 
        alt.toLowerCase() !== exerciseName.toLowerCase()
      );
      if (alternative) {
        console.log(`[INFO] Using alternative exercise "${alternative}" for "${exerciseName}"`);
        return alternative;
      }
    }
  }
  return null;
}

// Japanese to English exercise name mapping
function translateExerciseName(japaneseExerciseName: string): string {
  const exerciseTranslations: Record<string, string> = {
    // 胸筋系
    'プッシュアップ': 'push up',
    'ダンベルプレス': 'dumbbell press',
    'ダンベルフライ': 'dumbbell fly',
    'チェストプレス': 'chest press',
    
    // 背筋系
    'プルアップ': 'pull up',
    'ラットプルダウン': 'lat pulldown',
    'バックエクステンション': 'back extension',
    'デッドリフト': 'deadlift',
    'ローイング': 'rowing',
    
    // 肩系
    'ショルダープレス': 'shoulder press',
    'ラテラルレイズ': 'lateral raise',
    'フロントレイズ': 'front raise',
    'リアデルトフライ': 'rear delt fly',
    
    // 腕系
    'ダンベルカール': 'dumbbell curl',
    'トライセプスエクステンション': 'triceps extension',
    'ハンマーカール': 'hammer curl',
    'ディップス': 'dips',
    
    // 腹筋系
    'プランク': 'plank',
    'シットアップ': 'sit up',
    'クランチ': 'crunch',
    'レッグレイズ': 'leg raise',
    'マウンテンクライマー': 'mountain climber',
    
    // 脚系
    'スクワット': 'squat',
    'ボディウェイトスクワット': 'bodyweight squat',
    'ランジ': 'lunge',
    'カーフレイズ': 'calf raise',
    'スタンディングカーフレイズ': 'standing calf raise',
    'ヒップスラスト': 'hip thrust',
    'ヒップブリッジ': 'bridge exercise',
    'グルートブリッジ': 'hip thrust',
    'ブリッジエクササイズ': 'bridge exercise',
    'シングルレッグブリッジ': 'single leg bridge',
    'レッグプレス': 'leg press',
    'デッドリフト': 'deadlift',
    
    // 全身系
    'バーピー': 'burpee',
    'ジャンピングジャック': 'jumping jack',
    'ハイニー': 'high knee',
    
    // その他
    'ストレッチ': 'stretch',
    'ウォーミングアップ': 'warm up',
    'クールダウン': 'cool down'
  };

  // Replace problematic exercises first
  const safeName = replaceProblematicExercise(japaneseExerciseName);

  // 完全一致を試す
  const exactMatch = exerciseTranslations[safeName];
  if (exactMatch) {
    return exactMatch;
  }

  // 部分一致を試す（キーワードベース）
  for (const [japanese, english] of Object.entries(exerciseTranslations)) {
    if (safeName.includes(japanese)) {
      return english;
    }
  }

  // 翻訳が見つからない場合は、日本語を除去して安全な英語フレーズに変換
  console.warn('[WARN] No translation found for exercise:', safeName);
  return 'strength training exercise';
}

// Stable Diffusion optimized exercise prompt mapping
function getStableDiffusionPrompt(exerciseName: string): string {
  const optimizedPrompts: Record<string, string> = {
    // 特定のエクササイズ用の最適化されたプロンプト
    'グルートブリッジ': 'athletic person performing bridge exercise, lying on back with knees bent and hips raised upward, fitness studio setting, professional workout demonstration, side angle view, detailed form, high quality, photorealistic',
    'ヒップブリッジ': 'athletic person performing bridge exercise, lying on back with knees bent and hips raised upward, fitness studio setting, professional workout demonstration, side angle view, detailed form, high quality, photorealistic',
    'glute bridge': 'athletic person performing bridge exercise, lying on back with knees bent and hips raised upward, fitness studio setting, professional workout demonstration, side angle view, detailed form, high quality, photorealistic',
    'hip bridge': 'athletic person performing bridge exercise, lying on back with knees bent and hips raised upward, fitness studio setting, professional workout demonstration, side angle view, detailed form, high quality, photorealistic',
    'ヒップスラスト': 'athletic person performing hip thrust exercise with proper form, fitness demonstration, clean gym environment, professional lighting, high quality, photorealistic',
    'hip thrust': 'athletic person performing hip thrust exercise with proper form, fitness demonstration, clean gym environment, professional lighting, high quality, photorealistic'
  };

  // 特定のエクササイズに対する最適化されたプロンプトがある場合はそれを使用
  if (optimizedPrompts[exerciseName]) {
    return optimizedPrompts[exerciseName];
  }

  // デフォルトのStable Diffusion向けプロンプト
  const englishExerciseName = translateExerciseName(exerciseName);
  return `athletic person demonstrating ${englishExerciseName} exercise with proper form, fitness training demonstration, modern gym setting, professional workout guide, clean lighting, high quality, photorealistic, detailed anatomy`;
}

async function generateExerciseImageWithStableDiffusion(exerciseName: string, targetMuscles: string[]): Promise<string | null> {
  try {
    // Validate API key
    if (!STABILITY_API_KEY) {
      console.error('[ERROR] Stability AI API key is not configured');
      return null;
    }

    // Get optimized prompt for Stable Diffusion
    const prompt = getStableDiffusionPrompt(exerciseName);
    
    console.log('[DEBUG] Generating Stable Diffusion image for:', { 
      exerciseName,
      prompt: prompt.substring(0, 100) + '...' 
    });

    // Prepare form data for Stability AI API
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'sd3.5-medium');
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', '1:1');
    formData.append('style_preset', 'photographic');
    formData.append('cfg_scale', '7');
    formData.append('steps', '28');

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Stability AI API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return null;
    }

    // Get the image as blob and convert to base64 data URL
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64String}`;

    console.log('[DEBUG] Stable Diffusion image generated successfully for:', exerciseName);
    return dataUrl;

  } catch (error: unknown) {
    const errorObj = error as any;
    console.error('[ERROR] Stable Diffusion image generation failed for', exerciseName, ':', {
      error,
      message: (error as Error)?.message,
      name: (error as Error)?.name,
      code: errorObj?.code,
      status: errorObj?.status
    });

    // Try with alternative exercise name if original failed
    const alternative = getAlternativeExercise(exerciseName);
    if (alternative && alternative !== exerciseName) {
      console.log(`[INFO] Retrying with alternative exercise: ${alternative}`);
      try {
        const alternativePrompt = getStableDiffusionPrompt(alternative);
        
        const formData = new FormData();
        formData.append('prompt', alternativePrompt);
        formData.append('model', 'sd3.5-medium');
        formData.append('output_format', 'png');
        formData.append('aspect_ratio', '1:1');
        formData.append('style_preset', 'photographic');
        formData.append('cfg_scale', '7');
        formData.append('steps', '28');

        const retryResponse = await fetch(STABILITY_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'image/*'
          },
          body: formData
        });

        if (retryResponse.ok) {
          const retryImageBlob = await retryResponse.blob();
          const retryArrayBuffer = await retryImageBlob.arrayBuffer();
          const retryBase64String = Buffer.from(retryArrayBuffer).toString('base64');
          const retryDataUrl = `data:image/png;base64,${retryBase64String}`;
          
          console.log('[DEBUG] Alternative exercise image generated successfully:', alternative);
          return retryDataUrl;
        }
      } catch (retryError) {
        console.error('[ERROR] Alternative exercise also failed:', alternative, retryError);
      }
    }
    
    return null;
  }
}

// Legacy DALL-E 3 function for fallback (if needed)
async function generateExerciseImageWithDallE(exerciseName: string, targetMuscles: string[]): Promise<string | null> {
  try {
    // Check if this is a problematic exercise and try alternative first
    let currentExerciseName = exerciseName;
    
    if (isProblematicExercise(exerciseName)) {
      const alternative = getAlternativeExercise(exerciseName);
      if (alternative) {
        currentExerciseName = alternative;
        console.log(`[INFO] Using alternative exercise "${alternative}" for image generation instead of "${exerciseName}"`);
      }
    }

    // 安全なプロンプトを生成（日本語の筋肉名や解剖学的表現を除去）
    const safePrompt = getStableDiffusionPrompt(currentExerciseName);
    
    console.log('[DEBUG] Generating DALL-E 3 image for:', { 
      originalName: exerciseName,
      usedName: currentExerciseName,
      safePrompt: safePrompt.substring(0, 100) + '...' 
    });
    
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: safePrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    if (imageResponse.data && imageResponse.data.length > 0 && imageResponse.data[0].url) {
      console.log('[DEBUG] DALL-E 3 image generated successfully for:', currentExerciseName);
      return imageResponse.data[0].url;
    } else {
      console.warn('[WARN] DALL-E 3 response missing image URL for:', currentExerciseName);
      return null;
    }
  } catch (error: unknown) {
    const errorObj = error as any;
    console.error('[ERROR] DALL-E 3 image generation failed for', exerciseName, ':', {
      error,
      message: (error as Error)?.message,
      name: (error as Error)?.name,
      code: errorObj?.code,
      type: errorObj?.type,
      status: errorObj?.status
    });

    // 特定のエクササイズでエラーが発生した場合は代替エクササイズを試す
    if (errorObj?.status === 400 && errorObj?.type === 'image_generation_user_error') {
      console.warn(`[WARN] Content policy violation for ${exerciseName}, trying alternative exercise`);
      
      // Try alternative exercise if not already tried
      if (!isProblematicExercise(exerciseName)) {
        const alternative = getAlternativeExercise(exerciseName);
        if (alternative) {
          console.log(`[INFO] Retrying with alternative exercise: ${alternative}`);
          try {
            const alternativePrompt = getStableDiffusionPrompt(alternative);
            const retryResponse = await openai.images.generate({
              model: "dall-e-3",
              prompt: alternativePrompt,
              size: "1024x1024",
              quality: "standard",
              n: 1,
            });
            
            if (retryResponse.data && retryResponse.data.length > 0 && retryResponse.data[0].url) {
              console.log('[DEBUG] Alternative exercise image generated successfully:', alternative);
              return retryResponse.data[0].url;
            }
          } catch (retryError) {
            console.error('[ERROR] Alternative exercise also failed:', alternative, retryError);
          }
        }
      }
    }
    
    return null;
  }
}

// Main image generation function that uses Stable Diffusion
async function generateExerciseImage(exerciseName: string, targetMuscles: string[]): Promise<string | null> {
  // Use Stable Diffusion 3.5 Medium as primary method
  return await generateExerciseImageWithStableDiffusion(exerciseName, targetMuscles);
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

    // Enhanced API key validation
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const stabilityApiKey = process.env.STABILITY_AI_API_KEY;
    
    console.log('[DEBUG] API Key validation:', {
      openai: {
        exists: !!openaiApiKey,
        length: openaiApiKey?.length || 0,
        startsWithSk: openaiApiKey?.startsWith('sk-') || false,
        prefix: openaiApiKey?.substring(0, 7) || 'undefined'
      },
      stability: {
        exists: !!stabilityApiKey,
        length: stabilityApiKey?.length || 0,
        startsWithSk: stabilityApiKey?.startsWith('sk-') || false,
        prefix: stabilityApiKey?.substring(0, 7) || 'undefined'
      }
    });

    if (!openaiApiKey) {
      console.error('[ERROR] OpenAI API key is not configured');
      return NextResponse.json(
        { 
          error: 'AI service not configured - OpenAI API key missing',
          type: 'configuration_error',
          details: 'OPENAI_API_KEY environment variable is not set'
        },
        { status: 503 }
      );
    }

    if (!openaiApiKey.startsWith('sk-')) {
      console.error('[ERROR] OpenAI API key format is invalid:', {
        actualPrefix: openaiApiKey.substring(0, 7),
        expectedPrefix: 'sk-'
      });
      return NextResponse.json(
        { 
          error: 'AI service not configured - invalid OpenAI API key format',
          type: 'configuration_error',
          details: 'OpenAI API key must start with "sk-"'
        },
        { status: 503 }
      );
    }

    // Note: Stability AI API key validation is handled within the image generation function

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

    console.log('[DEBUG] OpenAI API call initiated:', {
      model: process.env.AI_MODEL || 'o4-mini-2025-04-16',
      maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.TEMPERATURE || '1'),
      promptLength: prompt.length,
      requestData: {
        targetMuscles: workoutRequest.targetMuscles,
        fitnessLevel: workoutRequest.fitnessLevel,
        duration: workoutRequest.duration
      }
    });

    // Call OpenAI API with enhanced error handling
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'o4-mini-2025-04-16',
        messages: [
          {
            role: 'system',
            content: 'パーソナルトレーナー。JSON形式でワークアウト作成。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: parseInt(process.env.MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.TEMPERATURE || '1'),
        response_format: { type: 'json_object' }
      });
      
      console.log('[DEBUG] OpenAI API response received:', {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        usage: completion.usage,
        choicesLength: completion.choices?.length || 0
      });

    } catch (apiError: unknown) {
      console.error('[ERROR] OpenAI API call failed:', {
        error: apiError,
        message: (apiError as Error)?.message,
        name: (apiError as Error)?.name,
        stack: (apiError as Error)?.stack
      });
      throw apiError;
    }

    // Individual response stage checking
    console.log('[DEBUG] Checking response structure...');
    
    if (!completion) {
      console.error('[ERROR] OpenAI completion object is null/undefined');
      throw new Error('OpenAI API returned null completion object');
    }

    if (!completion.choices) {
      console.error('[ERROR] OpenAI completion.choices is missing:', { completion });
      throw new Error('OpenAI API response missing choices array');
    }

    if (!Array.isArray(completion.choices) || completion.choices.length === 0) {
      console.error('[ERROR] OpenAI completion.choices is empty or invalid:', {
        choices: completion.choices,
        isArray: Array.isArray(completion.choices),
        length: completion.choices?.length
      });
      throw new Error('OpenAI API response has empty or invalid choices array');
    }

    const firstChoice = completion.choices[0];
    if (!firstChoice) {
      console.error('[ERROR] First choice is null/undefined:', { choices: completion.choices });
      throw new Error('OpenAI API first choice is null or undefined');
    }

    if (!firstChoice.message) {
      console.error('[ERROR] First choice message is missing:', { firstChoice });
      throw new Error('OpenAI API response missing message in first choice');
    }

    const content = firstChoice.message.content;
    console.log('[DEBUG] Content extraction result:', {
      contentExists: !!content,
      contentType: typeof content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) || 'null/undefined'
    });

    if (!content) {
      // Handle finish_reason='length' as warning, not error
      if (firstChoice.finish_reason === 'length') {
        console.warn('[WARN] OpenAI response truncated due to token limit:', {
          finishReason: firstChoice.finish_reason,
          usage: completion.usage
        });
        return NextResponse.json(
          { 
            error: 'AIの応答がトークン制限により切り詰められました。より短いワークアウトを生成してください。',
            type: 'token_limit_warning',
            details: `Response truncated. Usage: ${JSON.stringify(completion.usage)}`
          },
          { status: 202 }
        );
      }
      
      console.error('[ERROR] OpenAI message content is empty/null:', {
        message: firstChoice.message,
        content: content,
        finishReason: firstChoice.finish_reason,
        usage: completion.usage
      });
      throw new Error(`OpenAI API returned empty content. Finish reason: ${firstChoice.finish_reason || 'unknown'}, Usage: ${JSON.stringify(completion.usage)}`);
    }

    if (typeof content !== 'string') {
      console.error('[ERROR] OpenAI message content is not a string:', {
        contentType: typeof content,
        content: content
      });
      throw new Error(`OpenAI API content is not a string: ${typeof content}`);
    }

    if (content.trim().length === 0) {
      console.error('[ERROR] OpenAI message content is empty after trimming:', {
        originalLength: content.length,
        trimmedLength: content.trim().length
      });
      throw new Error('OpenAI API returned only whitespace content');
    }

    // Enhanced JSON parsing with detailed error handling
    let aiResponse: AIWorkoutResponse;
    console.log('[DEBUG] Attempting to parse JSON content...');
    try {
      aiResponse = JSON.parse(content);
      console.log('[DEBUG] JSON parsing successful:', {
        hasWorkoutTitle: !!aiResponse.workoutTitle,
        hasExercises: !!aiResponse.exercises,
        exercisesLength: Array.isArray(aiResponse.exercises) ? aiResponse.exercises.length : 'not an array',
        responseKeys: Object.keys(aiResponse)
      });
    } catch (parseError: unknown) {
      console.error('[ERROR] JSON parsing failed:', {
        error: parseError,
        message: (parseError as Error)?.message,
        contentLength: content.length,
        contentStart: content.substring(0, 200),
        contentEnd: content.substring(Math.max(0, content.length - 200)),
        fullContent: content
      });
      
      const errorMessage = (parseError as Error)?.message || 'Unknown JSON parse error';
      throw new Error(`Invalid JSON response from AI: ${errorMessage}. Content preview: ${content.substring(0, 100)}...`);
    }

    // Enhanced AI response structure validation with relaxed requirements
    console.log('[DEBUG] Validating AI response structure...');
    const requiredFields = ['workoutTitle', 'exercises'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in aiResponse)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.error('[ERROR] Missing required fields in AI response:', {
        missingFields,
        availableFields: Object.keys(aiResponse),
        fullResponse: aiResponse
      });
      throw new Error(`Missing required fields in AI response: ${missingFields.join(', ')}. Available fields: ${Object.keys(aiResponse).join(', ')}`);
    }

    // Set defaults for missing optional fields
    if (!aiResponse.estimatedTime) aiResponse.estimatedTime = '30分';
    if (!aiResponse.difficulty) aiResponse.difficulty = '★☆☆';
    if (!aiResponse.cooldown) aiResponse.cooldown = ['ストレッチ'];
    if (!aiResponse.totalCalories) aiResponse.totalCalories = '150kcal';
    if (!aiResponse.equipment) aiResponse.equipment = '自重';

    if (!Array.isArray(aiResponse.exercises)) {
      console.error('[ERROR] Exercises field is not an array:', {
        exercisesType: typeof aiResponse.exercises,
        exercisesValue: aiResponse.exercises
      });
      throw new Error(`Exercises field must be an array, got: ${typeof aiResponse.exercises}`);
    }

    if (aiResponse.exercises.length === 0) {
      console.error('[ERROR] Exercises array is empty:', { 
        exercisesLength: aiResponse.exercises.length,
        fullResponse: aiResponse 
      });
      throw new Error('Exercises array is empty - AI failed to generate any exercises');
    }

    console.log('[DEBUG] AI response validation completed successfully:', {
      exerciseCount: aiResponse.exercises.length,
      workoutTitle: aiResponse.workoutTitle,
      estimatedTime: aiResponse.estimatedTime
    });

    // Generate images for exercises if requested
    if (workoutRequest.generateImages) {
      console.log('[DEBUG] Starting Stable Diffusion image generation for exercises...');
      
      // Generate images in parallel for better performance with individual error handling
      const imagePromises = aiResponse.exercises.map(async (exercise, index) => {
        try {
          const imageUrl = await generateExerciseImage(exercise.name, exercise.targetMuscles);
          if (imageUrl) {
            exercise.imageUrl = imageUrl;
            console.log(`[DEBUG] Image generated for exercise ${index + 1}/${aiResponse.exercises.length}: ${exercise.name}`);
          } else {
            console.warn(`[WARN] No image generated for exercise: ${exercise.name} - continuing without image`);
          }
        } catch (error) {
          console.error(`[ERROR] Failed to generate image for exercise: ${exercise.name}`, error);
          // Continue without image for this exercise - don't let individual failures stop the process
        }
        return exercise; // Always return the exercise, even if image generation failed
      });

      // Wait for all image generation to complete with timeout
      try {
        await Promise.allSettled(imagePromises); // Use allSettled to handle individual failures gracefully
        const imagesGenerated = aiResponse.exercises.filter(ex => ex.imageUrl).length;
        console.log(`[DEBUG] Stable Diffusion image generation completed: ${imagesGenerated}/${aiResponse.exercises.length} images generated successfully`);
      } catch (error) {
        console.error('[ERROR] Unexpected error during image generation batch:', error);
        // Continue with workout generation even if all images fail
      }
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
    console.error('[ERROR] AI workout generation failed:', {
      error,
      message: (error as Error)?.message,
      name: (error as Error)?.name,
      stack: (error as Error)?.stack,
      timestamp: new Date().toISOString()
    });

    // Enhanced error handling with more specific information
    const errorObj = error as {
      status?: number;
      message?: string;
      code?: string;
      type?: string;
      error?: {
        message?: string;
        type?: string;
        code?: string;
      };
      [key: string]: unknown;
    };

    // OpenAI API specific errors
    if (errorObj?.status === 429 || errorObj?.error?.type === 'rate_limit_exceeded') {
      console.error('[ERROR] OpenAI rate limit exceeded:', errorObj);
      return NextResponse.json(
        { 
          error: 'OpenAI APIのレート制限に達しました。しばらくお待ちください。',
          type: 'openai_rate_limit',
          retryAfter: 60,
          details: errorObj?.error?.message || errorObj?.message || 'Rate limit exceeded'
        },
        { status: 429 }
      );
    }

    if (errorObj?.status === 401 || errorObj?.error?.type === 'invalid_api_key') {
      console.error('[ERROR] OpenAI API key invalid:', errorObj);
      return NextResponse.json(
        { 
          error: 'OpenAI APIキーが無効です。設定を確認してください。',
          type: 'invalid_api_key',
          details: errorObj?.error?.message || errorObj?.message || 'Invalid API key'
        },
        { status: 503 }
      );
    }

    if (errorObj?.status && errorObj.status >= 500) {
      console.error('[ERROR] OpenAI server error:', errorObj);
      return NextResponse.json(
        { 
          error: 'OpenAI サービスで一時的な問題が発生しています。',
          type: 'openai_server_error',
          details: errorObj?.error?.message || errorObj?.message || 'Server error',
          status: errorObj.status
        },
        { status: 503 }
      );
    }

    // Network errors
    if (errorObj?.code === 'ENOTFOUND' || errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ECONNRESET') {
      console.error('[ERROR] Network connectivity issue:', errorObj);
      return NextResponse.json(
        { 
          error: 'ネットワーク接続に問題があります。インターネット接続を確認してください。',
          type: 'network_error',
          details: `Network error: ${errorObj.code}`,
          code: errorObj.code
        },
        { status: 503 }
      );
    }

    // Timeout errors
    if (errorObj?.code === 'ECONNABORTED' || (errorObj?.message && errorObj.message.includes('timeout'))) {
      console.error('[ERROR] Request timeout:', errorObj);
      return NextResponse.json(
        { 
          error: 'OpenAI APIの応答がタイムアウトしました。再試行してください。',
          type: 'timeout_error',
          details: errorObj?.message || 'Request timeout'
        },
        { status: 504 }
      );
    }

    // JSON parsing or response validation errors (our custom errors)
    if (errorObj?.message && typeof errorObj.message === 'string') {
      if (errorObj.message.includes('Invalid JSON response')) {
        console.error('[ERROR] JSON parsing error detected:', errorObj);
        return NextResponse.json(
          { 
            error: 'AIからの応答形式が不正です。再試行してください。',
            type: 'json_parse_error',
            details: errorObj.message
          },
          { status: 502 }
        );
      }

      if (errorObj.message.includes('Missing required field') || errorObj.message.includes('Exercises array')) {
        console.error('[ERROR] Response validation error detected:', errorObj);
        return NextResponse.json(
          { 
            error: 'AIの応答に必要な情報が不足しています。再試行してください。',
            type: 'response_validation_error',
            details: errorObj.message
          },
          { status: 502 }
        );
      }

      if (errorObj.message.includes('empty content') || errorObj.message.includes('whitespace content')) {
        console.error('[ERROR] Empty content error detected:', errorObj);
        return NextResponse.json(
          { 
            error: 'AIから応答が得られませんでした。再試行してください。',
            type: 'empty_response_error',
            details: errorObj.message
          },
          { status: 502 }
        );
      }
    }

    // Generic fallback error
    console.error('[ERROR] Unhandled error type:', errorObj);
    return NextResponse.json(
      { 
        error: '予期しないエラーが発生しました。再試行してください。',
        type: 'unknown_error',
        details: errorObj?.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
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
      rateLimit: `${RATE_LIMIT} requests per hour`,
      imageGeneration: 'Stable Diffusion 3.5 Medium',
      textGeneration: 'OpenAI GPT-4'
    }
  );
}
