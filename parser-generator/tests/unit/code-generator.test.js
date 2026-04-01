'use strict';
// Tests for code-generator.js
// Run via: node --test tests/unit/code-generator.test.js

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs   = require('fs');
const path = require('path');

const CodeGenerator = require('../../code-generator');
const GrammarParser = require('../../grammar-parser');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal CodeGenerator instance (empty grammar) – enough to test pure methods. */
function makeGen() {
  return new CodeGenerator({ rules: new Map(), tokens: new Map(), startSymbol: 'S' });
}

/** Full CodeGenerator built from the committed grammar.xml. */
async function arithmeticGen() {
  const xml = fs.readFileSync(path.join(__dirname, '../../grammar.xml'), 'utf8');
  const grammar = await new GrammarParser(xml).parse();
  return new CodeGenerator(grammar);
}


// ─── escapeRegex ──────────────────────────────────────────────────────────────

describe('CodeGenerator.escapeRegex', () => {
  const gen = makeGen();

  it('escapes dot', () => assert.equal(gen.escapeRegex('.'), '\\.'));
  it('escapes star', () => assert.equal(gen.escapeRegex('*'), '\\*'));
  it('escapes plus', () => assert.equal(gen.escapeRegex('+'), '\\+'));
  it('escapes open paren', () => assert.equal(gen.escapeRegex('('), '\\('));
  it('escapes close paren', () => assert.equal(gen.escapeRegex(')'), '\\)'));
  it('escapes pipe', () => assert.equal(gen.escapeRegex('|'), '\\|'));
  it('escapes question mark', () => assert.equal(gen.escapeRegex('?'), '\\?'));
  it('leaves alphanumerics unchanged', () => assert.equal(gen.escapeRegex('abc123'), 'abc123'));
  it('result builds a valid RegExp', () => {
    assert.doesNotThrow(() => new RegExp(`^${gen.escapeRegex('+')}`));
  });
});


// ─── escapeCharClassContent ───────────────────────────────────────────────────

describe('CodeGenerator.escapeCharClassContent', () => {
  const gen = makeGen();

  it('escapes tab (\\x09) → \\u0009', () => {
    assert.equal(gen.escapeCharClassContent('\t'), '\\u0009');
  });
  it('escapes newline (\\x0A) → \\u000a', () => {
    assert.equal(gen.escapeCharClassContent('\n'), '\\u000a');
  });
  it('escapes carriage return (\\x0D) → \\u000d', () => {
    assert.equal(gen.escapeCharClassContent('\r'), '\\u000d');
  });
  it('leaves printable ASCII unchanged', () => {
    assert.equal(gen.escapeCharClassContent('a-zA-Z0-9'), 'a-zA-Z0-9');
  });
  it('leaves space unchanged', () => {
    assert.equal(gen.escapeCharClassContent(' '), ' ');
  });
  it('mixes control chars and printable correctly', () => {
    assert.equal(gen.escapeCharClassContent('\t '), '\\u0009 ');
  });
  it('escaped result builds a valid RegExp (regression: raw control chars broke regex)', () => {
    const escaped = gen.escapeCharClassContent('\t\n\r ');
    assert.doesNotThrow(
      () => new RegExp(`[${escaped}]`),
      'Escaped content must produce a syntactically valid char class'
    );
  });
  it('generated regex actually matches the original whitespace chars', () => {
    const escaped = gen.escapeCharClassContent('\t\n\r ');
    const re = new RegExp(`[${escaped}]`);
    assert.ok(re.test('\t'), 'Must match tab');
    assert.ok(re.test('\n'), 'Must match newline');
    assert.ok(re.test('\r'), 'Must match carriage return');
    assert.ok(re.test(' '),  'Must match space');
    assert.ok(!re.test('a'), 'Must NOT match letters');
  });
});


// ─── sanitizeName ────────────────────────────────────────────────────────────

describe('CodeGenerator.sanitizeName', () => {
  const gen = makeGen();

  it('leaves alphanumerics unchanged', () => {
    assert.equal(gen.sanitizeName('abc123'), 'abc123');
  });
  it('+ and * produce distinct names (regression: both were "_")', () => {
    assert.notEqual(gen.sanitizeName('+'), gen.sanitizeName('*'));
  });
  it('( and ) produce distinct names', () => {
    assert.notEqual(gen.sanitizeName('('), gen.sanitizeName(')'));
  });
  it('all common operator characters produce unique names', () => {
    const ops = ['+', '-', '*', '/', '(', ')', '[', ']', '{', '}', '=', '<', '>'];
    const names = ops.map(op => gen.sanitizeName(op));
    assert.equal(
      new Set(names).size,
      names.length,
      'Every operator must produce a unique sanitized name'
    );
  });
});


// ─── buildTokenMap – recursive group traversal ────────────────────────────────

