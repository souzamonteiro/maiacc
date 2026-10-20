'use strict';

const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const GrammarParser = require('../../grammar-parser');
const CodeGenerator = require('../../code-generator');

const root = path.resolve(__dirname, '../../..');
const frontend = path.join(root, 'parser-generator/cpp98');
const rex = path.join(root, 'parser-generator/REx.js');
const grammar = path.join(root, 'grammar/REx.ebnf');

test('C++98 REx frontend matches JavaScript XML and stays stable across two generated parser seeds', async (t) => {
  const compiler = [process.env.CXX, 'clang++', 'g++', 'c++'].filter(Boolean)
    .find((candidate) => spawnSync(candidate, ['--version']).status === 0);
  if (!compiler) return t.skip('Native C++98 compiler unavailable; WASM validation is a separate gate');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-cpp98-rex-'));
  const run = (command, args) => execFileSync(command, args, {
    cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
  });
  const reference = (file) => run(process.execPath, [rex, file]);
  const build = async (xml, generation) => {
    const directory = path.join(temporary, `generation-${generation}`);
    fs.mkdirSync(directory);
    const model = await new GrammarParser(xml).parse();
    const code = new CodeGenerator(model, { language: 'cpp98' }).generate();
    fs.writeFileSync(path.join(directory, 'rex-parser.cpp'), code);
    const binary = path.join(directory, 'REx-cpp98');
    run(compiler, ['-x', 'c++', '-std=c++98', '-pedantic-errors', '-O1',
      '-I', directory, '-I', path.join(root, 'maiaregex'),
      path.join(frontend, 'REx-main.cpp'), path.join(root, 'maiaregex/maia_regex.c'), '-o', binary]);
    return { binary, code };
  };
  try {
    const baseline = reference(grammar);
    const first = await build(baseline, 0);
    const nativeXml = run(first.binary, [grammar]);
    assert.equal(nativeXml, baseline, 'Generated C++ lexer/parser and C++ collector must reproduce JavaScript XML');
    const second = await build(nativeXml, 1);
    assert.equal(second.code, first.code, 'The JavaScript emitter must produce identical C++ parser seeds from either frontend');
    assert.equal(run(second.binary, [grammar]), nativeXml, 'Second C++ frontend seed must reproduce identical XML');
    const fixtures = [
      path.join(root, 'parser-generator/examples/sample-grammar.ebnf'),
      path.join(root, 'parser-generator/examples/WAT.ebnf'),
      path.join(root, 'parser-generator/tests/fixtures/shell.ebnf'),
    ];
    const escaped = path.join(temporary, 'escaped.ebnf');
    fs.writeFileSync(escaped, '\ufeffStart ::= "<&>" Name?\r\n<?TOKENS?>\r\nName ::= [a-z]+\r\n');
    fixtures.push(escaped);
    for (const fixture of fixtures) {
      const expected = reference(fixture);
      assert.equal(run(first.binary, [fixture]), expected, fixture);
      assert.equal(run(second.binary, [fixture]), expected, fixture);
    }
    for (const invalid of ['Start ::= (', 'Start ::= "unterminated', '@']) {
      const filename = path.join(temporary, 'invalid.ebnf');
      fs.writeFileSync(filename, invalid);
      const js = spawnSync(process.execPath, [rex, filename], { cwd: root, encoding: 'utf8' });
      const cpp = spawnSync(second.binary, [filename], { encoding: 'utf8' });
      assert.notEqual(js.status, 0, 'Reference must reject invalid fixture');
      assert.notEqual(cpp.status, 0, 'C++ frontend must reject the same invalid fixture');
      assert.equal(cpp.stdout, '', 'Rejected input must not expose partial XML');
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
