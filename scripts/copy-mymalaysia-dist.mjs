// Copies the mymalaysia static export (Next.js `output: export` → out/)
// into the Pages build at dist/subdomains/mymalaysia. Run by
// `npm run build:mymalaysia` after the subdomain app's own build.
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(repoRoot, 'src', 'data', 'subdomains', 'mymalaysia', 'out');
const target = path.join(repoRoot, 'dist', 'subdomains', 'mymalaysia');

if (!existsSync(source)) {
  console.error(`mymalaysia static export not found at ${source} — run its build:static first.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`copied mymalaysia export -> ${path.relative(repoRoot, target)}`);
