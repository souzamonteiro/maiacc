'use strict';
// Integration tests: generate the arithmetic parser at runtime and execute it.
// Run via: node --test tests/integration/arithmetic.test.js

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '../..');
const TEMP_PARSER = path.join(__dirname, '_temp_parser.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wraps both construction and parse() in one lambda so that lexer errors
 * (thrown in the Parser constructor) are also caught by assert.throws.
 */
function run(Parser, input) {
  const p = new Parser(input);
  return p.parse();
}

function shouldParse(Parser, input) {
  assert.doesNotThrow(
    () => run(Parser, input),
    `Expected to parse successfully: "${input}"`
  );
}

function shouldReject(Parser, input) {
  assert.throws(
    () => run(Parser, input),
    `Expected rejection but parsed successfully: "${input}"`
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Integration – generated arithmetic parser', () => {
  let Parser;

  before(async () => {
    // Generate a fresh parser from the committed grammar.xml
    const GrammarParser = require(path.join(ROOT, 'grammar-parser'));
    const CodeGenerator = require(path.join(ROOT, 'code-generator'));

    const xml = fs.readFileSync(path.join(ROOT, 'grammar.xml'), 'utf8');
    const grammar = await new GrammarParser(xml).parse();
    const code    = new CodeGenerator(grammar).generate();

    fs.writeFileSync(TEMP_PARSER, code, 'utf8');
    Parser = require(TEMP_PARSER);
  });

  after(() => {
    // Clean up temp file and bust require() cache
    try { fs.unlinkSync(TEMP_PARSER); } catch (_) {}
    delete require.cache[require.resolve(TEMP_PARSER)];
  });

  // ── Generated file sanity ──────────────────────────────────────────────────

  it('generated file exists and is non-empty', () => {
    assert.ok(fs.existsSync(TEMP_PARSER), 'Parser file must have been written');
    assert.ok(fs.statSync(TEMP_PARSER).size > 0, 'Parser file must not be empty');
  });

  it('Parser is a constructor (class)', () => {
    assert.equal(typeof Parser, 'function');
  });

  it('Parser instance exposes parse() method', () => {
    const p = new Parser('1');
    assert.equal(typeof p.parse, 'function');
  });

  // ── Valid inputs ───────────────────────────────────────────────────────────

  describe('valid expressions', () => {
    it('single digit',            () => shouldParse(Parser, '7'));
    it('multi-digit number',      () => shouldParse(Parser, '42'));
    it('large number',            () => shouldParse(Parser, '1234567890'));
    it('addition',                () => shouldParse(Parser, '3+5'));
    it('addition with spaces',    () => shouldParse(Parser, '3 + 5'));
    it('multiplication',          () => shouldParse(Parser, '3*5'));
    it('multiplication with spaces', () => shouldParse(Parser, '3 * 5'));
    it('mixed operators (a+b*c)', () => shouldParse(Parser, '3+5*2'));
    it('chained additions',       () => shouldParse(Parser, '1+2+3+4+5'));
    it('chained multiplications', () => shouldParse(Parser, '2*3*4'));
    it('tabs as whitespace',      () => shouldParse(Parser, '3\t+\t5'));
    it('newlines as whitespace',  () => shouldParse(Parser, '3\n+\n5'));
    it('leading/trailing spaces', () => shouldParse(Parser, '  3  +  5  '));
  });

  // ── Invalid inputs ─────────────────────────────────────────────────────────

  describe('invalid expressions', () => {
    it('empty string',              () => shouldReject(Parser, ''));
    it('alphabetic input',          () => shouldReject(Parser, 'abc'));
    it('starts with operator',      () => shouldReject(Parser, '+5'));
    it('unknown operator -',        () => shouldReject(Parser, '3-5'));
    it('unknown operator /',        () => shouldReject(Parser, '3/5'));
    it('double operator (3++5)',    () => shouldReject(Parser, '3++5'));
    it('extra closing paren (3+5))', () => shouldReject(Parser, '3+5)'));
  });

  // ── Error messages ─────────────────────────────────────────────────────────

  describe('error reporting', () => {
    it('getErrorMessage() returns a string', () => {
      const p = new Parser('1+2');
      p.parse();
      assert.equal(typeof p.getErrorMessage(), 'string');
    });

    it('parse() throws an Error instance', () => {
      assert.throws(
        () => run(Parser, '+5'),
        e => e instanceof Error,
        'Thrown value must be an Error instance'
      );
    });

    it('lexer throws on unknown character', () => {
      assert.throws(
        () => run(Parser, 'a'),
        /unexpected character/i,
        'Lexer error must mention "unexpected character"'
      );
    });
  });

  // ── Whitespace handling ────────────────────────────────────────────────────

  describe('whitespace handling', () => {
    it('whitespace-only input is rejected (no meaningful tokens)', () => {
      shouldReject(Parser, '   ');
    });
    it('whitespace between tokens is ignored', () => {
      shouldParse(Parser, '  10  *  3  ');
    });
  });
});
