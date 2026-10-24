# C++98 MaiaCC generator and bootstrap

This directory contains the parallel C++98 implementation. JavaScript remains
the default and the behavioral reference. All syntax and lexical rules come
from `grammar/REx.ebnf`, generated through MaiaCC/tREx. The frontend uses the
repository-local MaiaRegex instruction runtime. No handwritten EBNF scanner or
parser, STL dependency, JS matching or JS XML serialization is used at runtime.

Implemented here:

- `parse-tree-collector.hpp`: ordered tree-event journal with constant-size
  checkpoints, rollback, sticky allocation errors and XML serialization.
- `REx.cpp`: input-buffer to XML frontend using the generated lexer/parser.
- `REx-main.cpp`: separate native file/literal-input and output transport.
- `xml.ebnf` / `xml-input.cpp`: generated XML input parser and semantic tree
  adapter for the REx XML interchange format (elements, text, declaration,
  predefined and numeric entities, BOM and document whitespace). This is not
  a general XML/DTD/attribute-processing library.
- `grammar-model.hpp`: grammar rules, lexical patterns, quantifiers, contexts,
  whitespace options, lexical differences and preferences.
  Positive lexical `A & B` context is retained as a typed assertion and emitted
  without consuming B, identically to the JavaScript grammar model/generator.
- `code-generator.hpp`, `regex-compiler.hpp`, `source-emitter.hpp`: grammar
  traversal, ordered MaiaRegex program construction and both output backends.
- `model.hpp`: invocation arena and length-bearing text/buffer storage.
- `template-assets.hpp`: C++ source data for the established backend templates.
  `node parser-generator/cpp98/template-assets.js --check` verifies source parity;
  the native generator never runs that development-time synchronization tool.
- `generator.cpp` / `generator-main.cpp`: XML-buffer generation and native file
  transport; the default output language remains JavaScript.
- `build.sh`: generation zero, using JavaScript to emit the two parser seeds.
- `bootstrap.sh`: later complete native generations, using only the preceding
  C++ executables, EBNF and C++ sources. Generated artifacts stay in the
  explicitly selected build directories.

```sh
sh parser-generator/cpp98/build.sh /tmp/maiacc-cpp98-build
/tmp/maiacc-cpp98-build/REx-cpp98 grammar/REx.ebnf > /tmp/rex-cpp98.xml
/tmp/maiacc-cpp98-build/MaiaCC-cpp98 --language cpp98 /tmp/rex-cpp98.xml /tmp/rex-parser.cpp
sh parser-generator/cpp98/bootstrap.sh /tmp/maiacc-cpp98-build /tmp/maiacc-cpp98-generation-1
sh parser-generator/cpp98/bootstrap.sh /tmp/maiacc-cpp98-generation-1 /tmp/maiacc-cpp98-generation-2
sh bin/tREx-cpp98.sh --build-dir /tmp/maiacc-cpp98-generation-2 --ebnf \
  --to-xml /tmp/sample.xml --language cpp98 \
  parser-generator/examples/sample-grammar.ebnf /tmp/sample-parser.cpp
npm --prefix parser-generator run test:cpp98-generator
```

The frontend regression compares XML byte for byte with `REx.js`. The complete
generator regression compares both output languages against the JavaScript
reference on REx, XML, WAT, shell, arithmetic and additional lexical/Unicode
grammars, including formatted XML. It then rebuilds the complete native pair
twice and requires stable parser sources and XML. A failing `node` executable
heads PATH during the native bootstrap/wrapper checks. Generated JavaScript is
executed on accepted/rejected arithmetic input, and malformed XML must fail
without overwriting an existing output file.

The collector stores references into the live input and generated parser labels.
Serialize before releasing the input. Its XML traversal is iterative, while the
generated parser uses recursive grammar calls. Allocation failure remains sticky
across parser rollback. The native CLI supports multiple files, literal inputs
in braces, and the compatibility `-i` flag. Legacy REx validation and formatted
source-location diagnostics have not been ported to this CLI.

The complete WebAssembly bootstrap gate belongs to the principal MaiaCpp
repository and uses its own published MaiaCC, MaiaC, MaiaWASM and MaiaRegex
submodules:

```sh
# From the principal MaiaCpp repository, after protocol synchronization:
MAIACPP_SELFHOST_KEEP_TEMP=1 npm run check:maiaCC-selfhost-wasm
```

It compiles the unchanged frontend and generator C++98 sources through MaiaCpp
to C89 and through MaiaC/MaiaWASM to executable WASM. JavaScript supplies only
generation-zero parser seeds and comparison oracles. Each subsequent generation
uses the preceding guest frontend and guest generator to recreate both parser
seeds; all three complete generations must reproduce the reference sources.
The final guest must match both emitted languages for REx, XML, WAT, shell and
the sample grammar, reject malformed input, restore its stack and exercise real
memory growth. Host imports provide memory transport, not parsing or emission.

The strict C89 syntax gate suppresses only the minimum string-length diagnostic
(`-Wno-overlength-strings`): compiled template assets exceed the C89 minimum
required 509-character literal capacity. No C99 syntax is required.
This bootstrap validates the generator and compiler pipeline on this corpus;
it does not certify every C++98/WebAssembly feature or MaiaOS shell execution.
Legacy REx diagnostic/validation CLI options and general XML features outside
the REx interchange format remain separate limitations. JavaScript remains the
stable default tool; the C++98 implementation is available alongside it.
