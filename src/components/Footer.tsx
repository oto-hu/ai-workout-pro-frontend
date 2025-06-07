import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold">
                Tre-<span className="text-blue-400">アイトレ-</span>
              </span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              AIがパーソナライズされたトレーニングメニューを画像で生成し、自宅で本格的なパーソナルジム体験を提供するサービスです。
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.247 7.053 7.757 8.35 7.757s2.448.49 3.323 1.297c.898.898 1.388 2.049 1.388 3.346s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z" />
                </svg>
              </a>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/workout-generator" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  AIワークアウト生成
                </Link>
              </li>
              <li>
                <Link 
                  href="/personal-training" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  パーソナルトレーニング
                </Link>
              </li>
              <li>
                <Link 
                  href="/nutrition" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  栄養管理
                </Link>
              </li>
              <li>
                <Link 
                  href="/progress-tracking" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  進捗追跡
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">サポート</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/help" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  ヘルプセンター
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 AI Tre-アイトレ-. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
            >
              プライバシー
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
            >
              利用規約
            </Link>
            <Link 
              href="/cookies" 
              className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
            >
              Cookie設定
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}