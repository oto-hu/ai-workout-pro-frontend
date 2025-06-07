'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { AuthService } from '@/lib/auth';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Tre-<span className="text-blue-600">アイトレ-</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              aria-label="ホーム"
            >
              ホーム
            </Link>
            <Link 
              href="/workout" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              aria-label="トレーニング"
            >
              トレーニング
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="ダッシュボード"
                >
                  ダッシュボード
                </Link>
                <Link 
                  href="/history" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="履歴"
                >
                  履歴
                </Link>
                <Link 
                  href="/favorites" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="お気に入り"
                >
                  お気に入り
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="プロフィール"
                >
                  プロフィール
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                  aria-label="ログアウト"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/settings" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="設定"
                >
                  設定
                </Link>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="ログイン"
                >
                  ログイン
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  aria-label="新規登録"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="ホーム"
              >
                ホーム
              </Link>
              <Link 
                href="/workout" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="トレーニング"
              >
                トレーニング
              </Link>
              
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="ダッシュボード"
                  >
                    ダッシュボード
                  </Link>
                  <Link 
                    href="/history" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="履歴"
                  >
                    履歴
                  </Link>
                  <Link 
                    href="/favorites" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="お気に入り"
                  >
                    お気に入り
                  </Link>
                  <Link 
                    href="/profile" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="プロフィール"
                  >
                    プロフィール
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-red-600 font-medium transition-colors"
                    aria-label="ログアウト"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/settings" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="設定"
                  >
                    設定
                  </Link>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="ログイン"
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 text-center"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="新規登録"
                  >
                    新規登録
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
