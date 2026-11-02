# Additive BRE library synchronization

2026-11-02. This consumer records published MaiaRegex8a1dcbf. The original
ordered lexer runtime sources/API are byte-identical; the new UTF-8 BRE API is
separate. No generator/template/grammar change is part of this synchronization.

The root git_pull.sh completed before the gitlink was committed, then npm test
passed118 tests, zero failures/skips. Development-only tools/maiacpp in Regex
is intentionally uninitialized (`update = none`). This preserves its exact
historical bootstrap and prevents remote recursion into a self-dependency.
The recorded toolchain commit is published and independently verified by the
principal Regex bootstrap audit; consumers use their own normal dependencies.

No npm, version or history changes. No new BRE execution is claimed by these
ordered-lexer regression tests; BRE acceptance is recorded in its owner repo.
