---
description: Add one or more skills to the current project on demand
subtask: true
---

Add `$ARGUMENTS` to the current project's `.opencode/skillset.json`, then materialize the selected skills with:

```bash
node /root/.config/opencode/skills-registry/scripts/add-skill.mjs $ARGUMENTS --project .
```

Use this when a project suddenly needs a skill that was not selected by `/init-skills`, for example `mcp-builder` while adding an MCP server.

After the command runs, summarize the added skills and remind the user to restart opencode so newly materialized project skills are visible in the next session.
