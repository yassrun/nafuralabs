// ng serve proxy of every product web app: /api goes to the product backend on spec.local.ports.api.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = JSON.parse(readFileSync(join(process.cwd(), '../../app.nafura.json'), 'utf8'));
const apiPort = app.spec.local?.ports?.api ?? 8080;

export default {
  '/api': { target: `http://127.0.0.1:${apiPort}`, secure: false, changeOrigin: true, logLevel: 'silent' },
};
