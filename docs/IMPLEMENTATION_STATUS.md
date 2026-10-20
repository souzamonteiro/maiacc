# Implementation Status — complete C++98 generator bootstrap

Verified: 2026-10-20. The complete native AND actual WASM generator bootstrap
stage is implemented, tested and published. The stable default remains JS.

## Published heads (all main)

| Repository | Commit |
|---|---|
| maiaregex | `b66a74b` |
| maiacc | `2dcd96c` |
| maiawasm | `63c562f` |
| maiac | `8104ea3` |
| maiacpp | `2998aa8` |
| maiajs | `ee01e58` |
| maiasql | `a1c8d1a` |
| maiaos | `306c1ee` |

MaiaCC `2141b28` implements the complete native port; 2dcd96c documents its guest
gate. MaiaC `213b14d` contains final compiler fixes; 8104ea3 records final pins.
MaiaCpp `0d376f0` fixes quoted-template allocation rewriting; 2998aa8 publishes the
complete guest bootstrap regression. Consumers recorded pins before tests;
MaiaOS `306c1ee` was published last. No npm, version change or history rewrite.

## Complete bootstrap acceptance — PASS

The unchanged C++98 frontend and XML/model/emitter compile via actual MaiaCpp
AST strict -> C89 -> MaiaC/MaiaWASM -> executable WASM using local submodules.
JS seeds generation zero and supplies comparison oracles. The preceding actual
guest pair recreates BOTH parser seeds for generation 1 and generation 2.
Parsing, matching, XML/model building and generation run inside the guest;
host imports provide only memory/transport and allocator forwarding.

All three complete generations pass. Both parser sources AND both WASM binaries are
byte-identical across all three. Final REx, XML, sample, WAT and shell EBNF/XML and
both output-language sources match the established JS reference exactly.
Malformed EBNF/XML rejection and guest stack restoration pass; 24 actual memory
growths are exercised. Emitted C++ parsers execute in successive generations;
JS source parity and native emitted arithmetic-JS execution are verified.

| Artifact (identical in generations 0, 1 and 2) | Bytes | SHA-256 |
|---|---:|---|
| rex-parser.cpp | 109370 | `2d66d80ed97ee9147c8112d998dde09324a3ae4511e7a578d7a5777c1e109c96` |
| xml-parser.cpp | 31658 | `866bf0706b933eb1fc34a9f0affe2dd7441618478b50fa11e6d8cb61b64205dc` |
| frontend.wasm | 1148192 | `53b9f7d21ab6195c69f2cdf738804a8c839f525a7962cac8214d6d58be56a184` |
| generator.wasm | 1201953 | `1808c4f8b4384d80df452b58185c8f80524b2ea984a8c8e7decd7146d2073e26` |

## Verification

| Repository | Commands / verified results |
|---|---|
| MaiaRegex | Strict C89 ASan/UBSan and C++98: 38 checks and 100,000 differential comparisons each; legacy C tests: 61 pass; C++ tests: 25 pass. |
| MaiaCC | `npm test`: 114 pass; complete native generations 0, 1 and 2 stability, both output languages, forbidden-Node bootstrap, emitted arithmetic JS execution; native ASan/UBSan REx parity passes. |
| MaiaWASM | `npm test`, `npm run test:assembler` (41), `npm run test:proposals` (6), `npm run test:linker:static`: pass. |
| MaiaC | `npm test`: 43 groups pass. Includes actual WASM string, signedness, return-temporary, single-evaluation copy, pointer-indirection, allocator and frame regressions. |
| MaiaCpp | `npm test`, `npm run ready:full`, `npm run check:maiaCC-rex-wasm`: pass. `MAIACPP_SELFHOST_KEEP_TEMP=1 npm run check:maiaCC-selfhost-wasm`: complete pass. |
| MaiaJS | `npm run test:full`: 379 unit tests plus suite build/run, course and distribution pass on final pins. |
| MaiaSQL | `npm test`: 39 pass, one optional slow-regeneration skip; extra local-submodule native SQL generation produces identical XML/parser and executes284-token smoke. |
| MaiaOS | `npm test`: 19 pass on final pin; all 26 existing edited/untracked files retain original SHA-256. |

Final Git audit: 8 strict fsck checks pass; live origin/main refs match local
HEAD and tracking refs; 19 recursive graph gitlinks across8 unique snapshots
exist in their intended owners and are published ancestors. All 77 physical
recursive checkouts across the principals match recorded pins and are clean.
Staging is empty. CC's inherited expanded lexer test and four recovery notes
remain local; OS's pre-existing 26 edited/untracked files remain local. Other
principal working trees are clean. These notes are local recovery records.

## Scope and measured limitations

- JavaScript remains the default tool. The parallel C++98 core implements EBNF
  parsing/lexing, REx XML interchange/model construction, regex program building
  and both JS/Cpp98 emitters. General XML attributes/DTD and legacy diagnostic /
  validation CLI options are not ported; this is not complete CLI-option parity.
- The C89 syntax gate uses `-Wno-overlength-strings` only for compiled template
  assets beyond the standard's minimum required 509-character literal capacity.
  No C99 syntax is admitted by this gate.
