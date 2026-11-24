# 0001: Use WebGL2 as the renderer

- Date: 2026-11-24
- Status: Accepted

## Context
The project needs advanced real-time 3D in the browser: thousands of
instanced animated figures, terrain, shadows and post-processing. three.js
offers two renderers: WebGLRenderer (WebGL2) and WebGPURenderer.

## Decision
Use WebGL2 via React Three Fiber's default renderer. Shaders are written in GLSL.

## Alternatives considered
- **WebGPU with TSL shaders:** more modern, with compute shaders that would
  help GPU crowd simulation. Rejected for now: browser support is less
  universal, and there are fewer examples and libraries to learn from.

## Consequences
- Works in every current browser, with the widest choice of examples.
- Crowd animation will use vertex animation textures rather than compute shaders.
- Moving to WebGPU later would mean rewriting custom shaders from GLSL to TSL,
  so keep custom shaders few and isolated.