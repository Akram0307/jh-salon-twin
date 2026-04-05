import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(_config: FullConfig) {
  const storageStatePath = path.join(__dirname, 'auth-storage.json');
  if (fs.existsSync(storageStatePath)) {
    fs.unlinkSync(storageStatePath);
    console.log('✓ Cleaned up auth storage state');
  }
}

export default globalTeardown;
