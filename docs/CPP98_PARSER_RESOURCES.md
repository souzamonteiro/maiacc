# Generated C++98 parser resource status

2026-11-02. Additive source contract; rebuild generated clients after regeneration.

`MaiaCCParserState.failed` remains a boolean for existing callers. The added
`resourceError` field distinguishes `MAIACC_PARSE_RESOURCE_NONE` (0),
`MAIACC_PARSE_RESOURCE_NOMEM` (1) and `MAIACC_PARSE_RESOURCE_LIMIT` (2).
State initialization and each `maiaCC_parse` reset it to NONE. Checked failure
memo size overflow sets LIMIT; a failed memo calloc sets NOMEM. Syntax failure
leaves NONE, preserving ordinary diagnostics and collector rollback. Temporary
memo allocation is released as before. No global allocator hook is introduced.

The JavaScript-hosted C++98 backend template and self-hosted C++98 generator
share the same generated template assets. JavaScript-language parser behavior
is unchanged. This does not change the ordered Regex API or add a total CPU/heap
limit to its generated lexer. Source ABI consumers must regenerate/recompile;
compiled binaries with an older parser-state layout must not be mixed.

Validation in the owner: `npm test` passes 118 tests with zero failures/skips,
including complete native bootstrap generations 0/1/2 and exact JS-hosted versus
C++-hosted emitter parity on both languages. The focused resource fixture passes
32 native C++98/ASan/UBSan checks after adding the size-width-specific overflow
case: `node --test parser-generator/tests/integration/cpp98-resources.test.js`.
It covers allocation failure, valid/invalid syntax, retry/reset, events rollback,
no retained memo, and UINT_MAX token-count overflow on a 32-bit target (64-bit
native correctly reports the injected allocation failure instead).

Strict MaiaCpp/C89/MaiaC/WASM execution of the same published fixture is a
consumer gate, run only after publication and synchronization of local submodules.
It is not claimed as already passed in this owner-only validation.
