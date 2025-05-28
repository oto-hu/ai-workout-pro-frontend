'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BodyPart {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

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

  const toggleBodyPart = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleGenerateWorkout = () => {
    if (selectedParts.length === 0) {
      alert('少なくとも1つの部位を選択してください。');
      return;
    }
    console.log('Selected body parts:', selectedParts);
    alert(`選択された部位: ${selectedParts.map(id => bodyParts.find(bp => bp.id === id)?.name).join(', ')}\n\nAI生成機能は次のフェーズで実装予定です。`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
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

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <button
              onClick={handleGenerateWorkout}
              disabled={selectedParts.length === 0}
              className={`
                px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl
                ${selectedParts.length > 0
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="選択した部位でメニューを生成する"
            >
              メニュー生成 ({selectedParts.length}部位)
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

      <Footer />
    </div>
  );
}