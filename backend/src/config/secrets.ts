import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function accessSecret(secretName: string): Promise<string | undefined> {
  try {
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) return undefined;

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({ name });

    const payload = version.payload?.data?.toString();

    return payload;
  } catch (err) {
    console.warn(`Secret ${secretName} not found in Secret Manager.`);
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
        console.log(`Loaded secret: ${key}`);
      }
    }
  }
}
