---
name: epic-preflight
description: Evaluate whether an epic/feature/story is ready to develop. Identifies design gaps, missing stories, undefined product behavior, and declares readiness.
user_invocable: true
---

# Epic Preflight Check

Evaluate an epic (or feature, or large story — these words are interchangeable) to determine if it is ready for implementation. This is a structured review, not a rubber stamp. The goal is to find gaps before development starts, not after.

**Input:** The user names an epic, points to a GitHub issue, or describes a feature area. Use that as the starting point.

## Phase 1: Gather context

Read everything relevant before evaluating anything.

- Read the product spec (`docs/woodshed_spec_v0.2.md`) for the section covering this epic
- Read all GitHub issues: the epic issue, every linked story, and any related issues found via label/search
- Read any existing code — components, stubs, types — that relate to this epic
- Read any existing prototypes in `docs/prototypes/`
- Read CLAUDE.md for architectural constraints that apply

Do not evaluate yet. Understand first.

## Phase 2: Behavioral design gate

**This is the most important check.** Ask:

> "Can I describe 3 concrete end-to-end examples of a user experiencing this feature — what they do, what happens, and why they care?"

If the answer is no, the epic has undefined product behavior. This is the most critical gap because it means:
- The system prompt / AI behavior can't be specified
- UI design has no scenarios to design for
- Acceptance criteria are mechanical ("API returns response") not behavioral ("trainer gives useful guidance")
- No one can evaluate whether the implementation is good

**Action if missing:** Create a `design-gate` story for interaction scenarios / storyboard examples. This story must define concrete scenarios with: context, what happens, what the system does, and why it's valuable to the user. This blocks all implementation stories.

## Phase 3: Visual design gate

For every story that has UI behavior, check:

> "Is there a visual spec or prototype that shows what this looks like in every state?"

States to look for: idle, active, loading, error, offline, empty, transition/animation. If any UI story lacks a visual reference, it's not ready.

**Action if missing:** Create a `design-gate` story for the visual prototype. This blocks the implementation stories that depend on it.

## Phase 4: Competitive and conceptual check

Research how this feature compares to existing products — both direct competitors and analogous features in other domains. Report:

- Where this approach is genuinely novel or differentiated
- Where competitors are stronger and whether that matters
- Whether the feature supports the app's core thesis or drifts from it
- Any patterns from other domains that should inform the design

This phase informs but does not block. It may surface design questions that become new stories or change existing ones.

## Phase 5: Story completeness and dependency check

Verify the epic has full coverage:

- Is every piece of the feature tracked as a story with acceptance criteria?
- Are dependencies explicit and correct? (A blocks B, B blocks C)
- Are there integration stories connecting this epic to other epics/components?
- Is there a clear interface contract where this feature meets other parts of the system?
- Are edge cases covered? (offline, error, empty state, first-time use, permissions)

**Common gaps to look for:**
- Integration stories between components/epics (e.g., "Exercise X feeds data to Feature Y")
- System prompt / AI behavior design (when AI is involved)
- First-run / onboarding experience
- Error and fallback states
- Data migration or schema evolution

**Action if missing:** Create stories for each gap with proper labels and dependency links. Update the epic issue to include them.

## Phase 6: Implementability assessment

Evaluate whether the technical path is clear:

- What's already built that this epic can use?
- What needs to be built? Is each piece standard engineering or novel/risky?
- Are there real-world UX risks that code can't solve? (e.g., voice recognition with background noise)
- Are there cost, latency, or platform constraints?
- What's the dependency chain and is there a clear build order?

Classify risks as: code risk (engineering difficulty), UX risk (works technically but might not feel right), or platform risk (browser/device limitations).

## Phase 7: Readiness declaration

Based on all phases, declare one of:

### READY
All design gates resolved. Stories complete with dependencies. Technical path clear. Build order defined.

### NOT READY — with specific blockers
List every `design-gate` story that must be completed first. List any missing stories that need to be created. Update the epic issue with a readiness section at the top showing the blockers.

## Actions to take

When creating stories for gaps:

1. **Use the `design-gate` label** for any story that defines what the feature does (behavioral) or looks like (visual). These block implementation.
2. **Set proper dependency links** — design gates block implementation stories, not just the epic
3. **Update the epic issue** — add a readiness section at the top with checkboxes for each design gate
4. **Set priority** — design gates are p0 or p1 (they block everything else)

When updating the epic:

- Add an "Epic readiness" section at the top of the epic body
- List all design-gate stories with checkboxes
- State the readiness verdict clearly
- Keep the dependency chain diagram current

## Output format

Present findings to the user as a structured report:

```
## Epic Preflight: [Epic Name]

### Readiness: READY | NOT READY

### Design Gates
- [status] Behavioral: [description]
- [status] Visual: [description]

### Competitive Position
- [brief summary of differentiation and gaps]

### Story Gaps Found
- [list of missing stories created]

### Implementability
- [summary of technical readiness and risks]

### Actions Taken
- [list of issues created/updated]
```

## Principles

- **Behavioral design comes before visual design comes before implementation.** Always check in this order.
- **"What does this feature actually do?" is never a dumb question.** If the epic can't answer it with concrete examples, it's not ready.
- **Mechanics are not product.** An API integration spec is not a feature definition. The feature is what the user experiences.
- **Design gates are not bureaucracy.** They prevent building the wrong thing. A week spent on scenarios saves a month of iteration after implementation.
- **The skill creates stories and updates issues.** It doesn't just report — it takes action to fill gaps and establish blocking relationships.
