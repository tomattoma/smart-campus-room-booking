# AGENTS.md

## Project
Smart Campus room availability checker; one room, fictional data.

## Constraints
- Preserve AC1–AC6 validation logic completely.
- Strict scope boundary: No backend, no database, no login, and no saved booking creation.
- Do not introduce unnecessary class hierarchies, Singleton, or Factory patterns.

## Engineering Rules
- Prefer pure functions and minimal structural changes.
- Use at most 2 justified patterns (e.g., modular boundary or optional Adapter if data structures demand it).
- Eliminate duplicate validation logic across UI layers (derive UI state strictly from primary validation output).
- Do not mutate original booking fixtures/data.
- Maintain clear, responsive UI feedback across desktop and mobile views.

## Verification & Testing Instructions
- Add focused unit regression tests for core validation rules (AC1–AC6).
- Run existing and newly created tests to ensure all pass without breaking existing behavior.
- Run type checks / linter to ensure zero type errors or missing imports after refactoring.
- Explicitly report changed files, rationale, and test evidence upon task completion.