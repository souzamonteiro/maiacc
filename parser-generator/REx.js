#!/usr/bin/env node
'use strict';

// Native self-hosted REx command.
// - Parses with rex-parser.js
// - Serializes XML from parser events
//
// Legacy REx-main.js is optional and only used when --validate-legacy is enabled.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const EBNF_ROOT = path.join(ROOT, '..');
const SELF_HOSTED_PARSER = path.join(ROOT, 'rex-parser.js');
const LEGACY_REX_MAIN = path.join(EBNF_ROOT, 'REx-main.js');

function usage() {
  console.error('Usage: node REx.js [--validate-legacy] [-i] INPUT...');
  console.error('');
  console.error('  INPUT can be a file path or literal text enclosed in braces: { ... }');
  console.error('');
  console.error('Options:');
  console.error('  -i                accepted for compatibility (ignored)');
  console.error('  --validate-legacy compare native XML against legacy REx-main.js output');
}

function readInput(inputArg) {
  if (/^\{[\s\S]*\}$/.test(inputArg)) {
    return inputArg.slice(1, -1);
  }

  const filePath = path.resolve(process.cwd(), inputArg);
  const content = fs.readFileSync(filePath, 'utf8');
  return content.length > 0 && content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

class XmlEventCollector {
  constructor() {
    this.stack = [];
    this.root = null;
  }

  checkpoint() {
    // Structural snapshots are used only in speculative parser branches.
    return {
      stack: structuredClone(this.stack),
      root: structuredClone(this.root)
    };
  }

  restore(mark) {
    if (!mark) return;
    this.stack = mark.stack;
    this.root = mark.root;
  }

  startNonterminal(name) {
    this.stack.push({ kind: 'node', name, children: [] });
  }

  terminal(expectedType, tokenValue) {
    if (this.stack.length === 0) return;

    const parent = this.stack[this.stack.length - 1];

    if (expectedType === 'EOF') {
      parent.children.push({ kind: 'node', name: 'EOF', children: [] });
      return;
    }

    const elementName = expectedType.startsWith('TOKEN_') ? 'TOKEN' : expectedType;
    parent.children.push({
      kind: 'node',
      name: elementName,
      children: [{ kind: 'text', value: tokenValue }]
    });
  }

  endNonterminal() {
    const node = this.stack.pop();
    if (!node) return;

    if (this.stack.length === 0) {
      this.root = node;
    } else {
      this.stack[this.stack.length - 1].children.push(node);
    }
  }

  abortNonterminal() {
    this.stack.pop();
  }

  serializeNode(node) {
    if (node.kind === 'text') {
      return xmlEscape(node.value);
    }

    const children = node.children || [];
    if (children.length === 0) {
      return `<${node.name}/>`;
    }

    const inner = children.map((child) => this.serializeNode(child)).join('');
    return `<${node.name}>${inner}</${node.name}>`;
  }

  toXml() {
    if (!this.root) {
      throw new Error('No parse tree was collected from parser events');
    }
    return `<?xml version="1.0" encoding="UTF-8"?>${this.serializeNode(this.root)}`;
  }
}

function parseToXmlWithSelfHosted(inputText, inputLabel) {
  const Parser = require(SELF_HOSTED_PARSER);
  const collector = new XmlEventCollector();
  const parser = new Parser(inputText, collector);

  try {
    parser.parse();
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    throw new Error(`Self-hosted parser failed for ${inputLabel}: ${message}`);
  }

  return collector.toXml();
}

function serializeWithLegacy(inputArg) {
  const serializerArg = /^\{[\s\S]*\}$/.test(inputArg)
    ? inputArg
    : path.resolve(process.cwd(), inputArg);

  return execFileSync(process.execPath, [LEGACY_REX_MAIN, serializerArg], {
    cwd: EBNF_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function main(argv) {
  if (!fs.existsSync(SELF_HOSTED_PARSER)) {
    throw new Error(`Missing self-hosted parser: ${SELF_HOSTED_PARSER}`);
  }

  const rawArgs = argv.slice(2);
  if (rawArgs.length === 0) {
    usage();
    process.exit(1);
  }

  let validateLegacy = false;
  const inputs = [];
  for (const arg of rawArgs) {
    if (arg === '-i') continue;
    if (arg === '--validate-legacy') {
      validateLegacy = true;
      continue;
    }
    inputs.push(arg);
  }

  if (inputs.length === 0) {
    usage();
    process.exit(1);
  }

  for (const inputArg of inputs) {
    const inputText = readInput(inputArg);
    const xml = parseToXmlWithSelfHosted(inputText, inputArg);

    if (validateLegacy) {
      if (!fs.existsSync(LEGACY_REX_MAIN)) {
        throw new Error(`Missing legacy serializer: ${LEGACY_REX_MAIN}`);
      }
      const legacyXml = serializeWithLegacy(inputArg);
      if (legacyXml !== xml) {
        console.error(`Legacy validation mismatch for ${inputArg}`);
        process.exit(2);
      }
    }

    process.stdout.write(xml);
  }
}

try {
  main(process.argv);
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
