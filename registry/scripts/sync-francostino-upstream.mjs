#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'https://github.com/FrancoStino/opencode-skills-collection.git';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const upstreamDir = path.join(scriptDir, '..', 'upstreams', 'francostino');
  const repoDir = path.join(upstreamDir, 'repo');
  const gitDir = path.join(repoDir, '.git');

  await fs.mkdir(upstreamDir, { recursive: true });

  if (await exists(gitDir)) {
    await run('git', ['-C', repoDir, 'pull', '--ff-only']);
  } else {
    await run('git', ['clone', '--depth', '1', REPOSITORY, repoDir]);
  }

  const indexPath = path.join(repoDir, 'skills_index.json');
  const skillsRoot = path.join(repoDir, 'bundled-skills');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  const categoryCount = new Set(index.map((skill) => skill.category || 'uncategorized')).size;

  if (!(await exists(skillsRoot))) {
    throw new Error(`Expected bundled skills directory missing: ${skillsRoot}`);
  }

  process.stdout.write(`Synced ${index.length} upstream skills across ${categoryCount} categories\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
