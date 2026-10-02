# ADR 0006: Hash generated files for representative configurations

## Status

Accepted

## Context

Adapter tests check individual operations and the SDK checksum checks the base template.
Refactoring adapters or the renderer can also change the files produced by their combined plan.
A shared baseline lets reviewers see which selected configurations produce different files.

## Decision

`scripts/architecture-harness.mjs` renders plans in memory for 64 selected representative
configurations. It records file counts and tree hashes in `architecture.baseline.json`.
These cases cover each major option and selected interactions, not every supported combination.

`pnpm architecture:check` builds the CLI before comparing its generated files with the baseline.
It fails if a selected case changes, disappears, or fails input validation. `pnpm check` runs it
alongside the existing lint, checksum, typecheck, and test commands.

When generated output intentionally changes, regenerate the baseline with `pnpm architecture`
and review the affected files before committing the new hashes.

## Consequences

The check detects content and file-name changes for the selected configurations. It does not
verify interactive behavior, diagnostics, installed projects, or copied trees that need disk
access. Existing focused checks and inspection of rendered projects remain necessary.

New choices and interactions need representative cases. An unchanged baseline says only that
the selected cases still produce the same files.
