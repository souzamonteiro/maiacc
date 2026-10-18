# MaiaCC Parser Generator

A parser generator that reads XML produced from EBNF grammars and emits a JavaScript lexer/parser or a C++98 parser over a caller-provided token stream. JavaScript remains the default backend.

The additive C++98 backend reuses the grammar model and production traversal; it intentionally leaves tokenization to the application so context-sensitive scanners can be supplied.

## Current status

- Generates JavaScript lexer/parsers from EBNF-derived XML.
- Generates C++98 parser classes and prefixed token-ID macros from the same grammar model.
- Handles syntax and lexical rules (including groups and quantifiers).
- Supports skip tokens (for example, whitespace via `/* ws: definition */`).
- Includes unit and integration tests.
- Self-hosting milestone reached for the current REx grammar flow:
  - generate XML from `REx.ebnf`
  - generate parser from XML
  - parse `REx.ebnf` using generated parser

---

## Project structure

- `parser-generator.js`: CLI entry point for generation.
- `grammar-parser.js`: Parses grammar XML into internal structures.
- `code-generator.js`: Selects a target backend and walks the parsed grammar.
- `templates/javascript.js`: JavaScript lexer/parser templates.
- `templates/cpp98.js`: C++98 parser/token-stream templates.
- `sample-grammar.ebnf`: Example grammar.
- `build.sh`: Example generation pipeline.
- `tests/unit`: Unit tests for parser and generator internals.
- `tests/integration`: End-to-end tests for generated parser behavior.

---

## Requirements

- Node.js 18+ (tested on Node.js 24).

---

## Install

```bash
npm install
```

---

## Usage

### Recommended from repository root (via tREx)

For day-to-day usage, prefer the wrapper script at `bin/tREx.sh`:

```bash
bash bin/tREx.sh [options] <grammar-file> [output-parser-file]
```

Examples:

```bash
# XML -> parser
bash bin/tREx.sh parser-generator/examples/grammar.xml parser-generator/examples/arithmetic-parser.js

# EBNF -> XML -> parser
bash bin/tREx.sh --ebnf parser-generator/examples/sample-grammar.ebnf parser-generator/examples/arithmetic-parser.js

# EBNF -> XML only
bash bin/tREx.sh --ebnf --only-xml --to-xml parser-generator/examples/grammar.xml parser-generator/examples/sample-grammar.ebnf

# EBNF -> XML -> C++98 parser (scanner is supplied by the application)
bash bin/tREx.sh --ebnf --language cpp98 parser-generator/examples/sample-grammar.ebnf parser.cpp
```

### Direct usage inside parser-generator

Use these commands when working directly in this folder.

### 1) Generate parser from existing XML

```bash
node parser-generator.js grammar.xml my-parser.js
```

### 2) Typical flow from EBNF to parser

```bash
node REx.js examples/sample-grammar.ebnf > grammar.xml
node parser-generator.js grammar.xml arithmetic-parser.js

# Generate a C++98 parser from the same XML grammar
node parser-generator.js --language cpp98 grammar.xml arithmetic-parser.cpp
```

### 3) Self-hosting validation flow (REx grammar)

```bash
node REx.js ../grammar/REx.ebnf > rex-grammar.xml
node parser-generator.js rex-grammar.xml rex-parser.js
node -e "const fs=require('fs');const Parser=require('./rex-parser');const input=fs.readFileSync('../grammar/REx.ebnf','utf8');new Parser(input).parse();console.log('SELF_HOST_OK');"
```

### 4) Build commands (recommended)

```bash
# Full self-hosted build (promotes parser to rex-parser.js)
npm run build:selfhost

# Safe mode (does not overwrite rex-parser.js; writes candidate to rex-parser-next.js)
npm run build:safe
```

Behavior details:

- Default build uses a temporary candidate parser file for validation and then promotes it directly to `rex-parser.js`.
- No persistent "transition parser" file is kept in the default flow.
- `build:safe` (`--no-promote`) is the explicit review mode that writes `rex-parser-next.js` for manual inspection.

---

## Run tests

```bash
npm test
```

Useful subsets:

```bash
npm run test:unit
npm run test:integration
```

---

## Notes on generated parser behavior

- Lexer uses maximal munch (longest match).
- On equal length, skip tokens are preferred (to avoid exposing whitespace tokens).
- Parser uses backtracking for alternatives.
- Generated parser exposes:
  - `parse()`
  - `getErrorMessage()`

### Error Location Reporting With ParseTreeCollector

When using the default `parse-tree-collector.js`, you can wrap parsing with
`collector.parse(parser, inputLabel)` to get enriched syntax errors with
`line`, `column`, and `offset`.

Example:

```js
const Parser = require('./my-parser');
const { ParseTreeCollector } = require('./parse-tree-collector');

const input = '1 +\n* 2';
const collector = new ParseTreeCollector();
const parser = new Parser(input, collector);

try {
  collector.parse(parser, 'demo-input');
} catch (error) {
  console.error(error.message);
  // Parse failed for demo-input: ... at line X, column Y (offset Z)
}
```

If you call `parser.parse()` directly, parsing still works, but the thrown error
message is not enriched by the collector.

The C++98 backend emits prefixed `MAIACC_TOKEN_*` macros, `MaiaCCParserToken`,
`MaiaCCParseEvents`, `MaiaCCParserState`, `maiaCCParserStateInit()`, and free
`maiaCC_parse_*()` functions. Its input is a completed token array; it does not
include or generate a scanner. The event interface supports nonterminal/terminal
callbacks plus checkpoint/rollback so an application can build an AST or parse
tree. The top-level `maiaCC_parse(&state)` returns `bool`; the state exposes the
token pointer, count, and current position. The generated source uses C++98 and
requires exceptions enabled for backtracking (`throw int` / `catch (int)`).

The full test command includes a C++98 self-host integration test: MaiaCC's
JavaScript REx parser tokenizes `REx.ebnf`, then the generated C++ parser must
accept that token stream and reject an empty one. The test compiles with an
available native C++ compiler; it skips explicitly when none is installed.
This validates MaiaCC's generated source, not the downstream MaiaCpp pipeline,
which must consume MaiaCC through its synchronized in-repository submodule.

---

## Known limitations (current phase)

- Grammar contexts/lookaheads are still simplified vs full REx semantics.
- Some context-sensitive lexical behaviors may require additional stateful lexer modes.
- The C++98 backend has no lexer, formatted diagnostics, or automatic AST.
- MaiaCpp pipeline compatibility is a downstream integration check; the
  generator's C++ output is currently verified with a native C++98 compiler.

---

## Goal

Converge from REx-dependent generation to a native, extensible multi-backend generator while keeping the JavaScript backend stable.
