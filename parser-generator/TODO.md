# TODO

Prioritized improvements for the parser generator.

## P0 — Correctness and safety

- [ ] Improve diagnostics with line/column positions in lexer and parser errors.
- [ ] Add regression tests for boundary cases in quantifiers and nested groups.
- [ ] Add golden tests for complex grammar constructs from `REx.ebnf`.
- [ ] Implement full lookahead support (`&`) and lexical difference semantics (`-`) consistent with REx grammar behavior.
- [ ] Add stateful lexer modes (or lexical states) for context-sensitive tokens.

## P1 — Robustness and high-impact DX

- [ ] Add command to generate directly from EBNF (without external intermediate step).
  — `REx.js` is already available; wire it into the CLI as a pre-step.
- [ ] Add snapshot tests for generated parser output.
- [ ] Add CI workflow (test on Node LTS + current).
- [ ] Split `code-generator.js` into focused modules:
  - lexical regex builder
  - parser body generator
  - naming/token mapping
- [ ] Add typed internal model (JSDoc typedefs or migrate internals to TypeScript).
- [ ] Add deterministic formatting for generated code.

## P2 — CLI completeness

- [ ] Add CLI options:
  - output target path
  - debug trace mode
  - strict mode
  - optimization level
- [ ] Add versioned output header metadata to generated files.
- [ ] Publish usage examples and migration guide from REx.

## P3 — Performance

- [ ] Cache expanded token regex fragments to reduce recursive rebuild cost.
- [ ] Benchmark lexer throughput on large grammars/files.
- [ ] Add optional fast-path for literal-only token sets.

## P4 — Multi-language backend roadmap

- [ ] Define language-agnostic IR (intermediate representation).
- [ ] Implement backend interface for targets.
- [ ] Add first extra backend (suggested: TypeScript or Python).
- [ ] Add backend conformance suite (same grammar, same acceptance/rejection corpus).

## Suggested next milestone

1. Improve error diagnostics (line/column) — immediate quality-of-life gain.
2. Lock behavior with regression and golden tests against `REx.ebnf`.
3. Wire EBNF direct generation into the CLI (high DX impact, low effort).
4. Introduce IR and extract JS backend from core.
5. Add second backend to validate the architecture.
