# opencode-skills-registry

Skills registry system for [opencode](https://opencode.ai). Auto-detects project stack, selects relevant skills from a vault of 1500+ upstream skills, and materializes them locally.

Built on top of [FrancoStino/opencode-skills-collection](https://github.com/FrancoStino/opencode-skills-collection).

## Quick Install

```bash
git clone https://github.com/RobertBirek/opencode-skills-registry.git ~/.local/share/opencode-skills-registry
~/.local/share/opencode-skills-registry/install.sh
```

## What's Included

| Component | Description |
|-----------|-------------|
| `registry/` | Skill index, stack detectors, upstream packs, helper scripts |
| `scripts/find-skills.mjs` | Keyword search over the upstream index for context-aware suggestions |
| `scripts/materialize-skills.mjs` | Materializes selected skills into `.opencode/skills/` with lockfile |
| `scripts/add-skill.mjs` | On-demand skill addition without full re-init |
| `scripts/sync-francostino-upstream.mjs` | Syncs the FrancoStino vault |
| `skills/skill-audit/` | Bootstrap skill that audits project stack and selects matching skills |
| `skills/skill-router/` | Skill that monitors conversation context and suggests missing skills |
| `skills/cloudflare/` | Comprehensive Cloudflare platform skill (Workers, D1, R2, AI, security, IaC) |
| `skills/vault-daydream/` | Multi-agent system that finds non-obvious connections in an Obsidian vault |
| `commands/init-skills.md` | `/init-skills` — auto-select skills for current project |
| `commands/add-skill.md` | `/add-skill` — add a skill by ID |
| `commands/skill-router.md` | `/skill-router` — manually trigger context-based suggestions |

## Usage

```bash
# Inside a project directory:
/init-skills        # Auto-detect stack and select skills
/add-skill mcp-builder      # Add a specific skill
/add-skill cloudflare       # Add Cloudflare platform skill
/add-skill vault-daydream   # Add Obsidian vault daydream skill
/skill-router               # Suggest skills based on conversation context
```

## Requirements

- opencode (any version with skill support)
- Node.js >= 18
