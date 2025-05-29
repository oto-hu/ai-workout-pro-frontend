'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { WorkoutSession, FavoriteWorkout, UserProfile } from '@/types/auth'
import { format, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [favorites, setFavorites] = useState<FavoriteWorkout[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.id) {
      loadDashboardData()
    }
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      const supabase = createClient()
      const userId = session?.user?.id

      // Load all data in parallel
      const [sessionsResult, favoritesResult, profileResult] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('favorite_workouts')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
      ])

      setSessions(sessionsResult.data || [])
      setFavorites(favoritesResult.data || [])
      setProfile(profileResult.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  
  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.created_at)
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  const completedSessions = sessions.filter(s => s.completed_at)
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const averageRating = sessions.filter(s => s.rating).length > 0
    ? sessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.filter(s => s.rating).length
    : 0

  // Chart data for weekly activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i)
    const dayName = format(date, 'EEE', { locale: ja })
    const sessionsCount = sessions.filter(s => {
      const sessionDate = parseISO(s.created_at)
      return format(sessionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    }).length
    return { day: dayName, count: sessionsCount }
  })

  const weeklyChartData = {
    labels: last7Days.map(d => d.day),
    datasets: [
      {
        label: 'ワークアウト回数',
        data: last7Days.map(d => d.count),
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  }

  // Progress chart data
  const monthlyData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = subDays(now, (3 - i) * 7)
    const weekEnd = subDays(now, (3 - i - 1) * 7)
    const weekSessions = sessions.filter(s => {
      const sessionDate = parseISO(s.created_at)
      return sessionDate >= weekStart && sessionDate < weekEnd
    })
    return {
      week: `${i + 1}週目`,
      sessions: weekSessions.length,
      duration: weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    }
  })

  const progressChartData = {
    labels: monthlyData.map(d => d.week),
    datasets: [
      {
        label: 'セッション数',
        data: monthlyData.map(d => d.sessions),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        yAxisID: 'y',
      },
      {
        label: '総時間 (分)',
        data: monthlyData.map(d => d.duration),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y1',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            おかえりなさい、{session?.user?.name || 'ユーザー'}さん！
          </h1>
          <p className="text-gray-600">今日も頑張りましょう</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今週のワークアウト</p>
                <p className="text-2xl font-bold text-purple-600">{thisWeekSessions.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総セッション数</p>
                <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総運動時間</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(totalDuration)}分</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均評価</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">週間アクティビティ</h2>
            <Bar data={weeklyChartData} options={{ responsive: true }} />
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">進捗トレンド</h2>
            <Line data={progressChartData} options={chartOptions} />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sessions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">最近のワークアウト</h2>
              <button
                onClick={() => router.push('/history')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                すべて見る →
              </button>
            </div>
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.title}</h3>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(session.created_at), 'MM月dd日 HH:mm', { locale: ja })}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">{session.duration}分</span>
                      {session.rating && (
                        <div className="flex ml-2">
                          {[...Array(session.rating)].map((_, i) => (
                            <span key={i} className="text-yellow-400 text-sm">★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {session.completed_at && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      完了
                    </span>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">まだワークアウトがありません</p>
                  <button
                    onClick={() => router.push('/workout')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    最初のワークアウトを開始
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/workout')}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left"
                >
                  🏋️ 新しいワークアウト
                </button>
                <button
                  onClick={() => router.push('/favorites')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  ❤️ お気に入り ({favorites.length})
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  ⚙️ プロフィール設定
                </button>
              </div>
            </div>

            {/* Profile Summary */}
            {profile && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">プロフィール</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">レベル:</span>
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {profile.fitness_level === 'beginner' ? '初心者' :
                       profile.fitness_level === 'intermediate' ? '中級者' : '上級者'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">利用時間:</span>
                    <span className="ml-2 font-medium">{profile.available_time}分</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">目標数:</span>
                    <span className="ml-2 font-medium">{profile.goals.length}個</span>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">達成バッジ</h2>
              <div className="grid grid-cols-2 gap-3">
                {sessions.length >= 1 && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl mb-1">🎉</div>
                    <div className="text-xs text-gray-600">ファーストワークアウト</div>
                  </div>
                )}
                {sessions.length >= 10 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-1">💪</div>
                    <div className="text-xs text-gray-600">継続マスター</div>
                  </div>
                )}
                {thisWeekSessions.length >= 3 && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-xs text-gray-600">週間チャンピオン</div>
                  </div>
                )}
                {averageRating >= 4 && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-xs text-gray-600">高評価マスター</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}