'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UserProfile } from '@/types/auth'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.id) {
      loadProfile()
    }
  }, [session, status, router])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setError('プロフィールの読み込みに失敗しました')
      } else {
        setProfile(data)
      }
    } catch (error) {
      setError('プロフィールの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          fitness_level: profile.fitness_level,
          goals: profile.goals,
          available_equipment: profile.available_equipment,
          available_time: profile.available_time,
          limitations: profile.limitations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user?.id)

      if (error) {
        setError('プロフィールの保存に失敗しました')
      } else {
        setSuccess('プロフィールを保存しました')
      }
    } catch (error) {
      setError('プロフィールの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (field: keyof UserProfile, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const toggleGoal = (goal: string) => {
    if (!profile) return
    const goals = profile.goals.includes(goal)
      ? profile.goals.filter(g => g !== goal)
      : [...profile.goals, goal]
    updateProfile('goals', goals)
  }

  const toggleEquipment = (equipment: string) => {
    if (!profile) return
    const available_equipment = profile.available_equipment.includes(equipment)
      ? profile.available_equipment.filter(e => e !== equipment)
      : [...profile.available_equipment, equipment]
    updateProfile('available_equipment', available_equipment)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">プロフィールが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
            <p className="text-gray-600 mt-1">あなたに最適なワークアウトを提供するための設定</p>
          </div>

          <form onSubmit={saveProfile} className="p-6 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前
                  </label>
                  <input
                    type="text"
                    value={session?.user?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Fitness Level */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">フィットネスレベル</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'beginner', label: '初心者', desc: '運動習慣がない' },
                  { value: 'intermediate', label: '中級者', desc: '定期的に運動している' },
                  { value: 'advanced', label: '上級者', desc: '本格的なトレーニング経験がある' }
                ].map((level) => (
                  <label key={level.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="fitness_level"
                      value={level.value}
                      checked={profile.fitness_level === level.value}
                      onChange={(e) => updateProfile('fitness_level', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-colors ${
                      profile.fitness_level === level.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">目標</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  '筋力向上', '体重減少', '体力向上', '筋肉増量',
                  'ストレス解消', '柔軟性向上', '姿勢改善', '健康維持'
                ].map((goal) => (
                  <label key={goal} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.goals.includes(goal)}
                      onChange={() => toggleGoal(goal)}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      profile.goals.includes(goal)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <span className="text-sm font-medium">{goal}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Available Equipment */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">利用可能な器具</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  '自重', 'ダンベル', 'チューブ', 'ヨガマット',
                  'バランスボール', 'ケトルベル', 'バーベル', 'プルアップバー'
                ].map((equipment) => (
                  <label key={equipment} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.available_equipment.includes(equipment)}
                      onChange={() => toggleEquipment(equipment)}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      profile.available_equipment.includes(equipment)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <span className="text-sm font-medium">{equipment}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Available Time */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">利用可能時間</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { value: 15, label: '15分' },
                  { value: 30, label: '30分' },
                  { value: 45, label: '45分' },
                  { value: 60, label: '60分' }
                ].map((time) => (
                  <label key={time.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="available_time"
                      value={time.value}
                      checked={profile.available_time === time.value}
                      onChange={(e) => updateProfile('available_time', parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      profile.available_time === time.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <span className="font-medium">{time.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Limitations */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">制限事項・注意点</h2>
              <textarea
                value={profile.limitations || ''}
                onChange={(e) => updateProfile('limitations', e.target.value)}
                placeholder="膝の痛み、腰痛、肩の問題など、運動時に注意すべき点があれば記入してください"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : 'プロフィールを保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}