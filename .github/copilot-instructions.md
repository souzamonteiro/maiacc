# Maia Workflow Requirements

For any MaiaCC change, this exact cross-repository order is mandatory:

1. MaiaCC: regenerate parser, run full test suite, commit and push.
2. MaiaWASM: pull MaiaCC submodule, regenerate parser, run full test suite, commit and push.
3. MaiaC: pull MaiaCC and MaiaWASM submodules, regenerate parser, run full test suite, compile test.c, validate output, commit and push.
4. MaiaCpp: pull MaiaCC, MaiaWASM, and MaiaC submodules, regenerate parser, run full test suite, commit and push.
5. MaiaJS: pull MaiaCC, MaiaWASM, MaiaC, and MaiaCpp submodules.

MaiaJS parser changes must be EBNF-first:

1. Edit grammar/EcmaScript.ebnf.
2. Regenerate parser artifacts via tREx.
3. Never hand-edit compiler/ecmascript-parser.js.

Reference: docs/Maia_Ecosystem_Synchronization_Protocol.md
