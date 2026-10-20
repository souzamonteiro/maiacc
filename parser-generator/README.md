# MaiaCC Parser Generator

A parser generator that reads XML produced from EBNF grammars and emits a JavaScript or C++98 lexer/parser. JavaScript remains the default backend.

Both backends use the same selected lexical patterns and ordering. The C++98 backend generates a UTF-8 scanner and retains the caller-provided token-stream API for existing integrations.

A parallel [C++98 frontend, grammar model and complete generator](cpp98/README.md)
reproduce the JavaScript reference's XML and both emitted languages. Two further
complete native generations use only their preceding C++ executables and retain
identical parser sources. The full generator WASM bootstrap remains a separate
validation gate. The established JavaScript CLI is still the default.

## Current status

- Generates JavaScript lexer/parsers from EBNF-derived XML.
- Generates C++98 lexer/parser functions and prefixed token-ID macros from the same grammar model.
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
- `templates/cpp98-lexer.js`: Lexical-pattern compiler and C++98 scanner runtime template.
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

# EBNF -> XML -> C++98 lexer/parser
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

### C++98 Input And Events

The C++98 backend emits prefixed `MAIACC_TOKEN_*` macros, `MaiaCCParserToken`,
`MaiaCCParseEvents`, lexer/parser states and free functions. Generate the source
with `--language cpp98`, then include it in the consumer's translation unit.
The generated lexer uses the MaiaRegex C89 runtime from the pinned `maiaregex`
submodule. Initialize clones with `git submodule update --init --recursive`.
The npm package also includes `maiaregex/maia_regex.h` and `maia_regex.c`.
Compile/link that source and add its directory to the include path, for example:

```bash
c++ -std=c++98 -I maiaregex application.cpp maiaregex/maia_regex.c -o application
```

```cpp
MaiaCCParserToken tokens[1024];
MaiaCCLexerState lexer;
maiaCCLexerStateInit(&lexer, source, sourceByteLength);
if (maiaCCLexerTokenize(&lexer, tokens, 1024)) {
  MaiaCCParserState parser;
  maiaCCParserStateInit(&parser, tokens, lexer.tokenCount, 0);
  bool accepted = maiaCC_parse(&parser);
}
```

The token capacity includes EOF. Token `value` points into the original UTF-8
source, which must remain alive while tokens are used. Token `length` and lexer
`bytePosition` count bytes; token `start`/`end` and lexer `position` count UTF-16
code units, matching JavaScript offsets. Invalid UTF-8 is rejected. Lexer
`failed` is 0 on success, 1 for invalid/unmatched input, 2 for allocation or size
failure, and 3 for insufficient token capacity. No partial token stream should
be parsed after failure. States can be reused by calling tokenize again.

The scanner generates ordered pattern instructions from the shared lexical
patterns, including greedy/lazy repetition, classes, lookahead, skip and
priority rules, character-class preferences and template-interpolation modes.
Unsupported pattern constructs fail generation instead of silently broadening
the accepted language. Scanner scratch storage and parser failure memoization
use standard allocation functions. Pattern matching is iterative and lives in
MaiaRegex; grammar traversal is recursive. Input size and grammar nesting must
fit the target's memory and stack limits. The generated scanner currently uses
the runtime without caller-imposed limits; the standalone MaiaRegex API also
supports finite memo-memory, frame and work limits.

Existing applications can still pass their own completed token arrays directly
to `maiaCCParserStateInit()`. `maiaCC_parse()` returns `bool`, accepts an optional
trailing EOF when the start rule does not consume it, and does not require C++
exceptions. State fields `errorCount`, `errorPosition`, `expectedToken` and
`foundToken` retain the first failed expectation, including speculative failures
as in JavaScript; `errorPosition` is a token-array index, not a source offset.
Always use the returned result to decide success, not `errorCount` alone.

The event interface supports nonterminal/terminal callbacks and checkpoint/
rollback for application-owned trees. Contextual `^token` matching uses the
generated lexical patterns and still supports an optional application callback.

The full suite compares tokens, source spans, complete event trees and first
syntax errors from independently scanned C++/JavaScript source corpora, including
REx self-hosting and a shell grammar. It retains the legacy pre-tokenized test.
Tests use a native C++98 compiler and skip explicitly if none is available.
Downstream MaiaCpp/WASM compatibility remains a separate integration gate using
each consumer's synchronized in-repository submodules.

---

## Known limitations (current phase)

- Grammar contexts/lookaheads are still simplified vs full REx semantics.
- Some context-sensitive lexical behaviors may require additional stateful lexer modes.
- The C++98 backend exposes numeric diagnostics and tree events, not formatted
  line/column messages or an automatically allocated AST.
- MaiaCpp pipeline compatibility is a downstream integration check; the
  generator's C++ output is currently verified with a native C++98 compiler.

---

## Goal

Converge from REx-dependent generation to a native, extensible multi-backend generator while keeping the JavaScript backend stable.
