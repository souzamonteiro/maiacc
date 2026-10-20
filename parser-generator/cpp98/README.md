# C++98 MaiaCC bootstrap

This directory starts the parallel C++98 implementation. JavaScript remains
the default and the behavioral reference. All syntax and lexical rules come
from `grammar/REx.ebnf`, generated through MaiaCC/tREx. The frontend uses the
repository-local MaiaRegex instruction runtime. No handwritten EBNF scanner or
parser, STL dependency, JS matching or JS XML serialization is used at runtime.

Implemented here:

- `parse-tree-collector.hpp`: ordered tree-event journal with constant-size
  checkpoints, rollback, sticky allocation errors and XML serialization.
- `REx.cpp`: input-buffer to XML frontend using the generated lexer/parser.
- `REx-main.cpp`: separate native file/literal-input and output transport.
- `build.sh`: JavaScript-seeded native bootstrap; generated artifacts stay in
  the explicitly selected build directory.

```sh
sh parser-generator/cpp98/build.sh /tmp/maiacc-cpp98-build
/tmp/maiacc-cpp98-build/REx-cpp98 grammar/REx.ebnf > /tmp/rex-cpp98.xml
npm --prefix parser-generator run test:cpp98-frontend
```

The regression compares XML byte for byte with `REx.js` on REx, WAT, shell,
sample grammar, BOM/CRLF/escaped text and rejected inputs. It uses native XML
to seed a second generated C++ lexer/parser and requires identical parser source
and XML. The JavaScript **code generator** still creates both parser seeds.
That emitter must be ported before claiming a completely C++ self-hosted MaiaCC.

The collector stores references into the live input and generated parser labels.
Serialize before releasing the input. Its XML traversal is iterative, while the
generated parser uses recursive grammar calls. Allocation failure remains sticky
across parser rollback. The native CLI supports multiple files, literal inputs
in braces, and the compatibility `-i` flag. Legacy REx validation and formatted
source-location diagnostics have not been ported to this CLI.

Still required: C++ grammar-model construction and code generation, complete CLI
parity, self-generation without the JavaScript emitter, and the same bootstrap
executed through MaiaCpp -> C89 -> MaiaC -> WebAssembly. Native frontend parity
does not certify any of those later gates or complete shell execution.
