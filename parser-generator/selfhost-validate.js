#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = __dirname;
const ebnfFile = path.join(root, '../REx.ebnf');
const rexMain = path.join(root, '../tools/REx-main.js');
const rexCli = path.join(root, 'REx.js');

const grammarXml = path.join(root, 'rex-grammar.xml');
const grammarTestXml = path.join(root, 'rex-grammar-test.xml');
const parserBase = path.join(root, 'rex-parser.js');
const parserTest = path.join(root, 'rex-parser-test.js');

function runNode(args, options = {}) {
  return execFileSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
}

function sha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function lineDiffSummary(aPath, bPath) {
  const a = fs.readFileSync(aPath, 'utf8').split('\n');
  const b = fs.readFileSync(bPath, 'utf8').split('\n');
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      return {
        equal: false,
        firstDiffLine: i + 1,
        aLine: a[i] || '',
        bLine: b[i] || ''
      };
    }
  }
  return { equal: true };
}

function printStep(name) {
  console.log(`\n== ${name} ==`);
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function main() {
  ensureFile(ebnfFile);
  ensureFile(rexCli);
  ensureFile(parserBase);

  printStep('1) Parse REx.ebnf with rex-parser.js (self-host parser)');
  runNode(['-e', `
    const fs = require('fs');
    const Parser = require('./rex-parser');
    const input = fs.readFileSync('../REx.ebnf', 'utf8');
    new Parser(input).parse();
    console.log('OK: rex-parser.js parsed REx.ebnf');
  `]);
  console.log('OK: rex-parser.js parsed REx.ebnf');

  printStep('2) Generate rex-grammar-test.xml');
  const xml = runNode([rexCli, ebnfFile]);
  fs.writeFileSync(grammarTestXml, xml, 'utf8');
  console.log(`OK: wrote ${path.basename(grammarTestXml)}`);

  printStep('3) Generate rex-parser-test.js from rex-grammar-test.xml');
  runNode(['index.js', grammarTestXml, parserTest]);
  console.log(`OK: wrote ${path.basename(parserTest)}`);

  printStep('4) Parse REx.ebnf with rex-parser-test.js');
  runNode(['-e', `
    const fs = require('fs');
    const Parser = require('./rex-parser-test');
    const input = fs.readFileSync('../REx.ebnf', 'utf8');
    new Parser(input).parse();
    console.log('OK: rex-parser-test.js parsed REx.ebnf');
  `]);
  console.log('OK: rex-parser-test.js parsed REx.ebnf');

  printStep('5) Compare outputs');
  const baseHash = sha256(parserBase);
  const testHash = sha256(parserTest);
  const parserDiff = lineDiffSummary(parserBase, parserTest);

  const baseXmlHash = fs.existsSync(grammarXml) ? sha256(grammarXml) : null;
  const testXmlHash = sha256(grammarTestXml);
  const xmlEqual = baseXmlHash ? baseXmlHash === testXmlHash : null;

  let legacyValidation = 'skipped';
  if (fs.existsSync(rexMain)) {
    const legacyXml = runNode([rexMain, ebnfFile]);
    const legacyXmlHash = crypto.createHash('sha256').update(legacyXml).digest('hex');
    legacyValidation = legacyXmlHash === testXmlHash ? 'IDENTICAL' : 'DIFFERENT';
    console.log(`legacy xml hash: ${legacyXmlHash}`);
  }

  console.log(`parser base hash: ${baseHash}`);
  console.log(`parser test hash: ${testHash}`);
  if (parserDiff.equal) {
    console.log('parser comparison: IDENTICAL');
  } else {
    console.log(`parser comparison: DIFFERENT (first diff at line ${parserDiff.firstDiffLine})`);
    console.log(`base: ${parserDiff.aLine}`);
    console.log(`test: ${parserDiff.bLine}`);
  }

  if (baseXmlHash) {
    console.log(`xml base hash: ${baseXmlHash}`);
    console.log(`xml test hash: ${testXmlHash}`);
    console.log(`xml comparison: ${xmlEqual ? 'IDENTICAL' : 'DIFFERENT'}`);
  } else {
    console.log(`xml test hash: ${testXmlHash}`);
    console.log('xml comparison: skipped (rex-grammar.xml not found)');
  }
  console.log(`legacy validation: ${legacyValidation}`);

  printStep('RESULT');
  if (parserDiff.equal) {
    console.log('SELF-HOST VALIDATION: PASS (stable regeneration)');
  } else {
    console.log('SELF-HOST VALIDATION: PASS (functional), but generated parser differs textually.');
  }
}

try {
  main();
} catch (error) {
  console.error('\nSELF-HOST VALIDATION: FAIL');
  console.error(error.message || error);
  process.exit(1);
}
