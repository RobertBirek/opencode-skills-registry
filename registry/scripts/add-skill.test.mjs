import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('adds a skill to project manifest and materializes it', async () => {
  const projectDir = await mkdtemp(path.join(os.tmpdir(), 'add-skill-project-'));
  await mkdir(path.join(projectDir, '.opencode'), { recursive: true });
  await writeFile(
    path.join(projectDir, '.opencode', 'skillset.json'),
    JSON.stringify({ version: 1, selected: ['webapp-testing'], blocked: [] }, null, 2)
  );

  await execFileAsync('node', [
    '/root/.config/opencode/skills-registry/scripts/add-skill.mjs',
    'mcp-builder',
    '--project',
    projectDir
  ]);

  const manifest = JSON.parse(await readFile(path.join(projectDir, '.opencode', 'skillset.json'), 'utf8'));
  const lock = JSON.parse(await readFile(path.join(projectDir, '.opencode', 'skills-lock.json'), 'utf8'));

  assert.deepEqual(manifest.selected.sort(), ['mcp-builder', 'webapp-testing']);
  assert.equal(lock.skills['mcp-builder'].sourceType, 'local');
  assert.match(await readFile(path.join(projectDir, '.opencode', 'skills', 'mcp-builder', 'SKILL.md'), 'utf8'), /name: mcp-builder/);
});
