# MaiaCC Parser Generator (JavaScript)

A JavaScript parser generator that reads XML produced from EBNF grammars and emits a working JavaScript lexer/parser.

This project is being evolved to replace REx usage in this repository workflow and to support scalable multi-language generation in the future.

## Current status

- Generates JS parsers from EBNF-derived XML.
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
- `code-generator.js`: Generates lexer/parser JavaScript code.
- `templates/javascript.js`: Output templates for generated parser code.
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

---

## Known limitations (current phase)

- Grammar contexts/lookaheads are still simplified vs full REx semantics.
- Some context-sensitive lexical behaviors may require additional stateful lexer modes.
- This generator currently targets JavaScript output only.

---

## Goal

Converge from REx-dependent generation to a fully native and extensible JS-based generator, then expand to additional output languages.
