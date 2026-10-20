# Architecture And Contracts

Handoff date: 2026-10-19. Runtime: strict C89. Compiler target: C++98.

## Ownership

- MaiaCC owns EBNF/XML grammar processing and generated lexer/parser templates.
- MaiaRegex owns the reusable C89 instruction-program executor. MaiaCC compiles lexical patterns into its immutable instruction/range tables.
- MaiaCpp owns C++98 semantic analysis and C89 emission. MaiaC owns C89-to-WAT/WASM lowering and its C runtime libraries.
- MaiaWASM owns WAT assembly, validation and linking.
- JavaScript hosts may provide I/O and memory transport; they must not perform guest parsing, matching or generation as a substitute for WASM implementation.

## Parser And Regex Contracts

- EBNF is authoritative. Generate parsers and lexers exclusively through MaiaCC/tREx; never patch generated files or replace them with handwritten scanners.
- The MaiaCC pattern compiler constructs continuation-linked graphs directly, with Thompson-like ordered SPLIT branches; it does not determinize them.
- MaiaRegex matches UTF-16 units at an explicit start offset. END is absolute buffer end, not multiline matching. Branch priority is ordered, not POSIX longest-alternative selection.
- The program API is separate from legacy regcomp/regexec; the legacy textual API is not ECMAScript-compatible.
- Native generated C++ parity, pre-tokenized parser WASM tests, complete lexer WASM tests and generator self-hosting are distinct validation levels.

## Repository Discipline

Edit only the owning principal checkout under /Volumes/External_SSD/Documentos/Projects. Publish validated owner changes before consumers pull them. Never develop fixes inside maiaos/maiacpp or other dependency copies.

Follow [the synchronization protocol](Maia_Ecosystem_Synchronization_Protocol.md): MaiaCC, MaiaWASM, MaiaC, MaiaCpp, MaiaJS. MaiaRegex is a deeper dependency and must precede its consumers. MaiaSQL and MaiaOS also pin it directly.

After the consumer's git_pull.sh, intentional updates may require git submodule update --init --remote --recursive. Using only --init --recursive before recording new gitlinks can restore old parent pins. Record pointers before consumer tests. Preserve unrelated dirty work. Git publication does not authorize npm publication or version changes.

Read MaiaOS/AGENTS.md before related work. LVGL and actual MaiaOS syscall paths remain required; no UI or subsystem substitution is authorized.
## Complete C++98 bootstrap contract

The parallel generator's buffer entry point is
`maiaCCGenerateXml(input,length,cpp,&outputLength,&status)`; successful output
is caller-owned malloc data. Native transport is separate. XML syntax is
generated from cpp98/xml.ebnf; its adapter builds the REx interchange model.

Generation0 seeds REx/XML parsers via the stable JS tool. Generations1/2 recreate
both seeds using preceding actual C++ executables or WASM guest pairs. Guest
C++98 -> MaiaCpp AST strict -> C89 -> MaiaC/MaiaWASM compilation uses each
principal's local published submodules. The compiler tools themselves remain JS;
this stage self-hosts MaiaCC's core, not the entire suite's implementation.

The guest imports only memory/allocator transport. Parsing, matching, model
construction and both emitters remain guest responsibilities. Source and binary
stability and reference parity are required. Large-XML dense memo costs and
device/VM budgets remain measured limitations; see IMPLEMENTATION_STATUS.md.
