'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPreferences } from '@/types/workout';
import { storageUtils } from '@/lib/storage-utils';

const defaultPreferences: UserPreferences = {
  fitnessLevel: 'beginner',
  preferredDuration: 30,
  availableEquipment: ['bodyweight'],
  goals: ['fitness'],
  injuries: [],
  limitations: []
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load preferences from storage on mount
  useEffect(() => {
    const result = storageUtils.loadUserPreferences();
    if (result.success && result.data) {
      setPreferences({ ...defaultPreferences, ...result.data });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    const result = storageUtils.saveUserPreferences(preferences);
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      console.error('Failed to save preferences:', result.error);
      setSaveStatus('error');
    }
    setIsSaving(false);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = <K extends keyof UserPreferences>(
    key: K,
    item: string
  ) => {
    const currentArray = preferences[key] as string[];
    const updated = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updatePreference(key, updated as UserPreferences[K]);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ユーザー設定
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              あなたの情報を設定して、より効果的なパーソナライズされたワークアウトを生成しましょう。
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Fitness Level */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                フィットネスレベル
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'beginner', label: '初心者', desc: '運動を始めたばかり' },
                  { value: 'intermediate', label: '中級者', desc: '定期的に運動している' },
                  { value: 'advanced', label: '上級者', desc: '高強度トレーニング経験者' }
                ].map(({ value, label, desc }) => (
                  <div
                    key={value}
                    onClick={() => updatePreference('fitnessLevel', value as 'beginner' | 'intermediate' | 'advanced')}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                      ${preferences.fitnessLevel === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Duration */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                利用可能時間
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[15, 30, 45, 60].map(duration => (
                  <button
                    key={duration}
                    onClick={() => updatePreference('preferredDuration', duration)}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md
                      ${preferences.preferredDuration === duration
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    {duration}分
                  </button>
                ))}
              </div>
            </div>

            {/* Available Equipment */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                使用可能器具
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: 'bodyweight', label: '自重のみ', emoji: '🏃' },
                  { value: 'dumbbells', label: 'ダンベル', emoji: '🏋️' },
                  { value: 'resistance_bands', label: 'レジスタンスバンド', emoji: '💪' },
                  { value: 'kettlebell', label: 'ケトルベル', emoji: '⚖️' },
                  { value: 'pull_up_bar', label: '懸垂バー', emoji: '🔗' },
                  { value: 'yoga_mat', label: 'ヨガマット', emoji: '🧘' }
                ].map(({ value, label, emoji }) => (
                  <div
                    key={value}
                    onClick={() => toggleArrayItem('availableEquipment', value)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md text-center
                      ${preferences.availableEquipment.includes(value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="font-medium text-gray-900">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                目標
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'strength', label: '筋力アップ', desc: '筋肉量を増やしたい' },
                  { value: 'endurance', label: '体力向上', desc: '持久力を高めたい' },
                  { value: 'weight_loss', label: '脂肪燃焼', desc: '体重を減らしたい' },
                  { value: 'flexibility', label: '柔軟性', desc: 'ストレッチを重視' },
                  { value: 'fitness', label: '健康維持', desc: '全般的な体力維持' },
                  { value: 'muscle_tone', label: '引き締め', desc: 'ボディラインを整えたい' }
                ].map(({ value, label, desc }) => (
                  <div
                    key={value}
                    onClick={() => toggleArrayItem('goals', value)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                      ${preferences.goals.includes(value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Injuries/Limitations */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                制限事項・既往歴
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'knee_problems', label: '膝の問題' },
                  { value: 'back_pain', label: '腰痛' },
                  { value: 'shoulder_injury', label: '肩の怪我' },
                  { value: 'ankle_problems', label: '足首の問題' },
                  { value: 'wrist_pain', label: '手首の痛み' },
                  { value: 'neck_issues', label: '首の問題' },
                  { value: 'heart_condition', label: '心疾患' },
                  { value: 'high_blood_pressure', label: '高血圧' }
                ].map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => toggleArrayItem('limitations', value)}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm
                      ${preferences.limitations?.includes(value)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-red-200'
                      }
                    `}
                  >
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                選択した制限事項を考慮してワークアウトを調整します。
              </p>
            </div>

            {/* Save Button */}
            <div className="flex flex-col items-center space-y-4 pt-8 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  px-8 py-3 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl
                  ${isSaving
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }
                `}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    保存中...
                  </span>
                ) : (
                  '設定を保存'
                )}
              </button>

              {/* Save Status */}
              {saveStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  設定が保存されました
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  保存に失敗しました
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-center space-x-6 pt-4">
              <Link
                href="/workout"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ワークアウト生成へ →
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}