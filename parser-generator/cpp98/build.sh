#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
    echo "Usage: sh parser-generator/cpp98/build.sh OUTPUT_DIRECTORY" >&2
    exit 1
fi
source_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "$source_directory/../.." && pwd)
mkdir -p -- "$1"
build_directory=$(CDPATH= cd -- "$1" && pwd)
compiler=${CXX:-clang++}
if [ ! -f "$repository_root/maiaregex/maia_regex.c" ]; then
    echo "Missing repository-local maiaregex submodule; initialize it recursively." >&2
    exit 1
fi
bash "$repository_root/bin/tREx.sh" --ebnf --language cpp98 \
    --to-xml "$build_directory/rex-grammar.xml" \
    "$repository_root/grammar/REx.ebnf" "$build_directory/rex-parser.cpp"
bash "$repository_root/bin/tREx.sh" --ebnf --language cpp98 \
    --to-xml "$build_directory/xml-grammar.xml" \
    "$source_directory/xml.ebnf" "$build_directory/xml-parser.cpp"
"$compiler" -x c++ -std=c++98 -pedantic-errors -O1 \
    -I "$build_directory" -I "$repository_root/maiaregex" \
    "$source_directory/REx-main.cpp" "$repository_root/maiaregex/maia_regex.c" \
    -o "$build_directory/REx-cpp98"
echo "Built $build_directory/REx-cpp98"
"$compiler" -x c++ -std=c++98 -pedantic-errors -O1 \
    -I "$build_directory" -I "$repository_root/maiaregex" \
    "$source_directory/generator-main.cpp" "$repository_root/maiaregex/maia_regex.c" \
    -o "$build_directory/MaiaCC-cpp98"
echo "Built $build_directory/MaiaCC-cpp98"
