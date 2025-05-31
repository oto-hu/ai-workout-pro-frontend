'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FavoriteWorkout } from '@/types/auth'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user?.id) {
      loadFavorites()
    }
  }, [user, authLoading, router])

  const loadFavorites = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('favorite_workouts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading favorites:', error)
      } else {
        setFavorites(data || [])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('favorite_workouts')
        .delete()
        .eq('id', favoriteId)

      if (!error) {
        setFavorites(favorites.filter(f => f.id !== favoriteId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const startWorkout = (workoutData: any) => {
    // Store the workout data and redirect to workout result page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('generatedWorkout', JSON.stringify(workoutData))
      router.push('/workout/result')
    }
  }

  const filteredFavorites = favorites.filter(favorite =>
    favorite.title.toLowerCase().includes(filter.toLowerCase()) ||
    JSON.stringify(favorite.workout_data).toLowerCase().includes(filter.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">お気に入りを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">お気に入りワークアウト</h1>
            <p className="text-gray-600">保存したワークアウトメニューを管理しましょう</p>
          </div>
          <button
            onClick={() => router.push('/workout')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            新しいワークアウト
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="ワークアウトを検索..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter ? '検索結果が見つかりません' : 'まだお気に入りがありません'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter 
                ? '検索条件を変更してお試しください'
                : 'ワークアウトを生成して、お気に入りに保存してみましょう！'
              }
            </p>
            <button
              onClick={() => router.push('/workout')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ワークアウトを生成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {favorite.title}
                    </h3>
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="お気に入りから削除"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    保存日: {format(parseISO(favorite.created_at), 'yyyy年MM月dd日', { locale: ja })}
                  </p>

                  {/* Workout Preview */}
                  {favorite.workout_data?.exercises && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">エクササイズ:</h4>
                      <div className="space-y-1">
                        {favorite.workout_data.exercises.slice(0, 3).map((exercise: any, index: number) => (
                          <div key={index} className="text-sm text-gray-600">
                            • {exercise.name}
                          </div>
                        ))}
                        {favorite.workout_data.exercises.length > 3 && (
                          <div className="text-sm text-gray-500">
                            他 {favorite.workout_data.exercises.length - 3} 種目
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {favorite.workout_data?.duration && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {favorite.workout_data.duration}分
                      </span>
                    )}
                    {favorite.workout_data?.difficulty && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        favorite.workout_data.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        favorite.workout_data.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {favorite.workout_data.difficulty === 'easy' ? '簡単' :
                         favorite.workout_data.difficulty === 'medium' ? '普通' : '難しい'}
                      </span>
                    )}
                    {favorite.workout_data?.target_muscles && (
                      favorite.workout_data.target_muscles.slice(0, 2).map((muscle: string) => (
                        <span key={muscle} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {muscle}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => startWorkout(favorite.workout_data)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      開始する
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement workout sharing
                        navigator.clipboard.writeText(JSON.stringify(favorite.workout_data, null, 2))
                        alert('ワークアウトデータをクリップボードにコピーしました')
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      title="共有"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {favorites.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{favorites.length}</div>
                <div className="text-sm text-gray-600">お気に入り数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(favorites.reduce((sum, f) => sum + (f.workout_data?.duration || 0), 0) / favorites.length || 0)}分
                </div>
                <div className="text-sm text-gray-600">平均時間</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {format(parseISO(favorites[0]?.created_at || new Date().toISOString()), 'MM/dd', { locale: ja })}
                </div>
                <div className="text-sm text-gray-600">最新保存日</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}