- Full guest validation ran in Node 24.13.1 WebAssembly on desktop (~34 minutes).
  Auxiliary native/syntax checks used Apple Clang 21.0.0. This is not a Tab5
  resource-budget measurement or certification of MaiaWASMVM/WASM3.0 features.
- Large XML is expensive. WAT input of 16,427 bytes yields XML of 143,711 bytes. An isolated
  final guest frontend takes64.188s and 11,010,048 bytes linear memory; native
  frontend 0.53s. Native generator Cpp emission takes 8.18s. A temporary native
  calloc-counting probe, with identical output, observes 301,136 Regex memo allocations,
  303,846,116,564 cumulative requested bytes and5,748,480 largest single request.
  Cumulative allocation is not simultaneous resident memory. Dense memoization
  is a measured optimization priority; this stage did not alter its design.
- General C++98 conformance is not proven by this corpus. Preservation review
  observed pre-existing `Vec2:: dot(const Vec2&) const` return-type inference as
  int despite double source, identically in70f1cf3/ecf82d1/0d376f0. Existing
  fixture integral values pass; a fractional-return regression/fix is a separate
  follow-up. This signature issue was not introduced by this stage.
- No shell execution, syscall/LVGL integration or device execution is certified
  by generator/source parity. Existing OS implementation work was preserved.

## Evidence retained outside repositories

- `/tmp/maiacpp-complete-selfhost-wasm-final.log`
- `/tmp/maiacpp-selfhost-final-stable-generations.json`
- `/var/folders/6p/871hys095mq5mm7078sqplx40000gn/T/maiacpp-selfhost-wasm-u8XmrZ`
- `/tmp/maia-selfhost-final-git-audit.json`
- `/tmp/maia-selfhost-final-working-trees.json`
- `/tmp/maiaos-existing-work-2w0ro173/manifest.json`
- `/tmp/maiacc-xml-allocation-profile/metrics.log`

Temporary evidence may expire; the published MaiaCpp test and native MaiaCC
build/bootstrap scripts reproduce the acceptance procedure from local pins.

## Earlier incoming snapshots — historical only

## Published Baseline

| Principal | Commit |
|---|---|
| MaiaRegex | 0f68726 |
| MaiaCC | dac6056 |
| MaiaWASM | c26a1b7 |
| MaiaC | 90c6c40 |
| MaiaCpp | 96ce0c1 |
| MaiaJS | f976aa8 |
| MaiaSQL | 6fb99b1 |
| MaiaOS | ff2735f |

All seven consumers were verified to pin MaiaRegex 0f68726. No npm release was performed.

## Verified Baseline Tests

- MaiaRegex: 32 program checks in strict C89, C++98, ASan/UBSan and actual MaiaC/WASM; legacy C61/C++25 checks passed.
- MaiaCC: npm test, 112 checks; npm run build; npm --prefix parser-generator run selfhost: test produced byte-identical JS parser regeneration. Native generated C++ independently scanned source and matched JavaScript tokens, spans, trees and syntax failures, including REx and shell corpora. npm pack --dry-run included runtime sources.
- MaiaWASM: npm test 10 cases; test: assembler 41; test: proposals 6; test: linker: static passed.
- MaiaC: npm test 34 suites; npm run test: maiaregex passed 32 guest checks; compiler/examples/test.c returned zero.
- MaiaCpp: npm test and npm run ready: full passed. Its published generated-parser WASM test still used caller-provided tokens, not generated lexing.
- MaiaJS: npm run test: full passed, including dist execution returning zero.
- MaiaSQL: npm test 39 passed, 1 optional slow-regeneration test skipped.
- MaiaOS: npm test 19 passed. Existing shell/LVGL/browser edits were preserved outside the dependency-only commit.

## Current Uncommitted Work

Last successful git-status check confirmed:

- MaiaRegex: maia_regex.c and test_regex_program.c modified for memoization/cycle semantics and allocation checks.
- MaiaCC: parser-generator/tests/integration/cpp98-lexer.test.js modified with additional differential regex families.
- MaiaCpp: compiler/cpp-compiler.js and compiler/tests/test-maiacc-cpp98-parser-wasm.js modified for typedefs, aggregate initialization and raw-text lexer WASM testing.

Before the runtime patch, expanded differential families matched JavaScript using the pinned old runtime. New C cycle-contract tests reported 35 checks, 2 failures for recursive positive/negative assertions.

The latest runtime patch separates UNVISITED/VISITING/FAILED, tracks cycle-dependent results, rejects assertion-crossing cycles, and checks initial frame-allocation overflow. Three context-sensitive memo tests were added. The subsequent sanitizer/C++98 command returned unknown tool outcome: DO NOT claim this patch passes.

The raw-text MaiaCpp regression last returned guest code 4 (lexer failure). Global initializer preservation and typedef resolution were observed in emitted C. A later local aggregate-initializer patch has NOT been validated. Tests are intentionally still pending; do not weaken them.

## Not Complete

- Correctness and documentation of the revised cycle policy; proof/counterexamples for memo context independence.
- Full generated lexer/collector in C++ -> C89 -> WASM, including callback declarators and aggregate data.
- C++98 ports of code-generator.js, parse-tree-collector.js, parser-generator.js and REx.js.
- Successive stable C++ bootstrap generations and the same self-hosting tests in WASM.
- Rebuilding/integrating the pending MaiaOS shell with that complete generated guest lexer.
