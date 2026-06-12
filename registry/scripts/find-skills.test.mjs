import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('returns matching upstream skill IDs for a keyword', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skill-router-'));
  await writeFile(
    path.join(root, 'skills_index.json'),
    JSON.stringify([
      {
        id: 'mcp-builder',
        path: 'skills/mcp-builder',
        category: 'tools',
        name: 'mcp-builder',
        description: 'Build MCP servers with protocol, SDK setup, and evals.',
        risk: 'safe',
        source: 'community'
      },
      {
        id: 'supabase-automation',
        path: 'skills/supabase-automation',
        category: 'automation',
        name: 'supabase-automation',
        description: 'Automate Supabase DB queries, table management, project administration, storage, edge functions.',
        risk: 'critical',
        source: 'community'
      },
      {
        id: 'postgres-best-practices',
        path: 'skills/postgres-best-practices',
        category: 'database',
        name: 'postgres-best-practices',
        description: 'Postgres performance optimization and best practices from Supabase.',
        risk: 'safe',
        source: 'community'
      },
      {
        id: 'agents-md',
        path: 'skills/agents-md',
        category: 'ai-ml',
        name: 'agents-md',
        description: 'Maintain AGENTS.md with research-backed best practices.',
        risk: 'unknown',
        source: 'community'
      },
      {
        id: 'active-directory-attacks',
        path: 'skills/active-directory-attacks',
        category: 'security',
        name: 'active-directory-attacks',
        description: 'Red team techniques for Active Directory.',
        risk: 'offensive',
        source: 'community'
      }
    ])
  );

  const result = await execFileAsync('node', [
    '/root/.config/opencode/skills-registry/scripts/find-skills.mjs',
    '--index',
    path.join(root, 'skills_index.json'),
    '--skip',
    'postgres-best-practices',
    'MCP', 'supabase', 'Agents'
  ]);

  const matches = JSON.parse(result.stdout);
  const ids = matches.map((m) => m.id);

  assert.ok(ids.includes('mcp-builder'), 'should match mcp-builder for MCP keyword');
  assert.ok(ids.includes('agents-md'), 'should match agents-md for Agents keyword');
  assert.ok(!ids.includes('supabase-automation'), 'should skip critical risk by default');
  assert.ok(!ids.includes('active-directory-attacks'), 'should skip offensive risk');
  assert.ok(!ids.includes('postgres-best-practices'), 'should skip already-selected skills');
});

test('includes critical skills when risk override is used', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skill-router-'));
  await writeFile(
    path.join(root, 'skills_index.json'),
    JSON.stringify([
      {
        id: 'supabase-automation',
        path: 'skills/supabase-automation',
        category: 'automation',
        name: 'supabase-automation',
        description: 'Automate Supabase DB, edge functions, and project administration.',
        risk: 'critical',
        source: 'community'
      }
    ])
  );

  const result = await execFileAsync('node', [
    '/root/.config/opencode/skills-registry/scripts/find-skills.mjs',
    '--index',
    path.join(root, 'skills_index.json'),
    '--allow-critical',
    'supabase'
  ]);

  const matches = JSON.parse(result.stdout);
  assert.equal(matches[0].id, 'supabase-automation');
});
