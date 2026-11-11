# AGENTS.md

## Project
Smart Campus room availability checker; one fictional room, fictional data, client-side only.

## Acceptance Criteria (validation rules)
- AC1: Blocked rooms cannot be booked.
- AC2: Times must be within 0-1440 minutes.
- AC3: Start must be strictly before end.
- AC4: Start must be after the current time.
- AC5: Maximum slot duration is 120 minutes.
- AC6: Overlapping slots are rejected; touching boundaries are allowed.

## Constraints
- Preserve AC1–AC6 validation logic completely.
- Strict scope boundary: No backend, no database, no login, and no saved booking creation.
- Data is in-memory fixtures only. No database, including Supabase, unless the user explicitly asks.
- Do not add secrets, API keys, or credential values to code or the repo.
- Do not deploy or publish externally.
- Do not introduce unnecessary class hierarchies, Singleton, or Factory patterns.
- The allowed patterns are: modular boundary, and Strategy for booking policies.

## Engineering Rules
- Prefer pure functions and minimal structural changes.
- Use at most 2 justified patterns (e.g., modular boundary or optional Adapter if data structures demand it).
- Eliminate duplicate validation logic across UI layers (derive UI state strictly from primary validation output).
- Do not mutate original booking fixtures/data.
- Maintain clear, responsive UI feedback across desktop and mobile views.

## Verification & Testing Instructions
- Before reporting any change as accepted, run: npm run test, npm run typecheck, npm run lint, npm run build. All must pass.
- Add focused unit regression tests for core validation rules (AC1–AC6).
- Run existing and newly created tests to ensure all pass without breaking existing behavior.
- Run type checks / linter to ensure zero type errors or missing imports after refactoring.
- Explicitly report changed files, rationale, and test evidence upon task completion.