'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { FirestoreService } from '@/lib/firestore'
import { WorkoutSession } from '@/types/auth'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'rated'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'rating'>('date')

  // Helper function to convert Firestore session to component format
  const convertFirestoreSessionToComponent = (firestoreSession: import('@/lib/firestore').WorkoutSession): WorkoutSession => {
    const createdAt = firestoreSession.createdAt;
    const completedAt = firestoreSession.completedAt;
    
    const createdAtString = createdAt instanceof Date 
      ? createdAt.toISOString()
      : createdAt && typeof createdAt === 'object' && 'toDate' in createdAt
      ? createdAt.toDate().toISOString()
      : new Date().toISOString();
      
    const completedAtString = completedAt instanceof Date 
      ? completedAt.toISOString()
      : completedAt && typeof completedAt === 'object' && 'toDate' in completedAt
      ? completedAt.toDate().toISOString()
      : completedAt;

    return {
      id: firestoreSession.id || '',
      user_id: firestoreSession.userId,
      title: firestoreSession.title,
      target_muscles: firestoreSession.targetMuscles,
      duration: firestoreSession.duration,
      exercises: firestoreSession.exercises,
      difficulty: firestoreSession.difficulty,
      calories_burned: firestoreSession.caloriesBurned,
      completed_at: completedAtString,
      rating: firestoreSession.rating,
      notes: firestoreSession.notes,
      created_at: createdAtString
    };
  }

  const loadHistory = useCallback(async () => {
    try {
      const userId = user?.id
      if (!userId) return

      const sessionsData = await FirestoreService.getUserWorkoutSessions(userId)
      const convertedSessions = sessionsData.map(convertFirestoreSessionToComponent)
      setSessions(convertedSessions)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user?.id) {
      loadHistory()
    }
  }, [user, authLoading, router, loadHistory])

  const updateRating = async (sessionId: string, rating: number) => {
    try {
      await FirestoreService.updateWorkoutSession(sessionId, { rating })
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, rating } : s
      ))
    } catch (error) {
      console.error('Error updating rating:', error)
    }
  }

  const updateNotes = async (sessionId: string, notes: string) => {
    try {
      await FirestoreService.updateWorkoutSession(sessionId, { notes })
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, notes } : s
      ))
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'completed') return session.completed_at
    if (filter === 'rated') return session.rating
    return true
  })

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'duration':
        return (b.duration || 0) - (a.duration || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.completed_at).length
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const averageRating = sessions.filter(s => s.rating).length > 0
    ? sessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.filter(s => s.rating).length
    : 0

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">履歴を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ワークアウト履歴</h1>
          <p className="text-gray-600">あなたのフィットネスジャーニーを確認しましょう</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-purple-600">{totalSessions}</div>
            <div className="text-sm text-gray-600">総セッション数</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
            <div className="text-sm text-gray-600">完了セッション</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">{Math.round(totalDuration)}分</div>
            <div className="text-sm text-gray-600">総運動時間</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-600">平均評価</div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">フィルター</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'rated')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">すべて</option>
                <option value="completed">完了のみ</option>
                <option value="rated">評価済みのみ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">並び順</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'rating')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="date">日付順</option>
                <option value="duration">時間順</option>
                <option value="rating">評価順</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {sortedSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">まだ履歴がありません</h3>
            <p className="text-gray-600 mb-4">最初のワークアウトを始めてみましょう！</p>
            <button
              onClick={() => router.push('/workout')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ワークアウトを開始
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                    <p className="text-gray-600">
                      {format(parseISO(session.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.completed_at && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        完了
                      </span>
                    )}
                    {session.difficulty && (
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        session.difficulty === 'easy' ? 'bg-blue-100 text-blue-800' :
                        session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.difficulty === 'easy' ? '簡単' :
                         session.difficulty === 'medium' ? '普通' : '難しい'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-600">対象部位:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.target_muscles.map((muscle) => (
                        <span key={muscle} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">時間:</span>
                    <span className="ml-2 font-medium">{session.duration}分</span>
                  </div>
                  {session.calories_burned && (
                    <div className="text-sm">
                      <span className="text-gray-600">消費カロリー:</span>
                      <span className="ml-2 font-medium">{session.calories_burned}kcal</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600 block mb-2">評価:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => updateRating(session.id, star)}
                        className={`w-6 h-6 ${
                          (session.rating || 0) >= star
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">メモ:</label>
                  <textarea
                    value={session.notes || ''}
                    onChange={(e) => updateNotes(session.id, e.target.value)}
                    placeholder="このワークアウトについての感想やメモを入力..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}