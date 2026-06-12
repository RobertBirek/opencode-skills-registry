---
name: skill-router
description: Use when a conversation mentions technologies or workflows for which the project may lack a skill. Extracts keywords, searches the FrancoStino upstream index, and suggests missing skills to add via /add-skill.
tags: [opencode, skills, context, suggestion, routing]
---

# Skill Router

Suggest project skills based on the current conversation context. Never auto-install — always ask first.

## Trigger Examples

Mention of any of these in conversation should prompt a check:
- MCP, protocol, server ↔ mcp-builder
- Supabase, Postgres, migration, RLS, schema, query ↔ postgres-best-practices
- accessibility, a11y, WCAG, screen reader ↔ accesslint-scan, accesslint-audit
- AGENTS.md, CLAUDE.md, agent instructions ↔ agents-md
- LLM eval, judge, benchmark, scoring ↔ agent-evaluation, advanced-evaluation
- GitHub Actions, CI, workflow, deploy ↔ agentic-actions-auditor
- Playwright, E2E, browser test ↔ webapp-testing
- design, UI, typography, frontend ↔ frontend-design
- React, Next.js, performance, bundle ↔ vercel-react-best-practices
- shadcn, components, UI kit ↔ shadcn
- Tailwind, design tokens, design system ↔ tailwind-design-system
- agent memory, tool design, AI tooling ↔ agent-tool-builder, agent-memory-systems
- Vite, scaffold, TypeScript project ↔ ai-native-cli
- writing, docs, prose, README, release notes ↔ stop-slop

## Process

1. Scan the last few messages for technology or workflow keywords.
2. Read `.opencode/skillset.json` to know what is already selected.
3. Run:

```bash
node /root/.config/opencode/skills-registry/scripts/find-skills.mjs \
  --index /root/.config/opencode/skills-registry/upstreams/francostino/repo/skills_index.json \
  --skip ALREADY_SELECTED_ID_1 --skip ALREADY_SELECTED_ID_2 \
  KEYWORD1 KEYWORD2
```

4. Filter out any result already listed in `.opencode/skillset.json`.
5. Show the top 2–3 matches with their `id`, one-line reason, and `risk`.
6. For `unknown` risk, include: "Risk: unknown — review before adding."
7. For `critical` or `offensive`, do not suggest unless the user explicitly asked for the exact security/pen-test capability.
8. Ask: "Add `skill-id` to this project?"
9. On approval, run:

```bash
node /root/.config/opencode/skills-registry/scripts/add-skill.mjs skill-id --project /path/to/project
```

10. Remind the user to restart opencode so the new skill is visible.

## Guardrails

- Do not auto-add without user approval.
- Do not suggest skills already in `.opencode/skillset.json`.
- Do not suggest `offensive` skills unless the user literally asked for a penetration-test or security-exploitation task and the work is authorized.
- Keep the explanation per skill to one sentence.
- Do not flood the user with more than 3 suggestions at once.

## Paths

- Upstream index: `/root/.config/opencode/skills-registry/upstreams/francostino/repo/skills_index.json`
- Finder script: `/root/.config/opencode/skills-registry/scripts/find-skills.mjs`
- Adder script: `/root/.config/opencode/skills-registry/scripts/add-skill.mjs`
- Project manifest: `.opencode/skillset.json`
