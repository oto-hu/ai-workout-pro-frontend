import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CreditInfo() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    const creditRef = doc(db, 'users', session.user.id, 'credits', 'info');
    const unsubscribe = onSnapshot(creditRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCredits(data.remainingCredits);
        setDailyCount(data.dailyGenerationCount);
      }
    });

    return () => unsubscribe();
  }, [session]);

  if (!session) {
    return (
      <div className="text-sm text-gray-600">
        未登録ユーザーは1日1回まで生成可能です
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      <p>残りクレジット: {credits ?? 20}</p>
      <p>本日の生成回数: {dailyCount}/5</p>
    </div>
  );
} 