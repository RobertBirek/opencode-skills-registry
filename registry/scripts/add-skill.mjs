#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const args = { project: process.cwd(), skills: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--project') args.project = argv[++i];
    else args.skills.push(value);
  }
  return args;
}

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

async function readJson(filePath, fallback) {
  if (!(await exists(filePath))) return fallback;
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.skills.length === 0) {
    throw new Error('Usage: add-skill.mjs <skill-id...> [--project /path/to/project]');
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const manifestPath = path.join(args.project, '.opencode', 'skillset.json');
  const registryPath = path.join(scriptDir, '..', 'registry.json');
  const materializerPath = path.join(scriptDir, 'materialize-skills.mjs');
  const manifest = await readJson(manifestPath, {
    version: 1,
    generatedBy: '/add-skill',
    registry: registryPath,
    selected: [],
    required: [],
    blocked: [],
    overrides: {}
  });

  manifest.selected = Array.from(new Set([...(manifest.selected || []), ...args.skills]));
  manifest.blocked = (manifest.blocked || []).filter((skill) => !args.skills.includes(skill));

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await run('node', [materializerPath, '--project', args.project, '--registry', registryPath]);

  process.stdout.write(`Added ${args.skills.join(', ')}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
