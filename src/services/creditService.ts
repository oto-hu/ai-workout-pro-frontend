import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface CreditInfo {
  remainingCredits: number;
  lastGenerationDate: Timestamp;
  dailyGenerationCount: number;
}

export class CreditService {
  private static readonly INITIAL_CREDITS = 20;
  private static readonly DAILY_LIMIT = 5;
  private static readonly ANONYMOUS_DAILY_LIMIT = 1;

  static async initializeUserCredits(userId: string): Promise<void> {
    const creditRef = doc(db, 'users', userId, 'credits', 'info');
    await setDoc(creditRef, {
      remainingCredits: this.INITIAL_CREDITS,
      lastGenerationDate: Timestamp.now(),
      dailyGenerationCount: 0
    });
  }

  static async canGenerateImage(userId: string | null): Promise<boolean> {
    if (!userId) {
      // 未登録ユーザーの場合、今日の生成回数をチェック
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const generationsRef = collection(db, 'generations');
      const q = query(
        generationsRef,
        where('userId', '==', 'anonymous'),
        where('createdAt', '>=', Timestamp.fromDate(today))
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size < this.ANONYMOUS_DAILY_LIMIT;
    }

    // 登録ユーザーの場合
    const creditRef = doc(db, 'users', userId, 'credits', 'info');
    const creditDoc = await getDoc(creditRef);
    
    if (!creditDoc.exists()) {
      await this.initializeUserCredits(userId);
      return true;
    }

    const creditInfo = creditDoc.data() as CreditInfo;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 日付が変わっている場合はカウントをリセット
    if (creditInfo.lastGenerationDate.toDate() < today) {
      await updateDoc(creditRef, {
        dailyGenerationCount: 0,
        lastGenerationDate: Timestamp.now()
      });
      return creditInfo.remainingCredits > 0;
    }

    return creditInfo.remainingCredits > 0 && creditInfo.dailyGenerationCount < this.DAILY_LIMIT;
  }

  static async useCredit(userId: string | null): Promise<void> {
    if (!userId) {
      // 未登録ユーザーの場合、生成履歴のみ記録
      const generationRef = doc(collection(db, 'generations'));
      await setDoc(generationRef, {
        userId: 'anonymous',
        createdAt: Timestamp.now()
      });
      return;
    }

    // 登録ユーザーの場合
    const creditRef = doc(db, 'users', userId, 'credits', 'info');
    const creditDoc = await getDoc(creditRef);
    
    if (!creditDoc.exists()) {
      await this.initializeUserCredits(userId);
    }

    const creditInfo = creditDoc.data() as CreditInfo;
    
    await updateDoc(creditRef, {
      remainingCredits: creditInfo.remainingCredits - 1,
      dailyGenerationCount: creditInfo.dailyGenerationCount + 1,
      lastGenerationDate: Timestamp.now()
    });

    // 生成履歴を記録
    const generationRef = doc(collection(db, 'generations'));
    await setDoc(generationRef, {
      userId,
      createdAt: Timestamp.now()
    });
  }

  // 有料プラン用のメソッド（コメントアウト）
  /*
  static async isPremiumUser(userId: string): Promise<boolean> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.plan === 'premium';
  }
  */
} 