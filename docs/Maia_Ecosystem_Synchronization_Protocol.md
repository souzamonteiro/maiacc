# Maia Ecosystem Synchronization Protocol

This protocol is mandatory whenever MaiaCC changes, regardless of change size.

## Mandatory Order Across Repositories

1. MaiaCC
2. MaiaWASM
3. MaiaC
4. MaiaCpp
5. MaiaJS

## Step 1: MaiaCC (This Repository)

1. Regenerate parser artifacts for the affected grammar.
2. Run the full MaiaCC test suite.
3. Commit and push.

## Step 2: MaiaWASM

1. Pull the MaiaCC submodule.
2. Regenerate parser artifacts.
3. Run all tests.
4. Commit and push.

## Step 3: MaiaC

1. Pull MaiaCC and MaiaWASM submodules.
2. Regenerate parser artifacts.
3. Run all tests.
4. Compile test.c and validate program output.
5. Commit and push.

## Step 4: MaiaCpp

1. Pull MaiaCC, MaiaWASM, and MaiaC submodules.
2. Regenerate parser artifacts.
3. Run all tests.
4. Commit and push.

## Step 5: MaiaJS

1. Pull MaiaCC, MaiaWASM, MaiaC, and MaiaCpp submodules.
2. If parser behavior changed, update MaiaJS parser from EBNF and regenerate parser artifacts.
3. Run MaiaJS parser/compiler tests.

## MaiaJS Parser Rule (Critical)

For MaiaJS parser changes, never hand-edit generated parser output.

1. Edit grammar/EcmaScript.ebnf.
2. Regenerate grammar/EcmaScript.xml and compiler/ecmascript-parser.js via tREx.
3. Re-run tests.
