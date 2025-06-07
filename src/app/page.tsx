import Link from 'next/link';
import CreditInfo from '@/components/CreditInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  AIが作る
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                    パーソナル
                  </span>
                  トレーニング
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                  自宅で本格的なパーソナルジム体験を。AIがあなただけの画像トレーニングメニューを生成します。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/workout"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    aria-label="今すぐ始める"
                  >
                    今すぐ始める
                  </Link>
                  <Link
                    href="/demo"
                    className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
                    aria-label="デモを見る"
                  >
                    デモを見る
                  </Link>
                </div>
                <div className="mt-6">
                  <CreditInfo />
                </div>
              </div>

              {/* Right Content - Placeholder for hero image/video */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl p-8 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">AI生成中...</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/30 rounded w-3/4"></div>
                        <div className="h-4 bg-white/30 rounded w-1/2"></div>
                        <div className="h-4 bg-white/30 rounded w-2/3"></div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4 mt-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/30 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl">💪</span>
                          </div>
                          <p className="text-sm">パーソナライズされた<br />トレーニング画像</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-ping"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                なぜAI Tre-アイトレ-なのか？
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                最先端のAI技術であなたの体力レベル、目標、好みに合わせた完全カスタマイズのトレーニングプランを提供します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  パーソナライズ
                </h3>
                <p className="text-gray-600">
                  あなたの体力レベル、目標、好みに合わせてAIが最適なトレーニングメニューを生成します。
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl">🎬</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  画像ガイド
                </h3>
                <p className="text-gray-600">
                  AIが生成する分かりやすい画像解説で、正しいフォームでトレーニングできます。
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  進捗追跡
                </h3>
                <p className="text-gray-600">
                  トレーニング履歴を記録し、目標達成までの道のりを可視化します。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              今すぐ始めて、理想の体を手に入れよう
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              無料でアカウントを作成して、あなた専用のAIトレーナーと一緒にフィットネス目標を達成しましょう。
            </p>
            <Link
              href="/workout"
              className="bg-white text-blue-600 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl inline-block"
              aria-label="無料で始める"
            >
              無料で始める
            </Link>
          </div>
        </section>
      </main>
    </div> 

  );
}
