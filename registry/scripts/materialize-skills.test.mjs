import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('materializes a skill selected from an upstream index', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skills-registry-'));
  const registryDir = path.join(root, 'registry');
  const projectDir = path.join(root, 'project');
  const upstreamDir = path.join(root, 'upstream');

  await mkdir(path.join(registryDir), { recursive: true });
  await mkdir(path.join(projectDir, '.opencode'), { recursive: true });
  await mkdir(path.join(upstreamDir, 'bundled-skills', 'agents-md'), { recursive: true });

  await writeFile(
    path.join(upstreamDir, 'skills_index.json'),
    JSON.stringify([
      {
        id: 'agents-md',
        path: 'skills/agents-md',
        category: 'ai-ml',
        name: 'agents-md',
        description: 'Maintain AGENTS.md instructions.',
        risk: 'safe',
        source: 'community'
      }
    ])
  );
  await writeFile(
    path.join(upstreamDir, 'bundled-skills', 'agents-md', 'SKILL.md'),
    '---\nname: agents-md\ndescription: Maintain AGENTS.md instructions.\n---\n\n# Agents MD\n'
  );
  await writeFile(
    path.join(registryDir, 'registry.json'),
    JSON.stringify({
      version: 1,
      skills: {},
      upstreams: {
        testCollection: {
          type: 'local-vault',
          indexPath: path.join(upstreamDir, 'skills_index.json'),
          skillsRoot: upstreamDir,
          pathRewrite: { from: 'skills/', to: 'bundled-skills/' },
          allowedRiskLevels: ['safe']
        }
      }
    })
  );
  await writeFile(
    path.join(projectDir, '.opencode', 'skillset.json'),
    JSON.stringify({ version: 1, selected: ['agents-md'], blocked: [] })
  );

  await execFileAsync('node', [
    path.join('/root/.config/opencode/skills-registry/scripts/materialize-skills.mjs'),
    '--project',
    projectDir,
    '--registry',
    path.join(registryDir, 'registry.json')
  ]);

  const copied = await readFile(path.join(projectDir, '.opencode', 'skills', 'agents-md', 'SKILL.md'), 'utf8');
  const lock = JSON.parse(await readFile(path.join(projectDir, '.opencode', 'skills-lock.json'), 'utf8'));

  assert.match(copied, /# Agents MD/);
  assert.equal(lock.skills['agents-md'].sourceType, 'upstream');
  assert.equal(lock.skills['agents-md'].upstream, 'testCollection');
  assert.equal(lock.skills['agents-md'].risk, 'safe');
});
