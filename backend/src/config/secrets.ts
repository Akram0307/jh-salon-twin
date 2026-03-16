let client: import('@google-cloud/secret-manager').SecretManagerServiceClient | null = null;

function getClient(): import('@google-cloud/secret-manager').SecretManagerServiceClient {
  if (!client) {
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    client = new SecretManagerServiceClient();
  }
  return client;
}

async function accessSecret(secretName: string): Promise<string | undefined> {
  try {
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) return undefined;

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await getClient().accessSecretVersion({ name });
    return version.payload?.data?.toString();
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
