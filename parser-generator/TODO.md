# TODO

Only the necessary next work for the parser generator.

## P0 — Fix now

- [ ] Fix lexer token priority generation so grammar precedence is respected.
  - `<<` must affect emitted matcher order in the generated lexer.
  - Current concrete failure: WAT decimal literals like `f64.const 3.14` are tokenized as `nat` (`3`) plus leftover `.14` instead of `float`.
  - Validate with the WAT grammar case where `float` must win over `nat`.

- [ ] Add regression tests for token-priority conflicts in generated lexers.
  - Cover `float` vs `nat`.
  - Cover named-token priority declared in the grammar.
  - Fail if generated token order diverges from grammar priority.

## P1 — Keep stable after the fix

- [ ] Improve lexer/parser diagnostics with line and column in reported errors.
- [ ] Add snapshot or golden tests for generated parser output for representative grammars.
