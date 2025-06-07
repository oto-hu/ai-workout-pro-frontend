import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

// グローバル設定
setGlobalOptions({ region: 'us-central1' });

// Next.js アプリの設定
import next from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const nextjsServer = next({
  dev: isDev,
  conf: {
    distDir: '.next',
  },
});

const nextjsHandle = nextjsServer.getRequestHandler();

export const app = onRequest(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (req, res) => {
    await nextjsServer.prepare();
    return nextjsHandle(req, res);
  }
);
