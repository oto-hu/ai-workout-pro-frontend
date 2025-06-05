'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BodyPart, WorkoutGeneration } from '@/types/workout';
import { workoutGenerator } from '@/lib/workout-generator';
import { storageUtils } from '@/lib/storage-utils';

const bodyParts: BodyPart[] = [
  {
    id: 'chest',
    name: '胸',
    emoji: '💪',
    description: 'Chest - 大胸筋を鍛える'
  },
  {
    id: 'back',
    name: '背中',
    emoji: '🏋️',
    description: 'Back - 広背筋・僧帽筋を強化'
  },
  {
    id: 'shoulders',
    name: '肩',
    emoji: '💪',
    description: 'Shoulders - 三角筋を発達させる'
  },
  {
    id: 'arms',
    name: '腕',
    emoji: '💪',
    description: 'Arms - 上腕二頭筋・三頭筋'
  },
  {
    id: 'abs',
    name: '腹',
    emoji: '🔥',
    description: 'Abs - 腹筋・コアを強化'
  },
  {
    id: 'legs',
    name: '脚',
    emoji: '🦵',
    description: 'Legs - 大腿筋・ふくらはぎ'
  },
  {
    id: 'fullbody',
    name: '全身',
    emoji: '🏃',
    description: 'Full Body - 全身を効率的に'
  }
];

