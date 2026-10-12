import { execFileSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = `${root}site`;
const viteExamples = ['storefront-concierge', 'sidebar', 'proactive-prompts'];

rmSync(site, { recursive: true, force: true });

for (const name of viteExamples) {
  execFileSync('npm', ['run', 'build', '-w', name], {
    cwd: root,
    stdio: 'inherit',
  });
  cpSync(`${root}examples/${name}/dist`, `${site}/${name}`, {
    recursive: true,
  });
}

cpSync(`${root}examples/script-tag`, `${site}/script-tag`, { recursive: true });
cpSync(`${root}gallery`, site, { recursive: true });

console.log(`Site built in ${site}`);
