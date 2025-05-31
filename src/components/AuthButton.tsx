'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

export function AuthButton() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        <span className="text-sm text-gray-600">読み込み中...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            {user.name || 'ユーザー'}
          </span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          ダッシュボード
        </button>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        ログイン
      </button>
      <button
        onClick={() => router.push('/register')}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
      >
        新規登録
      </button>
    </div>
  )
}