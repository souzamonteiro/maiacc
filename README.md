# MaiaCC tREx

`tREx.sh` is a wrapper script that can:

- Generate a parser from an XML grammar.
- Accept an EBNF grammar, convert it to XML first, then generate a parser.
- Convert EBNF to XML only (without generating a parser).

The script is located at `bin/tREx.sh`.

For parser-generator internals and self-host details, see `parser-generator/README.md`.

## Requirements

- Node.js 18+ (tested on Node.js 24).

## Usage

Run from the project root so relative paths resolve correctly.

```bash
bash bin/tREx.sh [options] <grammar-file> [output-parser-file]
```

### Options

- `--ebnf` Treat `<grammar-file>` as EBNF and convert it to XML first.
- `--xml` Treat `<grammar-file>` as XML grammar (default).
- `--to-xml <xml-file>` Output XML path when using `--ebnf`.
- `--only-xml` Convert EBNF to XML only, do not generate parser.
- `-h`, `--help` Show help.

## Common examples

### 1) Generate parser from XML

```bash
bash bin/tREx.sh parser-generator/examples/grammar.xml parser-generator/examples/arithmetic-parser.js
```

### 2) Generate parser from EBNF

```bash
bash bin/tREx.sh --ebnf parser-generator/examples/sample-grammar.ebnf parser-generator/examples/arithmetic-parser.js
```

### 3) Convert EBNF to XML only

```bash
bash bin/tREx.sh --ebnf --only-xml --to-xml parser-generator/examples/grammar.xml parser-generator/examples/sample-grammar.ebnf
```

## Notes

- If `--ebnf` is used and `--to-xml` is omitted, the XML output is inferred from the input name.
- `--only-xml` requires `--ebnf`.
- `--to-xml` requires `--ebnf`.

## Related docs

- `parser-generator/README.md`: generator internals, self-host flow, and test commands.
