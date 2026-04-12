---
paths:
  - "src/**"
  - "docs/**"
---

# Development Process

## epic readiness

An epic is NOT READY for implementation until all `design-gate` stories are resolved.

Design gates come in two types:
- **Behavioral** — defines what the feature does via concrete storyboard scenarios (context, action, system response, user value). If you can't give 3 examples of a user experiencing the feature end-to-end, the product behavior is undefined.
- **Visual** — prototype or visual spec showing every UI state (idle, active, loading, error, offline, transition).

Behavioral design comes before visual design comes before implementation. Always check in this order.

Before starting any implementation story in an epic, verify:
1. The epic has an "Epic readiness" section at the top of its GH issue body
2. All `design-gate` stories are checked off
3. The readiness verdict says READY

Use `/epic-preflight` to run the full evaluation on any epic.

## story discipline

- One story per commit. A story may span multiple commits as we iterate.
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

## pre-commit verification

All three must pass before every commit — no exceptions:
1. `npm test` — all tests pass
2. `npm run build` — full production build succeeds (includes `tsc -b` which is stricter than `tsc --noEmit`)
3. Verify no console errors in dev server if UI was changed

**Never use `npx tsc --noEmit` as the typecheck gate.** The build uses `tsc -b` (project references mode) which is stricter. Always run `npm run build` to catch type errors the build will catch.

## testing

- Pure logic modules: always write tests. TDD when practical.
- React components: no unit tests required yet.
- Test files: `foo.ts` -> `foo.test.ts` (colocated).
- `npm test` must pass before committing.
- Runner: Vitest (`npm test` single run, `npm run test:watch` for dev).
