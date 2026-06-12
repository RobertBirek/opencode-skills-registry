---
name: vault-daydream
description: Multi-agent system that mines an Obsidian vault for non-obvious connections between notes, mimicking the brain's default mode network. Samples random note pairs, synthesizes connections via Sonnet, filters with Haiku critic. Inspired by Gwern's LLM Daydreaming.
---

# Vault Daydream Skill

Multi-agent system that mines the Obsidian vault for non-obvious connections between notes, mimicking the brain's default mode network. Samples random note pairs, synthesizes connections via Sonnet, filters with Haiku critic.

Inspired by [Gwern's LLM Daydreaming](https://gwern.net/ai-daydreaming).

## Usage

```
/daydream
```

## What it does

1. Auto-detects vault root from current directory (asks if not found)
2. Scans vault for notes modified in last 120 days
3. Generates 50 recency-weighted random pairs
4. Synthesizes connections (Sonnet, parallel batches of 5)
5. Critiques and scores insights (Haiku, parallel batches)
6. Filters for quality (average score >= 7.0)
7. Saves insight notes to `Daydreams/` folder
8. Generates daily digest in `Daydreams/digests/`
9. Appends summary to today's daily note

## Output

- **Individual insights**: `Daydreams/YYYYMMDD-slug.md` -- full synthesis with scores and wikilinks
- **Daily digest**: `Daydreams/digests/YYYYMMDD-digest.md` -- stats + ranked top insights
- **Daily note**: Summary appended under `## Daydream`
- **History log**: `ai-research/daydream/history.json` -- tracks sampled pairs for dedup

## Architecture

```
Skill (orchestrator)
  |-- Glob/Read: scan vault, extract excerpts
  |-- Generate 50 random pairs (recency-weighted)
  |-- Task(model: sonnet) x 10: synthesize connections  <-- parallel
  |-- Task(model: haiku) x 10: critique/score insights  <-- parallel
  |-- Filter (avg >= 7.0)
  +-- Write: save insight notes + daily digest
```

No external dependencies -- pure native tools (Glob, Read, Write, Bash, Task).

## Cost

Per run (~50 pairs): approximately $0.40-0.50 via Claude Code usage.
