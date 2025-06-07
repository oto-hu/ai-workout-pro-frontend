import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CreditService } from '@/services/creditService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.email || null;

    // クレジットチェック
    const canGenerate = await CreditService.canGenerateImage(userId);
    if (!canGenerate) {
      return NextResponse.json(
        { error: '生成制限に達しました。登録すると1日5回まで生成できます。' },
        { status: 403 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが必要です' },
        { status: 400 }
      );
    }

    // 画像生成処理
    // ... 既存の画像生成コード ...

    // クレジット消費
    await CreditService.useCredit(userId);

    return NextResponse.json({ imageUrl: '生成された画像のURL' });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: '画像生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 