# 0003: Scenario schema design

- Date: 2026-11-24
- Status: Accepted

## Context
Every battle and migration is stored as a scenario file. The renderer, timeline,
editor and C# API all read or write it, so its design constrains everything else.

## Decision
- Zod is the single source of truth. TypeScript types come from it via
  z.infer, and JSON Schema will be generated from it for the C# API.
- Battle positions are metres east and north of a geographic anchor.
  Conversion to three.js axes (Y up, north is -Z) happens only in the
  rendering layer.
- Battle time is seconds from the start, within a fixed scenario duration.
- A `kind` field (currently only `battle`) leaves room for migrations later.
- Every keyframe is complete. Numbers interpolate linearly, facing takes the
  shortest arc, and state changes in steps.
- Disputed figures are estimates (min, best, max) with sources. Keyframe
  strength is a fraction of initial strength, so ranges carry through.
- Commanders are units with a `commander` type and optional `leadsUnitIds`.
- Units may enter at any time. `destroyed` and `left` must be the last keyframe.
- Formations are rectangles. Curved formations such as the Cannae crescent are
  built from several angled blocks for now.
- `schemaVersion` is present from the first version.
- Text is English only.

## Alternatives considered
- **Sparse keyframes:** shorter files, but harder interpolation and validation.
- **Formation curvature parameter:** more faithful, but complicates rendering,
  figure layout and the editor. Revisit if multi-block crescents look wrong.
- **Single figures instead of estimates:** simpler, but hides real historical
  disagreement.
- **Translatable text:** rejected for now. Retrofitting it would mean changing
  every text field.

## Consequences
- The cross-reference rules (unique IDs, references that resolve, keyframe
  order) cannot be expressed in JSON Schema. The C# API must reimplement them.
- Unit types are visual and tactical roles, not historical classifications.
  Historical detail goes in each unit's description.
- Saved files can be migrated when the schema changes, thanks to schemaVersion.