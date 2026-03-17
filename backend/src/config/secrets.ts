import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import logger from './logger';

let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client!; // Non-null assertion since we just initialized it
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
  const secrets = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_NAME',
    'DATABASE_URL',
    'TWILIO_AUTH_TOKEN',
    'OPENAI_API_KEY'
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
}
