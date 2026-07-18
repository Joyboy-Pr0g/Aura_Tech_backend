import * as fs from 'fs';
import * as path from 'path';
import {
  App,
  ServiceAccount,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;

function loadServiceAccount(): ServiceAccount | null {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    return JSON.parse(jsonEnv) as ServiceAccount;
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!filePath) return null;

  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Firebase service account file not found: ${resolved}`);
  }

  return JSON.parse(fs.readFileSync(resolved, 'utf8')) as ServiceAccount;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
      || process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim(),
  );
}

export function getFirebaseAdmin(): App | null {
  if (!isFirebaseConfigured()) return null;

  if (!firebaseApp) {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) return null;

    firebaseApp = getApps().length > 0
      ? getApps()[0]
      : initializeApp({ credential: cert(serviceAccount) });
  }

  return firebaseApp;
}

export interface FirebaseMulticastResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

const INVALID_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
  'messaging/third-party-auth-error',
]);

export async function sendFirebaseMulticast(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<FirebaseMulticastResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  if (!getFirebaseAdmin()) {
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }

  const result = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data ?? {},
  });

  const invalidTokens: string[] = [];
  result.responses.forEach((response, index) => {
    if (response.success) return;
    const code = response.error?.code ?? '';
    const message = response.error?.message ?? '';
    const isInvalid = INVALID_TOKEN_ERROR_CODES.has(code)
      || message.toLowerCase().includes('third party auth');
    if (isInvalid && tokens[index]) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (result.failureCount > 0) {
    const errors = result.responses
      .filter((r) => !r.success)
      .map((r) => `${r.error?.code ?? 'unknown'}: ${r.error?.message ?? 'failed'}`);
    console.warn('[FCM] multicast partial failure', {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: errors.slice(0, 3),
    });
  }

  return {
    successCount: result.successCount,
    failureCount: result.failureCount,
    invalidTokens,
  };
}
