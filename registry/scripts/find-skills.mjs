#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function parseArgs(argv) {
  const args = { index: '', skip: [], keywords: [], allowCritical: false };
  const skipSet = new Set();
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--index') {
      args.index = argv[++i];
    } else if (value === '--skip') {
      const name = argv[++i];
      if (name) skipSet.add(name);
    } else if (value === '--allow-critical') {
      args.allowCritical = true;
    } else {
      args.keywords.push(value);
    }
  }
  args.skip = [...skipSet];
  return args;
}

const DEFAULT_ALLOWED_RISK = new Set(['safe', 'none', 'unknown']);
const OFFENSIVE_RISK = new Set(['offensive']);

function scoreKeyword(stem, text) {
  const lower = text.toLowerCase();
  let score = 0;
  if (lower.includes(stem)) score += 5;
  const words = lower.split(/[\s-]+/);
  for (const w of words) {
    if (w === stem) score += 3;
    else if (w.startsWith(stem) || stem.startsWith(w)) score += 1;
  }
  return score;
}

async function main() {
  const args = parseArgs(process.argv);
  const index = JSON.parse(await fs.readFile(args.index, 'utf8'));

  const allowedRisk = new Set(DEFAULT_ALLOWED_RISK);
  if (args.allowCritical) allowedRisk.add('critical');

  const skipSet = new Set(args.skip);

  const scored = [];
  for (const entry of index) {
    if (skipSet.has(entry.id)) continue;
    const risk = entry.risk || 'unknown';
    if (OFFENSIVE_RISK.has(risk)) continue;
    if (!allowedRisk.has(risk)) continue;

    const searchText = [entry.id, entry.name, entry.description, entry.category].filter(Boolean).join(' ');
    let total = 0;
    for (const kw of args.keywords) {
      total += scoreKeyword(kw.toLowerCase(), searchText);
    }
    if (total > 0) {
      scored.push({ id: entry.id, category: entry.category, risk, score: total, description: entry.description });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  process.stdout.write(JSON.stringify(top, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
