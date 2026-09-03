# Agent Instructions

Use Deno as the runtime and package manager for this repository. Run project
scripts and install dependencies with `deno` rather than `node`, `npm`, `npx`,
`yarn`, or `pnpm`.

Choose verification proportionate to the change:

- For trivial or isolated changes, run only directly relevant checks.
- Run `deno check` after TypeScript or type-related changes.
- Run `deno lint` after changes to linted source files.
- Run `deno task build` after structural, dependency, configuration, or
  production-build-sensitive changes.
- Run all three checks for substantial or cross-cutting changes.
- Briefly state which checks were run or skipped and why.
