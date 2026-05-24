# Prompt eval suite

Spec lives in `../../promptfoo.yaml`. This directory holds the prompt
templates and any baseline fixtures.

## When to run

- Locally, before merging any change to:
  - `lib/ai/prompt-builder.ts`
  - `lib/ai/onboarding-agent.ts`
  - any file under `lib/ai/tools/`
  - the model alias in either agent factory
- In CI, as a required job (gate the merge if the redteam suite has any
  failed assertion, or if golden accuracy drops > 10% from baseline).

## Running

```bash
ANTHROPIC_API_KEY=... npx promptfoo eval
```

To generate adversarial prompts on top of the curated suite:

```bash
ANTHROPIC_API_KEY=... npx promptfoo redteam run --no-cache
```

## Provider note

The provider is pinned to `claude-sonnet-4-20250514` to match the production
agent. When the application bumps its model alias, bump this file in the same
PR and rerun the eval to capture the new baseline.

## Adding cases

Each case is one entry under `tests:` in `promptfoo.yaml` with:
- `vars.user`: the message the user sends
- `assert`: one or more rules. The most useful types here are:
  - `contains` / `contains-any` / `not-contains` for behavioral checks
  - `not-equals` for exact-output rejection (e.g. "must not respond 'OK'")

Cases should be small, focused, and named in the YAML's `description` (a
`# heading` comment line per case is enough).
