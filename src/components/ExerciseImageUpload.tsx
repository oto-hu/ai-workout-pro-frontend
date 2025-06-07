import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ExerciseImageUploadProps {
  exerciseName: string;
  onUploadComplete: (url: string) => void;
  onError: (error: string) => void;
}

export function ExerciseImageUpload({
  exerciseName,
  onUploadComplete,
  onError,
}: ExerciseImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { getIdToken } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズのチェック（1MB以下）
    if (file.size > 1024 * 1024) {
      onError('画像サイズは1MB以下にしてください');
      return;
    }

    setIsUploading(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('認証が必要です');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('exerciseName', exerciseName);

      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const data = await response.json();
      onUploadComplete(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="relative cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-600">
            {isUploading ? 'アップロード中...' : '画像を選択'}
          </span>
        </div>
      </label>
    </div>
  );
} 