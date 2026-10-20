# Next Steps — after completed C++98 self-hosting

Date: 2026-10-20. The requested native and WASM bootstrap stage is COMPLETE and
published; no active acceptance test or propagation remains. Read
IMPLEMENTATION_STATUS.md for commits, commands, hashes and known limitations.

1. Profile the measured large-XML Regex cost. Preserve 38 semantic checks,
   independent differential reference and byte-identical generator corpus.
   Evaluate sparse/lazy memo storage against dense allocation before changing
   its cycle/assertion semantics; measure both peak memory and total work.
2. Add a fractional-return conformance case for pre-existing const-reference
   class-method type inference (Vec2:: dot). Its int/double signature mismatch
   reproduces before this stage; do not claim universal C++98 conformance.
3. Port legacy diagnostic/validation CLI options or general XML facilities only
   when required. JS remains the stable default; the C++98 core is parallel.
4. The MaiaOS shell now integrates the generated C++98 lexer/parser locally
   (2026-10-20):52 raw JS/native cases plus5356 JS/native/WASM differential inputs,
   1000 guest parses and actual LVGL rendering
   pass with18 guest memory pages. See the principal MaiaOS
   docs/SHELL_PARSER_INTEGRATION.md and docs/AGENT_HANDOFF.md. Further shell work
   concerns the documented POSIX grammar/execution gaps and browser verification;
   review pre-existing local MVP changes before any publication.
5. Shell lexer performance is now measured separately from parser/collector cost.
   See MaiaOS docs/SHELL_FRONTEND_PERFORMANCE.md: repeated dense Regex memo clears
   dominate the measured WASM lexer. No performance optimization has been applied.

Further changes follow the owning principal and synchronization protocol. The
completed stage performed no npm publication, version bump or history rewrite.
