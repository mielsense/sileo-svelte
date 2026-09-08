---
title: Agent skill
description: Give a coding agent the Sileo API contracts it needs before it changes your app.
label: Agent skill
---

The `sileo-svelte` skill covers setup, toast updates, promise results, styling, snippets, and accessibility. It directs agents to the installed package declarations and the relevant documentation before they choose an API.

## Install

Install from the Sileo repository with the [skills CLI](https://skills.sh/docs):

```bash
npx skills add mielsense/sileo-svelte --skill sileo-svelte
```

You can [read the skill](/skill.md) before installing it. The repository and this site serve the same source file.

## Use it

Name the skill and describe what should happen in your application.

```text
Use $sileo-svelte to show loading, success, and error notifications when settings save.
Keep the existing error handling and mount Toaster once in the root layout.
```

For styling work, give the agent the context it needs to check readability:

```text
Use $sileo-svelte to make a frosted glass toast that works over the images on this page.
Check keyboard interaction, narrow screens, and the appearance without backdrop blur.
```

## Read without installing

Agents can fetch the [skill discovery index](/.well-known/agent-skills/index.json) or [SKILL.md](/.well-known/agent-skills/sileo-svelte/SKILL.md) directly. The skill is self-contained and links to detailed documentation when needed.

The [documentation index](/llms.txt) lists every guide as Markdown. The [full documentation](/llms-full.txt) combines them into one file.
