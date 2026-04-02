#!/bin/bash
# tREx (Template Based REx Compatible Parser Generator) - Parser Generator Script
# This script converts EBNF grammar to XML (if needed) and generates a JavaScript parser using the REx tool and the parser generator.

show_usage() {
    echo "Usage: $0 [options] <grammar-file> [output-parser-file]"
    echo
    echo "Options:"
    echo "  --ebnf                 Treat <grammar-file> as EBNF and convert it to XML first"
    echo "  --xml                  Treat <grammar-file> as XML grammar (default)"
    echo "  --to-xml <xml-file>    XML output path when using --ebnf"
    echo "  --only-xml             Convert EBNF to XML only, do not generate parser"
    echo "  -h, --help             Show this help message"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install it to run this script."
    exit 1
fi

# Resolve project paths from this script location so execution works from any cwd.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REX_JS="$PROJECT_ROOT/parser-generator/REx.js"
PARSER_GENERATOR_JS="$PROJECT_ROOT/parser-generator/parser-generator.js"

if [ ! -f "$REX_JS" ] || [ ! -f "$PARSER_GENERATOR_JS" ]; then
    echo "Required parser generator files were not found relative to '$SCRIPT_DIR'."
    exit 1
fi

INPUT_FORMAT="xml"
FORMAT_EXPLICIT="false"
ONLY_XML="false"
XML_OUTPUT_FILE=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        --ebnf)
            INPUT_FORMAT="ebnf"
            FORMAT_EXPLICIT="true"
            shift
            ;;
        --xml)
            INPUT_FORMAT="xml"
            FORMAT_EXPLICIT="true"
            shift
            ;;
        --only-xml)
            ONLY_XML="true"
            shift
            ;;
        --to-xml)
            if [ -z "$2" ]; then
                echo "Missing value for --to-xml."
                show_usage
                exit 1
            fi
            XML_OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

if [ "$#" -lt 1 ]; then
    show_usage
    exit 1
fi

GRAMMAR_FILE="$1"
OUTPUT_FILE="${2:-parser.js}"

# If format is not explicitly provided, infer from grammar file extension.
if [ "$FORMAT_EXPLICIT" = "false" ]; then
    case "$GRAMMAR_FILE" in
        *.ebnf|*.EBNF)
            INPUT_FORMAT="ebnf"
            ;;
        *)
            INPUT_FORMAT="xml"
            ;;
    esac
fi

if [ ! -f "$GRAMMAR_FILE" ]; then
    echo "Grammar file '$GRAMMAR_FILE' not found."
    exit 1
fi

if [ "$ONLY_XML" = "true" ] && [ "$INPUT_FORMAT" != "ebnf" ]; then
    echo "The --only-xml option requires --ebnf."
    exit 1
fi

if [ -n "$XML_OUTPUT_FILE" ] && [ "$INPUT_FORMAT" != "ebnf" ]; then
    echo "The --to-xml option requires --ebnf."
    exit 1
fi

if [ "$INPUT_FORMAT" = "ebnf" ]; then
    if [ -z "$XML_OUTPUT_FILE" ]; then
        if [ "${GRAMMAR_FILE%.*}" = "$GRAMMAR_FILE" ]; then
            XML_OUTPUT_FILE="${GRAMMAR_FILE}.xml"
        else
            XML_OUTPUT_FILE="${GRAMMAR_FILE%.*}.xml"
        fi
    fi

    echo "Converting EBNF to XML: '$GRAMMAR_FILE' -> '$XML_OUTPUT_FILE'"
    if ! node "$REX_JS" "$GRAMMAR_FILE" > "$XML_OUTPUT_FILE"; then
        rm -f "$XML_OUTPUT_FILE"
        echo "Failed to convert EBNF to XML."
        exit 1
    fi

    if [ "$ONLY_XML" = "true" ]; then
        echo "XML file created: '$XML_OUTPUT_FILE'"
        exit 0
    fi

    GRAMMAR_XML_FILE="$XML_OUTPUT_FILE"
else
    GRAMMAR_XML_FILE="$GRAMMAR_FILE"
fi

echo "Generating parser: '$GRAMMAR_XML_FILE' -> '$OUTPUT_FILE'"
node "$PARSER_GENERATOR_JS" "$GRAMMAR_XML_FILE" "$OUTPUT_FILE"
