# MaiaCC C++98 handoff — stage complete

## Authorized local snapshot — 2026-10-20

The owner explicitly requested committing all pending MaiaCC and MaiaOS files.
This MaiaCC snapshot adds the four local recovery/architecture/status/next-step
documents and the expanded ordered Regex/cycle/assertion differential corpus in
cpp98-lexer.test.js. It changes no generator or runtime implementation. The
published bootstrap baseline remains 2dcd96c; historical published-head and dirty
work descriptions below refer to their recorded earlier stages.

This step creates local commits only. No push, npm release, version change or
consumer gitlink propagation is included. Publish/synchronize by protocol when
that step is requested. Shell performance has since been measured in MaiaOS;
see its docs/SHELL_FRONTEND_PERFORMANCE.md and current AGENT_HANDOFF.md.
Precommit `npm test`: 114 tests pass, zero failures. The earlier targeted
cpp98-lexer.test.js audit passed all 10 tests. No generated parser changes.

Verified: 2026-10-20. No active tests, publication or propagation remain.

## Objective and result

The user requested a complete parallel C++98 MaiaCC and actual full compiler
chain stress validation. Native and WASM frontend/model/both-emitter bootstrap
PASS, generations 0, 1 and 2 stable, both generated languages exact on all five corpus
cases, invalid-input/stack checks pass and24 real memory growths occur.
Default JS remains stable. Do not restart the completed port.

Read maiaos/AGENTS.md, ARCHITECTURE.md, IMPLEMENTATION_STATUS.md and the ecosystem
protocol on recovery. The user explicitly authorized full generator/compiler
fix publication and propagation without npm/versions/history changes. This
stage used no subagents and introduced no OS/UI architecture substitution.

## Published branches and pins

All principals main, HEAD=live origin/main:

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

CC `2141b28` contains complete native implementation; C `213b14d` final algorithm
fixes; Cpp `0d376f0` scoped allocation-lowering fix; 2998aa8 complete guest harness.
Final JS ee01e58 and OS `306c1ee` consume that harness commit; OS published last.
All eight fsck pass,19 graph pins published,77 actual checkouts clean/aligned.

## Implementation contracts

CC cpp98/model.hpp, grammar-model.hpp, xml.ebnf/xml-input.cpp,
regex-compiler.hpp, code-generator.hpp, source-emitter.hpp, template-assets.hpp,
generator.cpp/generator-main.cpp, build.sh/bootstrap.sh and bin/tREx-cpp98.sh
implement the parallel core. XML syntax comes from generated EBNF; semantic
adapter is not a handwritten markup parser. Template synchronization is dev-time
JS only; later native/guest generations do not execute a JS emitter.
`maiaCCGenerateXml(input,length,cpp,&length,&status)` returns owned malloc data.

C fixes: adjacent strings/escapes, static strings, unsigned literals, SRET frame
temporaries, once-only aggregate copies and struct-pointer indirection.
Cpp fixes: pointer levels/forward types, arrays/enums/loop scopes and preservation
of quoted templates/comments during allocation normalization. New regression448
catches the prior embedded '= new Set();' corruption. Do not work around these
in template source or generated parsers.

## Verification and evidence

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

Exact final trace: /tmp/maiacpp-complete-selfhost-wasm-final.log (PASS).
Three-generation source/binary hashes: /tmp/maiacpp-selfhost-final-stable-generations.json.
Guest artifacts: /var/folders/6p/871hys095mq5mm7078sqplx40000gn/T/maiacpp-selfhost-wasm-u8XmrZ.
Git audit: /tmp/maia-selfhost-final-git-audit.json; physical working trees:
/tmp/maia-selfhost-final-working-trees.json. Expanded details/hashes are in
IMPLEMENTATION_STATUS.md. Node 24.13.1/Apple Clang 21.0.0; desktop full gate ~34min.

## Preservation / local state

CC inherited parser-generator/tests/integration/cpp98-lexer.test.js is still
modified and the four recovery docs remain untracked/local. They were not swept
into feature commits. OS 26 prior edited/untracked files remain byte-identical,
manifest /tmp/maiaos-existing-work-2w0ro173/manifest.json. OS commits change ONLY
the MaiaCpp gitlink; do not discard or commit existing shell/LVGL/UI work blindly.
Other principals are clean; staging empty. C 115 and JS 106 tracked test outputs
were restored only after exact path/hash review against initially clean trees.
No force/reset/rebase/stash/clean/npm/version action occurred.

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

## Next safe action

The requested stage needs no continuation. For later work, follow NEXT_STEPS.md:
measure/reduce dense-memo XML costs, investigate the pre-existing method-return
conformance observation, or resume the owner's preserved shell integration.
Do not silently expand scope or infer device/VM/LVGL readiness from these tests.

## Later local MaiaOS integration — 2026-10-20

The owner subsequently requested the missing generated shell lexer/parser
integration. It is complete LOCALLY in principal maiaos on main306c1ee, with
no new publication. Actual generated C++98 lexing/parsing runs in the guest;
48 raw-input JS/native cases,20 OS unit tests,1000 guest parses with real LVGL
and stable18-page memory pass. Other apps' LVGL regression passes. Original
LVGL configuration and EBNF were preserved. Browser unavailable. Read the owner
maiaos/docs/AGENT_HANDOFF.md and SHELL_PARSER_INTEGRATION.md for current details;
do not restart this completed integration or confuse it with POSIX completeness.
