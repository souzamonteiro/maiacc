#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_usage() {
	echo "Usage: bash build.sh [options] [input-ebnf-file]"
	echo
	echo "Options:"
	echo "  --no-promote    Generate and validate parser, but do not overwrite rex-parser.js"
	echo "  -h, --help      Show this help message"
}

NO_PROMOTE="false"
INPUT_EBNF=""

while [ "$#" -gt 0 ]; do
	case "$1" in
		--no-promote)
			NO_PROMOTE="true"
			shift
			;;
		-h|--help)
			show_usage
			exit 0
			;;
		-*)
			echo "Unknown option: $1"
			show_usage
			exit 1
			;;
		*)
			if [ -n "$INPUT_EBNF" ]; then
				echo "Unexpected extra argument: $1"
				show_usage
				exit 1
			fi
			INPUT_EBNF="$1"
			shift
			;;
	esac
done

INPUT_EBNF="${INPUT_EBNF:-$SCRIPT_DIR/../grammar/REx.ebnf}"
OUTPUT_XML="$SCRIPT_DIR/rex-grammar-selfhost.xml"
OUTPUT_PARSER_TMP="$SCRIPT_DIR/rex-parser-next.js"
OUTPUT_PARSER_FINAL="$SCRIPT_DIR/rex-parser.js"

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js is not installed. Please install it to run this build."
	exit 1
fi

if [ ! -f "$INPUT_EBNF" ]; then
	echo "Input EBNF file not found: $INPUT_EBNF"
	exit 1
fi

echo "[1/4] Generating XML from EBNF (self-hosted REx)..."
node "$SCRIPT_DIR/REx.js" "$INPUT_EBNF" > "$OUTPUT_XML"

echo "[2/4] Generating parser from XML..."
node "$SCRIPT_DIR/parser-generator.js" "$OUTPUT_XML" "$OUTPUT_PARSER_TMP"

echo "[3/4] Validating generated parser..."
node -e "const fs=require('fs'); const Parser=require('$OUTPUT_PARSER_TMP'); const input=fs.readFileSync('$INPUT_EBNF','utf8'); new Parser(input).parse(); console.log('Validation OK: generated parser parsed the input grammar.');"

if [ "$NO_PROMOTE" = "true" ]; then
	echo "[4/4] No promote mode enabled. Keeping generated parser as rex-parser-next.js"
else
	echo "[4/4] Promoting generated parser to rex-parser.js..."
	mv -f "$OUTPUT_PARSER_TMP" "$OUTPUT_PARSER_FINAL"
fi

echo "Build completed successfully."
echo "Generated XML: $OUTPUT_XML"
if [ "$NO_PROMOTE" = "true" ]; then
	echo "Generated parser (not promoted): $OUTPUT_PARSER_TMP"
else
	echo "Generated parser: $OUTPUT_PARSER_FINAL"
fi