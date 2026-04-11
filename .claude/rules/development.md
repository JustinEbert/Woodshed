---
paths:
  - "src/**"
  - "docs/**"
---

# Development Process

## story discipline

- One story per commit. One commit per story.
- State issue number, title, and acceptance criteria before starting. Confirm scope first.
- Build ONLY what acceptance criteria specify. Nothing more.
- If you discover needed work outside scope: stop, propose it as AC update or new story, wait.
- Stubs from other stories are acceptable only as inert scaffolding (empty slot, type def).

## completion protocol

Before committing:
1. List every AC — mark each pass or fail.
2. List every changed file — each must trace to an AC.
3. Untraced changes: explain or remove.
4. Confirm walkthrough with user. Commit only after confirmation.

## testing

- Pure logic modules: always write tests. TDD when practical.
- React components: no unit tests required yet.
- Test files: `foo.ts` -> `foo.test.ts` (colocated).
- `npm test` must pass before committing.
- Runner: Vitest (`npm test` single run, `npm run test:watch` for dev).
