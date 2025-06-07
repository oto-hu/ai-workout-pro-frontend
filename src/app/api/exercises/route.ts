import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';

// Firebase Admin SDKの初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export async function POST(request: Request) {
  try {
    // リクエストから認証トークンを取得
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;

    try {
      // トークンを検証してユーザーIDを取得
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      );
    }

    // リクエストボディから画像データを取得
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const exerciseName = formData.get('exerciseName') as string;

    if (!imageFile || !exerciseName) {
      return NextResponse.json(
        { error: '画像とエクササイズ名が必要です' },
        { status: 400 }
      );
    }

    // 画像サイズの検証（1MB以下）
    if (imageFile.size > 1024 * 1024) {
      return NextResponse.json(
        { error: '画像サイズは1MB以下にしてください' },
        { status: 400 }
      );
    }

    // 画像のバイナリデータを取得
    const imageBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // ファイル名の生成
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const fileName = `${exerciseName}_${timestamp}_${uniqueId}.png`;

    // Firebase Storageにアップロード
    const bucket = getStorage().bucket();
    const file = bucket.file(`exercises/public/${fileName}`);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          userId,
          exerciseName,
        },
      },
    });

    // 署名付きURLの生成（1週間有効）
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1週間
    });

    return NextResponse.json({
      url,
      fileName,
      exerciseName,
      userId,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
} 