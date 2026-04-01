# TODO

Prioritized improvements for the parser generator.

## P0 — Correctness and safety

- [ ] Add stateful lexer modes (or lexical states) for context-sensitive tokens.
- [ ] Implement full lookahead support (`&`) and lexical difference semantics (`-`) consistent with REx grammar behavior.
- [ ] Improve diagnostics with line/column positions in lexer and parser errors.
- [ ] Add golden tests for complex grammar constructs from `REx.ebnf`.
- [ ] Add regression tests for boundary cases in quantifiers and nested groups.

## P1 — Robustness and maintainability

- [ ] Split `code-generator.js` into focused modules:
  - lexical regex builder
  - parser body generator
  - naming/token mapping
- [ ] Add typed internal model (JSDoc typedefs or migrate internals to TypeScript).
- [ ] Add snapshot tests for generated parser output.
- [ ] Add deterministic formatting for generated code.
- [ ] Add CI workflow (test on Node LTS + current).

## P2 — Performance

- [ ] Cache expanded token regex fragments to reduce recursive rebuild cost.
- [ ] Benchmark lexer throughput on large grammars/files.
- [ ] Add optional fast-path for literal-only token sets.

## P3 — DX and productization

- [ ] Add CLI options:
  - output target path
  - debug trace mode
  - strict mode
  - optimization level
- [ ] Add command to generate directly from EBNF (without external intermediate step).
- [ ] Add versioned output header metadata.
- [ ] Publish usage examples and migration guide from REx.

## P4 — Multi-language backend roadmap

- [ ] Define language-agnostic IR (intermediate representation).
- [ ] Implement backend interface for targets.
- [ ] Add first extra backend (suggested: TypeScript or Python).
- [ ] Add backend conformance suite (same grammar, same acceptance/rejection corpus).

## Suggested next milestone

1. Implement lexer states + full lookahead/difference semantics.
2. Lock behavior with expanded regression/golden tests.
3. Introduce IR and extract JS backend from core.
4. Add second backend to validate architecture.
