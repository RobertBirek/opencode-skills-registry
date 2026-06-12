---
description: Initialize or refresh project-specific opencode skills
subtask: true
---

Use the `skill-audit` skill to inspect the current project and build a project-specific skillset.

Do not modify `/init`.
Read the registry at `/root/.config/opencode/skills-registry/`.
If the FrancoStino upstream vault is missing, use `/root/.config/opencode/skills-registry/scripts/sync-francostino-upstream.mjs` first.
Detect the project stack, then choose required, blocked, and override skills.
Materialize the chosen skills into `.opencode/skills/`.
Write or update `.opencode/skillset.json` and `.opencode/skills-lock.json`.
Preserve existing project overrides unless they conflict with blocked skills.
At the end, summarize what was selected, what was blocked, and remind the user to restart opencode.
