'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WorkoutMenu } from '@/types/workout';
import { workoutGenerator } from '@/lib/workout-generator';
import { storageUtils } from '@/lib/storage-utils';

export default function WorkoutResultPage() {
  const [workoutMenu, setWorkoutMenu] = useState<WorkoutMenu | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Try to get the workout from storage
    console.log('Loading workout data from storage...');
    const workoutResult = storageUtils.loadWorkout();
    if (workoutResult.success && workoutResult.data) {
      console.log('Workout data loaded successfully:', workoutResult.data.title);
      setWorkoutMenu(workoutResult.data);
    } else {
      console.error('Failed to load workout:', workoutResult.error);
      
      // Avoid infinite redirect loop by setting a flag
      const hasRedirected = sessionStorage.getItem('workout_redirect_attempted');
      if (!hasRedirected) {
        console.log('Setting redirect flag and redirecting to workout page');
        sessionStorage.setItem('workout_redirect_attempted', 'true');
        
        // Clear redirect flag after navigation
        setTimeout(() => {
          sessionStorage.removeItem('workout_redirect_attempted');
        }, 2000);
        
        router.push('/workout');
      } else {
        console.error('Redirect loop detected, staying on result page with error message');
        // Don't redirect again, show error message instead
        setWorkoutMenu(null);
      }
    }

    // Load favorites from storage
    const favoritesResult = storageUtils.loadFavorites();
    if (favoritesResult.success && favoritesResult.data) {
      setFavorites(favoritesResult.data);
    }
  }, [router]);

  const handleRegenerate = async () => {
    if (!workoutMenu) return;
    
    setRegenerating(true);
    
    try {
      const newMenu = await workoutGenerator.regenerateWorkout(
        workoutMenu.targetBodyParts,
        {}, // No specific modifications for now
        (progress, message) => {
          // Progress updates could be shown in a toast or modal
          console.log(`Regeneration: ${progress}% - ${message}`);
        }
      );
      
      setWorkoutMenu(newMenu);
      const saveResult = storageUtils.saveWorkout(newMenu);
      if (!saveResult.success) {
        console.warn('Failed to save regenerated workout:', saveResult.error);
      }
    } catch (_error) {
      console.error('Regeneration failed:', _error);
      // Fallback to original mock generation if needed
    } finally {
      setRegenerating(false);
    }
  };

  const toggleFavorite = () => {
    if (!workoutMenu) return;
    
    const newFavorites = favorites.includes(workoutMenu.id)
      ? favorites.filter(id => id !== workoutMenu.id)
      : [...favorites, workoutMenu.id];
    
    setFavorites(newFavorites);
    const saveResult = storageUtils.saveFavorites(newFavorites);
    if (!saveResult.success) {
      console.warn('Failed to save favorites:', saveResult.error);
    }
    
    // Also store the workout details safely
    if (!favorites.includes(workoutMenu.id)) {
      try {
        const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts') || '{}');
        // Keep base64 data URLs (Stable Diffusion images) but strip external URLs to avoid quota issues
        const workoutToSave = {
          ...workoutMenu,
          exercises: workoutMenu.exercises.map(ex => ({ 
            ...ex, 
            imageUrl: ex.imageUrl?.startsWith('data:') ? ex.imageUrl : undefined 
          }))
        };
        savedWorkouts[workoutMenu.id] = workoutToSave;
        localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
      } catch (error) {
        console.warn('Failed to save workout details:', error);
      }
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  const formatReps = (reps: number | string) => {
    return typeof reps === 'number' ? `${reps}回` : reps;
  };

  if (!workoutMenu) {
    // Check if we're in a redirect loop scenario
    const hasRedirected = typeof window !== 'undefined' && sessionStorage.getItem('workout_redirect_attempted');
    
    if (hasRedirected) {
      return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ワークアウトデータが見つかりません
            </h2>
            <p className="text-gray-600 mb-6">
              申し訳ございませんが、ワークアウトデータの読み込みに失敗しました。
              新しいワークアウトを生成してください。
            </p>
            <div className="space-y-3">
              <Link
                href="/workout"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                新しいワークアウトを生成
              </Link>
              <br />
              <Link
                href="/"
                className="inline-block text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                ← ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">ワークアウトを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI生成完了！
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              あなた専用のトレーニングメニューが完成しました
            </p>
          </div>

          {/* Workout Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {workoutMenu.title}
                </h2>
                <p className="text-gray-600">
                  {workoutMenu.description}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full transition-all ${
                    favorites.includes(workoutMenu.id)
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label={favorites.includes(workoutMenu.id) ? 'お気に入りから削除' : 'お気に入りに追加'}
                >
                  <svg className="w-6 h-6" fill={favorites.includes(workoutMenu.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => navigator.share?.({ title: workoutMenu.title, text: workoutMenu.description, url: window.location.href })}
                  className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  aria-label="シェア"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {workoutMenu.totalDuration}
                </div>
                <div className="text-sm text-blue-800">分</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {workoutMenu.calories}
                </div>
                <div className="text-sm text-purple-800">kcal</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {workoutMenu.exercises.length}
                </div>
                <div className="text-sm text-green-800">種目</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-lg font-bold text-orange-600 mb-1">
                  {getDifficultyStars(workoutMenu.difficulty)}
                </div>
                <div className="text-sm text-orange-800">難易度</div>
              </div>
            </div>

            {/* Target Body Parts */}
            <div className="flex flex-wrap gap-2">
              {workoutMenu.targetBodyParts.map(part => {
                const partNames: Record<string, string> = {
                  chest: '胸', back: '背中', shoulders: '肩', arms: '腕',
                  abs: '腹', legs: '脚', fullbody: '全身'
                };
                return (
                  <span
                    key={part}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {partNames[part] || part}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-6 mb-8">
            {workoutMenu.exercises.map((exercise, index) => (
              <div key={exercise.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Exercise Image */}
                  <div className="lg:w-1/3">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                      {exercise.imageUrl ? (
                        <Image
                          src={exercise.imageUrl}
                          alt={`${exercise.name}のフォーム図解`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            // Show placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector('.exercise-placeholder');
                            if (placeholder) {
                              placeholder.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div className={`exercise-placeholder flex items-center justify-center h-full ${exercise.imageUrl ? 'hidden' : ''}`}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">🏃‍♂️</div>
                          <p className="text-sm text-gray-600">
                            エクササイズ図解
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Details */}
                  <div className="lg:w-2/3">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {index + 1}. {exercise.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {exercise.sets}セット × {formatReps(exercise.reps)}
                        </div>
                        <div className="text-sm text-gray-600">
                          休憩: {exercise.restTime}秒
                        </div>
                        <div className="text-sm text-orange-600">
                          {getDifficultyStars(exercise.difficulty)}
                        </div>
                      </div>
                    </div>

                    {/* Target Muscles */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">対象部位:</h4>
                      <div className="flex flex-wrap gap-1">
                        {exercise.targetMuscles.map(muscle => (
                          <span key={muscle} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">実行方法:</h4>
                      <ol className="text-sm text-gray-600 space-y-1">
                        {exercise.instructions.map((instruction, i) => (
                          <li key={i} className="flex">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                              {i + 1}
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">コツ・注意点:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {exercise.tips.map((tip, i) => (
                          <li key={i} className="flex">
                            <span className="text-yellow-500 mr-2 mt-0.5">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  再生成中...
                </span>
              ) : (
                '🔄 別のメニューを生成'
              )}
            </button>
            
            <Link
              href="/workout"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-center"
            >
              🏃‍♂️ 新しいワークアウト
            </Link>
            
            <button
              onClick={() => window.print()}
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              🖨️ 印刷
            </button>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}