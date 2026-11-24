# 0002: Use a single repository with one folder per component

- Date: 2026-11-24
- Status: Accepted

## Context
The project will grow into several components written in different languages:

- a TypeScript frontend (React, React Three Fiber)
- a C# backend for publishing and sharing scenarios (phase 3)
- Python tools for the terrain pipeline (iteration 3)

The scenario schema is shared between the frontend and the backend. It is
defined once in Zod and exported as JSON Schema for the C# API to validate
against. Changes to the schema will often need matching changes on both sides.

## Decision
Keep everything in one repository, with one top-level folder per component:

- `web/` for the frontend
- `api/` for the C# backend
- `tools/` for the Python tooling
- `docs/` for architecture notes and decision records

Each folder has its own toolchain and dependencies. There is no JavaScript
monorepo tool (such as Nx or Turborepo), because only one component uses npm.

## Alternatives considered
- **A separate repository per component:** cleaner boundaries and independent
  version histories. Rejected because the shared schema would need to be
  published or copied between repos and could drift out of sync, and a change
  touching both frontend and backend would need coordinated commits across repos.
- **A JavaScript monorepo tool (Nx, Turborepo, npm workspaces):** useful when
  several npm packages depend on each other. Rejected as unnecessary: there is
  one npm package, and the other components use .NET and Python tooling.

## Consequences
- A schema change and the code that depends on it land in one commit, so the
  frontend and backend cannot get out of step.
- One history and one place for reviewers to look, with the full project
  visible at a glance.
- CI needs a separate job per component, each running in its own folder. The
  `web` job exists. `api` and `tools` jobs will be added when those folders do.
- Later, CI jobs should only run when their own folder changes (GitHub Actions
  path filters), to keep runs fast as the project grows.