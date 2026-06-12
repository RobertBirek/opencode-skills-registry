#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

function resolvePath(p) {
  if (!p) return p;
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function parseArgs(argv) {
  const args = { project: process.cwd(), registry: '', manifest: '' };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--project') args.project = argv[++i];
    else if (value === '--registry') args.registry = argv[++i];
    else if (value === '--manifest') args.manifest = argv[++i];
  }
  return args;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function ensureDir(filePath) {
  await fs.mkdir(filePath, { recursive: true });
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true, force: true });
}

async function hashDir(dir) {
  const hash = createHash('sha256');

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        hash.update(`dir:${path.relative(dir, full)}\n`);
        await walk(full);
        continue;
      }
      if (entry.isFile()) {
        hash.update(`file:${path.relative(dir, full)}\n`);
        hash.update(await fs.readFile(full));
        hash.update('\n');
      }
    }
  }

  await walk(dir);
  return hash.digest('hex');
}

function rewritePath(sourcePath, rewrite) {
  if (!rewrite?.from || rewrite.to === undefined) return sourcePath;
  if (!sourcePath.startsWith(rewrite.from)) return sourcePath;
  return `${rewrite.to}${sourcePath.slice(rewrite.from.length)}`;
}

async function findUpstreamSkill(registry, skillName) {
  for (const [upstreamName, upstream] of Object.entries(registry.upstreams || {})) {
    if (upstream.type !== 'local-vault') continue;
    if (!(await exists(upstream.indexPath))) continue;

    const index = await readJson(upstream.indexPath);
    const entry = index.find((item) => item.id === skillName || item.name === skillName);
    if (!entry) continue;

    const allowedRiskLevels = new Set(upstream.allowedRiskLevels || []);
    if (allowedRiskLevels.size > 0 && !allowedRiskLevels.has(entry.risk || 'unknown')) continue;

    const sourceDir = path.join(upstream.skillsRoot, rewritePath(entry.path, upstream.pathRewrite));
    if (!(await exists(sourceDir))) continue;

    return { upstreamName, upstream, entry, sourceDir };
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const registryPath = args.registry || path.join(scriptDir, '..', 'registry.json');
  const manifestPath = args.manifest || path.join(args.project, '.opencode', 'skillset.json');
  const projectSkillsDir = path.join(args.project, '.opencode', 'skills');
  const lockPath = path.join(args.project, '.opencode', 'skills-lock.json');

  if (!(await exists(manifestPath))) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const registry = await readJson(registryPath);
  const manifest = await readJson(manifestPath);
  const selected = Array.from(new Set([...(manifest.selected || []), ...(manifest.required || [])]));
  const blocked = new Set(manifest.blocked || []);
  const skills = {};

  await ensureDir(projectSkillsDir);

  for (const skillName of selected) {
    if (blocked.has(skillName)) continue;
    const entry = registry.skills?.[skillName];
    if (!entry) {
      const upstreamSkill = await findUpstreamSkill(registry, skillName);
      if (!upstreamSkill) continue;

      const targetDir = path.join(projectSkillsDir, skillName);
      await copyDir(upstreamSkill.sourceDir, targetDir);
      skills[skillName] = {
        sourceType: 'upstream',
        upstream: upstreamSkill.upstreamName,
        id: upstreamSkill.entry.id,
        path: upstreamSkill.entry.path,
        category: upstreamSkill.entry.category,
        risk: upstreamSkill.entry.risk,
        source: upstreamSkill.entry.source,
        computedHash: await hashDir(targetDir)
      };
      continue;
    }

    if (entry.materialize === false || entry.sourceType !== 'local') continue;

    const sourceDir = path.join(resolvePath(entry.sourceRoot), entry.path);
    const targetDir = path.join(projectSkillsDir, skillName);

    if (!(await exists(sourceDir))) continue;

    await copyDir(sourceDir, targetDir);
    skills[skillName] = {
      sourceType: entry.sourceType,
      sourceRoot: entry.sourceRoot,
      path: entry.path,
      computedHash: await hashDir(targetDir)
    };
  }

  await fs.writeFile(lockPath, `${JSON.stringify({ version: 1, skills }, null, 2)}\n`);
  process.stdout.write(`${Object.keys(skills).length} skill(s) materialized\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