export default function WorkoutPage() {
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [generateImages, setGenerateImages] = useState<boolean>(true);
  const [generation, setGeneration] = useState<WorkoutGeneration>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [hasUserSettings, setHasUserSettings] = useState(false);
  const router = useRouter();

  // Check if user has settings configured
  useEffect(() => {
    const result = storageUtils.loadUserPreferences();
    setHasUserSettings(result.success && result.data);
  }, []);

  const toggleBodyPart = (partId: string) => {
    if (generation.status === 'loading') return; // Prevent selection during generation
    
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleGenerateWorkout = async () => {
    if (selectedParts.length === 0) {
      alert('少なくとも1つの部位を選択してください。');
      return;
    }

    try {
      setGeneration({
        status: 'loading',
        progress: 0,
        message: 'AIが最適なメニューを分析中...'
      });

      const menu = await workoutGenerator.generateWorkoutWithStreaming(
        selectedParts, 
        (progress, message) => {
          setGeneration(prev => ({
            ...prev,
            progress,
            message
          }));
        },
        { generateImages }
      );

      setGeneration({
        status: 'success',
        progress: 100,
        message: 'メニュー生成完了！',
        menu
      });

      // Store the generated menu safely for the result page
      const saveResult = storageUtils.saveWorkout(menu);
      if (!saveResult.success) {
        console.warn('Failed to save workout:', saveResult.error);
        // Still proceed to result page - it will handle the missing data
      }
      
      // Navigate to result page after a short delay
      setTimeout(() => {
        router.push('/workout/result');
      }, 1000);

    } catch (error) {
      console.error('Workout generation failed:', error);
      
      // Enhanced error handling for AIGenerationError and other error types
      let errorMessage = 'メニュー生成に失敗しました。もう一度お試しください。';
      let errorDetails = '不明なエラー';
      
      // Handle AIGenerationError specifically
      const aiError = error as { name?: string; type?: string; message?: string; retryAfter?: number };
      
      if (aiError?.name === 'AIGenerationError') {
        errorMessage = aiError.message || errorMessage;
        errorDetails = `エラータイプ: ${aiError.type || 'unknown'}`;
        
        // Provide specific error messages based on error type
        switch (aiError.type) {
          case 'rate_limit':
            errorMessage = 'APIの利用制限に達しました。しばらくお待ちください。';
            if (aiError.retryAfter) {
              errorDetails = `${Math.ceil(aiError.retryAfter / 1000)}秒後に再試行してください`;
            }
            break;
          case 'network_error':
            errorMessage = 'ネットワーク接続に問題があります。接続を確認してください。';
            break;
          case 'timeout_error':
            errorMessage = 'タイムアウトが発生しました。もう一度お試しください。';
            break;
          case 'configuration_error':
            errorMessage = 'AIサービスの設定に問題があります。管理者にお問い合わせください。';
            break;
          case 'validation_error':
            errorMessage = 'AI レスポンスの形式に問題があります。再試行してください。';
            break;
          case 'api_error':
            errorMessage = 'AIサービスで一時的な問題が発生しています。後でお試しください。';
            break;
          case 'client_error':
            errorMessage = 'リクエストに問題があります。設定を確認してください。';
            break;
        }
      } else if (error instanceof Error) {
        errorDetails = error.message;
        
        // Fallback for standard Error objects
        if (error.message.includes('rate limit')) {
          errorMessage = 'APIの利用制限に達しました。しばらくお待ちください。';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'ネットワーク接続に問題があります。接続を確認してください。';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'タイムアウトが発生しました。もう一度お試しください。';
        } else if (error.message.includes('API')) {
          errorMessage = 'AIサービスで問題が発生しています。後でお試しください。';
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle other object-based errors
        const errorObj = error as any;
        if (errorObj.type) {
          errorDetails = `Type: ${errorObj.type}, Message: ${errorObj.message || 'Unknown'}`;
          errorMessage = errorObj.message || errorMessage;
        } else {
          errorDetails = JSON.stringify(error);
        }
      } else {
        errorDetails = String(error);
      }

      setGeneration({
        status: 'error',
        progress: 0,
        message: errorMessage,
        error: errorDetails
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              トレーニング部位を
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                選択してください
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              鍛えたい部位を選んで、AIがあなた専用のトレーニングメニューを生成します。
              複数の部位を同時に選択することができます。
            </p>
          </div>

          {/* User Settings Notification */}
          {!hasUserSettings && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    さらにパーソナライズしませんか？
                  </h3>
                  <p className="text-blue-800 mb-4">
                    ユーザー設定でフィットネスレベル、利用可能時間、使用器具を設定すると、より効果的なメニューを生成できます。
                  </p>
                  <Link
                    href="/settings"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    設定ページに移動 →
                  </Link>
                </div>
                <button
                  onClick={() => setHasUserSettings(true)}
                  className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                  aria-label="通知を閉じる"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Body Parts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {bodyParts.map((part) => (
              <div
                key={part.id}
                onClick={() => toggleBodyPart(part.id)}
                className={`
                  relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                  ${selectedParts.includes(part.id)
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                  }
                `}
                role="button"
                tabIndex={0}
                aria-pressed={selectedParts.includes(part.id)}
                aria-label={`${part.name}を${selectedParts.includes(part.id) ? '選択解除' : '選択'}する`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleBodyPart(part.id);
                  }
                }}
              >
                {/* Selection Indicator */}
                {selectedParts.includes(part.id) && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="text-center">
                  <div className="text-4xl mb-4">{part.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {part.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {part.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Parts Display */}
          {selectedParts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                選択された部位 ({selectedParts.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedParts.map((partId) => {
                  const part = bodyParts.find(bp => bp.id === partId);
                  return (
                    <span
                      key={partId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {part?.emoji} {part?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Generation Progress */}
          {generation.status === 'loading' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI生成中
                  </h3>
                  <p className="text-gray-600">
                    {generation.message}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generation.progress}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-500">
                  {generation.progress}% 完了
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {generation.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">
                  {generation.message}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  結果ページに移動しています...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {generation.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  エラーが発生しました
                </h3>
                <p className="text-red-800 font-medium mb-3">
                  {generation.message}
                </p>
                {generation.error && (
                  <details className="text-left bg-red-100 rounded-lg p-3 mt-3">
                    <summary className="text-red-700 font-medium cursor-pointer hover:text-red-800">
                      詳細情報を表示
                    </summary>
                    <pre className="text-red-600 text-sm mt-2 whitespace-pre-wrap overflow-x-auto">
                      {generation.error}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => setGeneration({ status: 'idle', progress: 0, message: '' })}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  もう一度試す
                </button>
              </div>
            </div>
          )}

          {/* Image Generation Options */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              画像生成オプション
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-base font-medium text-gray-900">
                      エクササイズ画像を生成
                    </h4>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="generateImages"
                        checked={generateImages}
                        onChange={(e) => setGenerateImages(e.target.checked)}
                        disabled={generation.status === 'loading'}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="generateImages" className="ml-2 text-sm text-gray-700">
                        有効
                      </label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    AIがエクササイズの正しいフォームを示すイラストを生成します。画像生成は追加時間がかかります。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <button
              onClick={handleGenerateWorkout}
              disabled={selectedParts.length === 0 || generation.status === 'loading'}
              className={`
                px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl
                ${selectedParts.length > 0 && generation.status !== 'loading'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="選択した部位でメニューを生成する"
            >
              {generation.status === 'loading' ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  生成中...
                </span>
              ) : (
                `メニュー生成 (${selectedParts.length}部位)`
              )}
            </button>
            
            <div className="flex justify-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                aria-label="ホームに戻る"
              >
                ← ホームに戻る
              </Link>
              {selectedParts.length > 0 && (
                <button
                  onClick={() => setSelectedParts([])}
                  className="text-gray-600 hover:text-red-600 font-medium transition-colors"
                  aria-label="選択をクリアする"
                >
                  選択をクリア
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}