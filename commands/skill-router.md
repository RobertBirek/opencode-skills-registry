---
description: Suggest missing project skills based on conversation context
subtask: true
---

Use the `skill-router` skill to scan the conversation for technology or workflow keywords, search the FrancoStino upstream index, and suggest any skills missing from `.opencode/skillset.json`.

If $ARGUMENTS is provided, use those as explicit keywords for the search.

After the skill produces suggestions, ask the user which skills to add, then run `/add-skill` for the confirmed ones.
