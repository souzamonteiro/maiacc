'use strict';
// Tests for code-generator.js
// Run via: node --test tests/unit/code-generator.test.js

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs   = require('fs');
const path = require('path');
const vm = require('node:vm');

const CodeGenerator = require('../../code-generator');
const GrammarParser = require('../../grammar-parser');

function resolveGrammarXmlPath() {
  const candidates = [
    path.join(__dirname, '../../examples/grammar.xml'),
    path.join(__dirname, '../../grammar.xml'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Could not find grammar.xml (checked parser-generator/grammar.xml and parser-generator/examples/grammar.xml)');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal CodeGenerator instance (empty grammar) – enough to test pure methods. */
function makeGen() {
  return new CodeGenerator({ rules: new Map(), tokens: new Map(), startSymbol: 'S' });
}

/** Full CodeGenerator built from the committed grammar.xml. */
async function arithmeticGen() {
  const xml = fs.readFileSync(resolveGrammarXmlPath(), 'utf8');
  const grammar = await new GrammarParser(xml).parse();
  return new CodeGenerator(grammar);
}

const PREFERENCE_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Grammar><Prolog/>' +
  '<SyntaxDefinition>' +
    '<SyntaxProduction>' +
      '<Name>Start</Name> <TOKEN>::=</TOKEN>' +
      '<SyntaxChoice>' +
        '<SyntaxSequence>' +
          '<SyntaxItem><SyntaxPrimary><NameOrString><Name>float</Name></NameOrString></SyntaxPrimary></SyntaxItem>' +
        '</SyntaxSequence>' +
        '<SyntaxSequence>' +
          '<SyntaxItem><SyntaxPrimary><NameOrString><Name>nat</Name></NameOrString></SyntaxPrimary></SyntaxItem>' +
        '</SyntaxSequence>' +
      '</SyntaxChoice>' +
    '</SyntaxProduction>' +
  '</SyntaxDefinition>' +
  '<LexicalDefinition><TOKEN>&lt;?TOKENS?&gt;</TOKEN>' +
    '<LexicalProduction>' +
      '<Name>nat</Name> <TOKEN>::=</TOKEN>' +
      '<ContextChoice><ContextExpression><LexicalSequence>' +
        '<LexicalItem><LexicalPrimary><CharClass><TOKEN>[</TOKEN><CharRange>0-9</CharRange><TOKEN>]</TOKEN></CharClass></LexicalPrimary><TOKEN>+</TOKEN></LexicalItem>' +
      '</LexicalSequence></ContextExpression></ContextChoice>' +
    '</LexicalProduction>' +
    '<LexicalProduction>' +
      '<Name>float</Name> <TOKEN>::=</TOKEN>' +
      '<ContextChoice><ContextExpression><LexicalSequence>' +
        '<LexicalItem><LexicalPrimary><Name>nat</Name></LexicalPrimary></LexicalItem>' +
        '<LexicalItem><LexicalPrimary><StringLiteral>\'.\'</StringLiteral></LexicalPrimary></LexicalItem>' +
        '<LexicalItem><LexicalPrimary><Name>nat</Name></LexicalPrimary></LexicalItem>' +
      '</LexicalSequence></ContextExpression></ContextChoice>' +
    '</LexicalProduction>' +
    '<Preference>' +
      '<NameOrString><Name>nat</Name></NameOrString>' +
      '<TOKEN>&lt;&lt;</TOKEN>' +
      '<NameOrString><Name>float</Name></NameOrString>' +
    '</Preference>' +
  '</LexicalDefinition>' +
  '<EOF/></Grammar>';

function loadGeneratedParser(code) {
  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.module.exports;
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

describe('CodeGenerator.generateLexer – lexical preference ordering', () => {
  it('emits nat before float when grammar has nat << float', () => {
    const rules = new Map();
    rules.set('Start', {
      type: 'syntax',
      name: 'Start',
      sequences: [
        [{ type: 'nonterminal', value: 'float', quantifier: 'exactly1' }],
        [{ type: 'nonterminal', value: 'nat', quantifier: 'exactly1' }],
      ],
    });

    const tokens = new Map();
    // Intentionally insert nat first to validate preference-based reordering.
    tokens.set('nat', {
      type: 'lexical',
      name: 'nat',
      patterns: [[{ type: 'charclass', value: '0-9', negated: false, quantifier: 'oneOrMore' }]],
      isSkip: false,
    });
    tokens.set('float', {
      type: 'lexical',
      name: 'float',
      patterns: [[
        { type: 'tokenRef', value: 'nat', quantifier: 'exactly1' },
        { type: 'literal', value: '.', quantifier: 'exactly1' },
        { type: 'tokenRef', value: 'nat', quantifier: 'exactly1' },
      ]],
      isSkip: false,
    });

    const gen = new CodeGenerator({
      rules,
      tokens,
      lexicalPreferences: [
        {
          lower: { kind: 'name', value: 'float' },
          higher: { kind: 'name', value: 'nat' },
        },
      ],
      startSymbol: 'Start',
    });

    const code = gen.generateLexer();
    const floatPos = code.indexOf("type: 'float'");
    const natPos = code.indexOf("type: 'nat'");
    assert.ok(floatPos !== -1, 'float token must be emitted');
    assert.ok(natPos !== -1, 'nat token must be emitted');
    assert.ok(natPos < floatPos, 'nat must be emitted before float due to nat << float');
  });

  it('honors named-token priority declared in grammar XML', async () => {
    const grammar = await new GrammarParser(PREFERENCE_XML).parse();
    const gen = new CodeGenerator(grammar);
    const code = gen.generateLexer();

    const floatPos = code.indexOf("type: 'float'");
    const natPos = code.indexOf("type: 'nat'");
    assert.ok(floatPos !== -1, 'float token must be emitted');
    assert.ok(natPos !== -1, 'nat token must be emitted');
    assert.ok(floatPos < natPos, 'grammar preference nat << float must force float before nat');
  });

  it('tokenizes 3.14 as float when nat << float', async () => {
    const grammar = await new GrammarParser(PREFERENCE_XML).parse();
    const code = new CodeGenerator(grammar).generate();
    const Parser = loadGeneratedParser(code);

    const parser = new Parser('3.14');
    assert.equal(parser.tokens[0].type, 'float', 'decimal literal must be tokenized as float');
    assert.equal(parser.tokens[0].value, '3.14');
  });
});
