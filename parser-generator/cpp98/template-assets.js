'use strict';

// Development-time source asset synchronization only. The native and guest
// generators compile template-assets.hpp directly and never execute this file.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cpp = require('../templates/cpp98');
const javascript = require('../templates/javascript');
const sandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../templates/cpp98-lexer.js'), 'utf8') +
  '\nmodule.exports.assets = { scannerTypes, runtime };', sandbox);
const { scannerTypes, runtime } = sandbox.module.exports.assets;
const literal = (text) => text ? text.match(/[^\n]*\n|[^\n]+$/g)
  .map((line) => '    ' + JSON.stringify(line)).join('\n') : '    ""';
const lines = ['#ifndef MAIACC_CPP98_TEMPLATE_ASSETS_HPP', '#define MAIACC_CPP98_TEMPLATE_ASSETS_HPP',
  '/* Source template data shared with the established JavaScript backend.',
  ' * These are emitter assets, not generated parsers. No JS executes in the',
  ' * C++ generator. The parity test checks each asset against its source. */',
  'struct MaiaCCTemplateAsset { const char* name; const char* cpp; const char* javascript; };',
  'static const MaiaCCTemplateAsset maiaCCTemplateAssets[] = {'];
for (const key of [...new Set([...Object.keys(cpp), ...Object.keys(javascript)])].sort()) {
  if (typeof (cpp[key] || '') !== 'string' || typeof (javascript[key] || '') !== 'string') continue;
  lines.push('  { ' + JSON.stringify(key) + ',', literal(cpp[key] || '') + ',', literal(javascript[key] || '') + ' },');
}
lines.push('};', 'static const char* maiaCCScannerTypes =', literal(scannerTypes) + ';',
  'static const char* maiaCCScannerRuntime =', literal(runtime) + ';', '#endif', '');
const expected = lines.join('\n');
const target = path.join(__dirname, 'template-assets.hpp');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== expected) throw new Error('C++ template assets differ: run node cpp98/template-assets.js from parser-generator');
} else fs.writeFileSync(target, expected);
