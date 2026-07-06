# Maia Ecosystem Synchronization Protocol

This protocol is mandatory for every cross-repository change in the Maia Suite.

## Scope

The suite is synchronized in this exact order:

1. MaiaCC
2. MaiaWASM
3. MaiaC
4. MaiaCpp
5. MaiaJS

## Core Rule

Edit only the principal repository that owns the change.

After the principal repository is validated, committed, and pushed, update the projects that depend on it by pulling the new commit into their submodules and committing the new submodule pointer in the parent repository.

Do not develop or validate the downstream project against a sibling checkout outside the repository. Every repository in the suite must build, regenerate parsers, assemble, and validate using its own in-repo submodules.

## Submodule Sync Enforcement (Mandatory)

1. Apply code changes in the owning principal repository only; do not commit feature/fix changes directly inside a downstream submodule checkout.
2. After pushing the principal repository, go to each downstream principal repository and run `./git_pull.sh` from repository root.
3. Commit the resulting submodule pointer update in the downstream parent repository.
4. Execute downstream tests only after this pull-and-pointer-update sequence.

Examples:

1. MaiaJS must use `./maiacpp`, `./maiac`, `./maiawasm`, and `./maiacc` from inside the MaiaJS repository.
2. MaiaCpp must use `./maiac`, `./maiawasm`, and `./maiacc` from inside the MaiaCpp repository.
3. MaiaC must use `./maiawasm` and `./maiacc` from inside the MaiaC repository.
4. MaiaWASM must use `./maiacc` from inside the MaiaWASM repository.

## Mandatory Workflow

Follow this exact sequence.

### 1. MaiaCC

1. Change only the MaiaCC principal repository.
2. Regenerate the MaiaCC-owned generated artifacts.
3. Run the MaiaCC full test suite.
4. Commit and push MaiaCC.

### 2. MaiaWASM

1. In the MaiaWASM principal repository, update the `maiacc` submodule to the desired MaiaCC commit.
2. If the WAT parser changed, edit only `grammar/WAT.ebnf` in MaiaWASM.
3. Regenerate MaiaWASM parser artifacts using `./maiacc/bin/tREx.sh` from the MaiaWASM repository.
4. Run the MaiaWASM full test suite using the MaiaWASM repository and its in-repo submodules only.
5. Commit and push MaiaWASM, including the updated `maiacc` submodule pointer when applicable.

### 3. MaiaC

1. In the MaiaC principal repository, update the `maiacc` and `maiawasm` submodules to the desired commits.
2. If the C parser changed, edit only the MaiaC grammar source.
3. Regenerate MaiaC parser artifacts using the MaiaC repository and its `./maiacc` submodule.
4. Run the MaiaC full test suite.
5. Compile `compiler/examples/test.c` and validate the produced output.
6. Commit and push MaiaC, including updated submodule pointers.

### 4. MaiaCpp

1. In the MaiaCpp principal repository, update the `maiacc`, `maiawasm`, and `maiac` submodules to the desired commits.
2. If the C++ parser changed, edit only `grammar/Cpp.ebnf` in MaiaCpp.
3. Regenerate MaiaCpp parser artifacts using `./maiacc/bin/tREx.sh` from the MaiaCpp repository.
4. Run the MaiaCpp full test suite using MaiaCpp's own submodules only.
5. Commit and push MaiaCpp, including updated submodule pointers.

### 5. MaiaJS

1. In the MaiaJS principal repository, update the `maiacc`, `maiawasm`, `maiac`, and `maiacpp` submodules to the desired commits.
2. If the MaiaJS parser changed, edit only `grammar/EcmaScript.ebnf` in MaiaJS.
3. Regenerate MaiaJS parser artifacts using `./maiacc/bin/tREx.sh` from the MaiaJS repository.
4. Run MaiaJS tests and validation commands using MaiaJS's own submodules only.
5. Commit and push MaiaJS, including updated submodule pointers.

## Parser Rule (Critical)

Never hand-edit generated parser files.

For every suite repository:

1. Edit the owning EBNF grammar file.
2. Regenerate the derived parser artifacts with the repository's in-repo `./maiacc/bin/tREx.sh`.
3. Re-run the repository-local parser/compiler tests.

If a parser changes in an upstream repository, downstream repositories do not patch that upstream generated parser by hand. They must pull the upstream repository as a submodule update and then run their own validations.

## Submodule Rule (Critical)

Normal build and validation entry points must prefer the repository-local submodule and fail clearly when the required submodule is missing.

Sibling checkouts outside the repository root may be used for manual development of the principal repositories themselves, but not as implicit dependencies during downstream builds.

## Definition Of Done

Do not consider the change complete until:

1. The owning principal repository has been changed first.
2. Downstream repositories have consumed the change through updated submodule pointers in the required order.
3. All required parser regenerations are complete.
4. All repository-local test suites pass.
5. Required commits and pushes are complete.
