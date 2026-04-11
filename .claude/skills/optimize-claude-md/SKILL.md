---
name: optimize-claude-md
description: Audit and minimize CLAUDE.md to only non-derivable content, moving verbose rules to .claude/rules/
user_invocable: true
---

# Optimize CLAUDE.md

Audit the current project's CLAUDE.md and minimize it. Every line must earn its place by passing one test: **"Can Claude derive this by reading a file in the codebase?"** If yes, remove it.

## Step 1: Read and categorize

Read CLAUDE.md. For each section/line, classify:

- **REMOVE** — derivable from codebase files:
  - Tech stack (package.json, config files, source code)
  - Project description (README.md)
  - Project structure (ls/Glob)
  - URLs (README, deploy workflows)
  - CSS values, design tokens (stylesheets)
  - Component specs for built components (code is the spec)
  - Issue lists, epics (check GitHub directly)

- **KEEP** — non-derivable decisions and constraints:
  - Architecture rules (invisible constraints like "module A never imports module B")
  - Priority decisions ("spec is source of truth", "match prototypes exactly")
  - Testing requirements not encoded in CI (platform matrix, manual verification)
  - Terminology that prevents real confusion
  - Pointers to source-of-truth docs (the pointer, not the content)

- **MOVE to `.claude/rules/`** — needed but verbose, and only relevant for certain files:
  - Design system rules → scope to UI file paths
  - Development process rules → scope to src/docs paths
  - Use frontmatter `paths:` to scope when rules load

## Step 2: Verify derivability

For each line marked REMOVE, confirm the source exists:
- Grep/Glob for the information in the codebase
- Check README.md, package.json, config files, workflows
- Only remove if the information is actually findable

## Step 3: Create path-scoped rules

For content that moves to `.claude/rules/`, add frontmatter:

```markdown
---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---
```

Rules only load when Claude touches matching files, saving tokens.

## Step 4: Write the minimized CLAUDE.md

Rewrite CLAUDE.md with only KEEP items. Target: under 50 lines.
No section should duplicate what another file already says.

## Step 5: Report

Show the user: before/after line count, what was removed and why, what moved to rules, and what stayed.

## Key principle

CLAUDE.md is NOT documentation. It is a set of decisions and constraints that override what Claude would otherwise infer. If Claude would naturally do the right thing without the instruction, the instruction is wasted tokens.
