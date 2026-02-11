import fs from 'node:fs';
import path from 'node:path';

const appPath = path.resolve(process.cwd(), 'App.tsx');
const hasApp = fs.existsSync(appPath);
if (!hasApp) {
  throw new Error('App.tsx not found');
}
console.log('mobile_smoke_ok');
