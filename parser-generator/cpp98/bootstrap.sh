#!/bin/sh
# Rebuild both generated parsers using an existing C++ generator generation.
# No JavaScript executable, emitter or XML library participates in this stage.
set -eu
if [ "$#" -ne 2 ]; then
    echo "Usage: sh cpp98/bootstrap.sh PREVIOUS_BUILD_DIRECTORY OUTPUT_DIRECTORY" >&2
    exit 1
fi
source_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "$source_directory/../.." && pwd)
previous_directory=$(CDPATH= cd -- "$1" && pwd)
mkdir -p -- "$2"
build_directory=$(CDPATH= cd -- "$2" && pwd)
if [ "$previous_directory" = "$build_directory" ]; then
    echo "Bootstrap generations must use different directories." >&2
    exit 1
fi
compiler=${CXX:-clang++}
"$previous_directory/REx-cpp98" "$repository_root/grammar/REx.ebnf" > "$build_directory/rex-grammar.xml"
"$previous_directory/MaiaCC-cpp98" --language cpp98 "$build_directory/rex-grammar.xml" "$build_directory/rex-parser.cpp"
"$previous_directory/REx-cpp98" "$source_directory/xml.ebnf" > "$build_directory/xml-grammar.xml"
"$previous_directory/MaiaCC-cpp98" --language cpp98 "$build_directory/xml-grammar.xml" "$build_directory/xml-parser.cpp"
"$compiler" -x c++ -std=c++98 -pedantic-errors -O1 \
    -I "$build_directory" -I "$repository_root/maiaregex" \
    "$source_directory/REx-main.cpp" "$repository_root/maiaregex/maia_regex.c" \
    -o "$build_directory/REx-cpp98"
"$compiler" -x c++ -std=c++98 -pedantic-errors -O1 \
    -I "$build_directory" -I "$repository_root/maiaregex" \
    "$source_directory/generator-main.cpp" "$repository_root/maiaregex/maia_regex.c" \
    -o "$build_directory/MaiaCC-cpp98"
