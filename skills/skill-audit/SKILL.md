---
name: skill-audit
description: Use when running /init-skills, auditing a project's stack, or selecting and materializing opencode skills into .opencode/skills and .opencode/skills-lock.json.
tags: [opencode, skills, audit, registry, init, project]
---

# Skill Audit

Use this skill to build a project-specific opencode skillset without touching `/init`.

## Inputs

- Current project files and folders
- Existing `.opencode/skillset.json`, if present
- Registry files in `/root/.config/opencode/skills-registry/`
- Optional upstream vault at `/root/.config/opencode/skills-registry/upstreams/francostino/repo`
- Existing global/bootstrap skills already available in this session

## Process

1. Inspect the project stack and workflow signals.
2. Read `registry.json`, `detectors.json`, and the relevant `packs/*.json` files.
   If the FrancoStino upstream vault is missing, run `node /root/.config/opencode/skills-registry/scripts/sync-francostino-upstream.mjs` before selecting upstream skills.
3. Build a final list using this order:
   - global bootstrap skills
   - auto-detected skills
   - project `required`
   - project `overrides`
   - project `blocked`
4. Treat `blocked` as final. If a skill is both required and blocked, surface it as a config error.
5. Materialize the selected skills into `.opencode/skills/<skill>/` when the registry marks them as materializable.
6. Write `.opencode/skillset.json` as the human-readable manifest.
7. Write `.opencode/skills-lock.json` as the final locked set with source and hash data.
8. End with a short summary and remind the user to restart opencode.

Use `/root/.config/opencode/skills-registry/scripts/materialize-skills.mjs` when the selected set is ready and the registry can satisfy the copy directly.

When selecting from `francostino-opencode-skills-collection`, prefer skills with `risk` values `safe` or `none`. Use `unknown` only when the project signal is strong. Do not select `critical` or `offensive` skills unless the user explicitly asks for that exact capability and the work is authorized.

## Guardrails

- Keep the global bootstrap small.
- Prefer a few high-signal skills over broad bundles.
- Do not add anything to `/init`.
- Do not silently install a skill unless the registry and the project signals support it.
- If a required skill is unavailable, explain the gap and leave a clear note in the manifest.

## Output

Aim to leave these files behind when initialization succeeds:

- `.opencode/skillset.json`
- `.opencode/skills-lock.json`
- `.opencode/skills/<skill>/SKILL.md`