describe('CodeGenerator.buildTokenMap – recursive group traversal', () => {
  it('finds terminals nested inside a group (regression: flat traversal missed them)', () => {
    // Grammar: Expr ::= Num ('+' Num)*
    const rules = new Map();
    rules.set('Expr', {
      type: 'syntax', name: 'Expr',
      sequences: [[
        { type: 'nonterminal', value: 'Num', quantifier: 'exactly1' },
        {
          type: 'group', quantifier: 'zeroOrMore',
          sequences: [[
            { type: 'terminal', value: '+', quantifier: 'exactly1' },
            { type: 'nonterminal', value: 'Num', quantifier: 'exactly1' }
          ]]
        }
      ]]
    });
    const tokens = new Map();
    tokens.set('Num', { type: 'lexical', name: 'Num', patterns: [], isSkip: false });

    const gen = new CodeGenerator({ rules, tokens, startSymbol: 'Expr' });
    assert.ok(gen.tokenMap.has('+'), '"+" must be in tokenMap even when nested inside a group');
  });

  it('finds terminals in deeply nested groups', () => {
    const rules = new Map();
    rules.set('S', {
      type: 'syntax', name: 'S',
      sequences: [[
        {
          type: 'group', quantifier: 'exactly1',
          sequences: [[
            {
              type: 'group', quantifier: 'zeroOrMore',
              sequences: [[
                { type: 'terminal', value: '::=', quantifier: 'exactly1' }
              ]]
            }
          ]]
        }
      ]]
    });
    const gen = new CodeGenerator({ rules, tokens: new Map(), startSymbol: 'S' });
    assert.ok(gen.tokenMap.has('::='), '"::=" must be found in a doubly-nested group');
  });

  it('does not add duplicates when the same terminal appears in multiple rules', () => {
    const rules = new Map();
    // Both rules use '+'
    for (const name of ['A', 'B']) {
      rules.set(name, {
        type: 'syntax', name,
        sequences: [[{ type: 'terminal', value: '+', quantifier: 'exactly1' }]]
      });
    }
    const gen = new CodeGenerator({ rules, tokens: new Map(), startSymbol: 'A' });
    const plusEntries = [...gen.tokenMap.entries()].filter(([k]) => k === '+');
    assert.equal(plusEntries.length, 1, '"+" should appear exactly once in tokenMap');
  });
});


// ─── generate – full arithmetic pipeline ─────────────────────────────────────

describe('CodeGenerator.generate – full arithmetic grammar pipeline', () => {
  it('generated code is syntactically valid JavaScript', async () => {
    const code = (await arithmeticGen()).generate();
    // new Function() parses the body at construction; SyntaxError thrown immediately
    assert.doesNotThrow(() => new Function(code), 'Generated code must be syntactically valid JS');
  });

  it('generated lexer has no duplicate token type names', async () => {
    const code = (await arithmeticGen()).generate();
    const tokenSectionMatch = code.match(/tokenPatterns\s*=\s*\[(.*?)\];/s);
    assert.ok(tokenSectionMatch, 'Could not find tokenPatterns section in generated code');
    const names = [...tokenSectionMatch[1].matchAll(/type:\s*'([^']+)'/g)].map(m => m[1]);
    assert.equal(
      new Set(names).size, names.length,
      `Duplicate token type names found: ${names.filter((v, i) => names.indexOf(v) !== i)}`
    );
  });

  it('all generated regex patterns are syntactically valid', async () => {
    const code = (await arithmeticGen()).generate();
    // Use a non-greedy, escape-aware pattern to extract each /.../ literal
    // individually – needed because all patterns can appear on a single line.
    const regexLiterals = [
      ...code.matchAll(/\bregex:\s*(\/(?:[^/\\\n]|\\.)*\/[gimsuy]*)/g)
    ].map(m => m[1]);
    assert.ok(regexLiterals.length > 0, 'Must extract at least one regex pattern');
    for (const literal of regexLiterals) {
      assert.doesNotThrow(
        () => eval(literal),  // eslint-disable-line no-eval
        `Invalid regex literal: ${literal}`
      );
    }
  });

  it('Whitespace is emitted as a skip token', async () => {
    const code = (await arithmeticGen()).generate();
    assert.ok(code.includes('skip: true'), 'Generated lexer must include skip:true for Whitespace');
  });

  it('generated code includes a parse() method', async () => {
    const code = (await arithmeticGen()).generate();
    assert.match(code, /parse\s*\(\s*\)/, 'Generated parser must expose a parse() method');
  });

  it('generated code references Number token', async () => {
    const code = (await arithmeticGen()).generate();
    assert.ok(code.includes("'Number'"), "Must reference 'Number' token");
  });

  it('closing class brace is not merged with last method brace (regression: "}}")', async () => {
    const code = (await arithmeticGen()).generate();
    // "}\n}" is fine; "}}" on the same character sequence is the regression
    assert.ok(!code.includes('}}'), 'Generated code must not contain "}}" (merged braces)');
  });
});
