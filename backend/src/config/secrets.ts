import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import logger from './logger';

let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client!;
}

async function accessSecret(secretName: string): Promise<string | undefined> {
  try {
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) return undefined;

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await getClient().accessSecretVersion({ name });
    return version.payload?.data?.toString();
  } catch (err) {
    logger.warn(`Secret ${secretName} not found in Secret Manager.`);
    return undefined;
  }
}

export async function loadSecrets() {
  // All secrets that should be loaded from GCP Secret Manager
  const secrets = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_NAME',
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'TWILIO_AUTH_TOKEN',
    'OPENAI_API_KEY',
    'OPENROUTER_API_KEY'
  ];

  for (const key of secrets) {
    if (!process.env[key]) {
      const value = await accessSecret(key);
      if (value) {
        process.env[key] = value;
        logger.info(`Loaded secret: ${key}`);
      }
    }
  }

  // Validate critical secrets are present (fail fast in production)
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET not configured. Set it in GCP Secret Manager or .env');
  }
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('CRITICAL: REFRESH_TOKEN_SECRET not configured. Set it in GCP Secret Manager or .env');
  }
}
