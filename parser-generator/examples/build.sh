#!/usr/bin/env bash
set -euo pipefail

node ../REx.js sample-grammar.ebnf > grammar.xml
node ../parser-generator.js grammar.xml arithmetic-parser.js
