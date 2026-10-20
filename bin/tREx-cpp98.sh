#!/bin/sh
# Parallel native tool. The established tREx.sh remains the default JS tool.
set -eu
usage() {
    echo "Usage: sh $0 --build-dir DIRECTORY [--ebnf|--xml] [--to-xml FILE] [--only-xml] [--language javascript|cpp98] GRAMMAR [OUTPUT]"
}
build_directory=${MAIACC_CPP98_BUILD:-}
format=auto
language=javascript
xml_output=
only_xml=no
while [ "$#" -gt 0 ]; do
    case "$1" in
        --build-dir|--to-xml|--language)
            if [ "$#" -lt 2 ]; then usage >&2; exit 1; fi
            case "$1" in
                --build-dir) build_directory=$2 ;;
                --to-xml) xml_output=$2 ;;
                --language) language=$2 ;;
            esac
            shift 2 ;;
        --language=*) language=${1#--language=} ; shift ;;
        --ebnf) format=ebnf; shift ;;
        --xml) format=xml; shift ;;
        --only-xml) only_xml=yes; shift ;;
        -h|--help) usage; exit 0 ;;
        --) shift; break ;;
        -*) usage >&2; exit 1 ;;
        *) break ;;
    esac
done
if [ -z "$build_directory" ] || [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then usage >&2; exit 1; fi
case "$language" in javascript) default_output=parser.js ;; cpp98) default_output=parser.cpp ;; *) usage >&2; exit 1 ;; esac
grammar=$1
output=${2:-$default_output}
if [ "$format" = auto ]; then case "$grammar" in *.ebnf|*.EBNF) format=ebnf ;; *) format=xml ;; esac; fi
if [ "$format" = xml ] && { [ "$only_xml" = yes ] || [ -n "$xml_output" ]; }; then
    echo "--only-xml and --to-xml require EBNF input." >&2; exit 1
fi
temporary=
trap 'if [ -n "$temporary" ]; then rm -f -- "$temporary"; fi' EXIT HUP INT TERM
if [ "$format" = ebnf ]; then
    if [ -z "$xml_output" ]; then case "$grammar" in *.*) xml_output=${grammar%.*}.xml ;; *) xml_output=$grammar.xml ;; esac; fi
    temporary=$(mktemp "$xml_output.XXXXXX")
    "$build_directory/REx-cpp98" "$grammar" > "$temporary"
    mv -- "$temporary" "$xml_output"
    temporary=
    if [ "$only_xml" = yes ]; then exit 0; fi
    grammar=$xml_output
fi
"$build_directory/MaiaCC-cpp98" --language "$language" "$grammar" "$output"
