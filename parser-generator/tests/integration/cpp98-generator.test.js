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
const source = path.join(root, 'parser-generator/cpp98');
const rexGrammar = path.join(root, 'grammar/REx.ebnf');

test('complete C++98 generator matches both backends and bootstraps without the JavaScript emitter', async (t) => {
  const compiler = [process.env.CXX, 'clang++', 'g++', 'c++'].filter(Boolean)
    .find((candidate) => spawnSync(candidate, ['--version']).status === 0);
  if (!compiler) return t.skip('Native C++98 compiler unavailable; WASM is a separate gate');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-cpp98-generator-'));
  const run = (command, args) => execFileSync(command, args, {
    cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024,
  });
  const nativeXml = (directory, grammar) => run(path.join(directory, 'REx-cpp98'), [grammar]);
  const nativeGenerate = (directory, xml, language, output) => {
    const input = path.join(temporary, 'input.xml'); fs.writeFileSync(input, xml);
    run(path.join(directory, 'MaiaCC-cpp98'), [`--language=${language}`, input, output]);
    return fs.readFileSync(output, 'utf8');
  };
  try {
    run(process.execPath, [path.join(source, 'template-assets.js'), '--check']);
    const seed = path.join(temporary, 'seed'); fs.mkdirSync(seed);
    run('sh', [path.join(source, 'build.sh'), seed]);
    const featureGrammar = path.join(temporary, 'features.ebnf');
    fs.writeFileSync(featureGrammar, 'Start ::= ("<&>" | "q") Name^token? (Number | "!")* EOF\n' +
      'SpaceRule ::= Whitespace /* ws: definition */\n<?TOKENS?>\n' +
      'Name ::= [a-zA-Z_#xC0-#xD6]+\nNumber ::= [0-9]+\nWhitespace ::= (#x20 | #x9)+\n' +
      'Unused ::= (. - ("a" | "b"))?\nName << Number\n');
    const unicodeGrammar = path.join(temporary, 'unicode.ebnf');
    fs.writeFileSync(unicodeGrammar, 'RegraÁ ::= "😀" Letras? (Exclusion | NullUnit)* EOF\n<?TOKENS?>\n' +
      'Letras ::= [#xC0-#xD6a-z]+\nExclusion ::= . - ("x" | "y")\nNullUnit ::= #x0\nEOF ::= $\n');
    const fixtures = [rexGrammar, path.join(source, 'xml.ebnf'),
      path.join(root, 'parser-generator/examples/sample-grammar.ebnf'),
      path.join(root, 'parser-generator/examples/WAT.ebnf'),
      path.join(root, 'parser-generator/tests/fixtures/shell.ebnf'),
      path.join(root, 'parser-generator/tests/fixtures/lexical-context.ebnf'), featureGrammar, unicodeGrammar];
    for (const fixture of fixtures) {
      const xml = nativeXml(seed, fixture);
      const model = await new GrammarParser(xml).parse();
      for (const language of ['cpp98', 'javascript']) {
        const actual = nativeGenerate(seed, xml, language, path.join(temporary, `actual.${language}`));
        assert.equal(actual, new CodeGenerator(model, { language }).generate(), `${fixture}: ${language} source parity`);
      }
      const formatted = '\ufeff\n' + xml.replace(/></g, '>\n<') + '\n';
      // Formatting only touches whitespace between tags, never terminal text.
      assert.equal(nativeGenerate(seed, formatted, 'cpp98', path.join(temporary, 'formatted.cpp')),
        new CodeGenerator(model, { language: 'cpp98' }).generate(), `${fixture}: formatted XML`);
    }

    let previous = seed;
    const forbiddenNode = path.join(temporary, 'forbidden-node'); fs.mkdirSync(forbiddenNode);
    fs.writeFileSync(path.join(forbiddenNode, 'node'), '#!/bin/sh\necho "Unexpected JavaScript bootstrap dependency" >&2\nexit 99\n', { mode: 0o755 });
    for (let generation = 1; generation <= 2; ++generation) {
      const directory = path.join(temporary, `generation-${generation}`); fs.mkdirSync(directory);
      execFileSync('sh', [path.join(source, 'bootstrap.sh'), previous, directory], {
        cwd: root, encoding: 'utf8', timeout: 120000,
        env: { ...process.env, CXX: compiler, PATH: forbiddenNode + path.delimiter + process.env.PATH },
      });
      // Only C++ executables run from here: both parsers are emitted by the
      // previous native generator. The JS emitter seeded generation zero only.
      for (const [grammar, name] of [[rexGrammar, 'rex-parser.cpp'], [path.join(source, 'xml.ebnf'), 'xml-parser.cpp']]) {
        const xml = nativeXml(previous, grammar);
        const actual = fs.readFileSync(path.join(directory, name), 'utf8');
        assert.equal(actual, nativeGenerate(previous, xml, 'cpp98', path.join(temporary, name)));
        assert.equal(actual, fs.readFileSync(path.join(previous, name), 'utf8'), `stable ${name} generation ${generation}`);
      }
      assert.equal(nativeXml(directory, rexGrammar), nativeXml(previous, rexGrammar));
      previous = directory;
    }
    // Generated JavaScript is also executable, not only source-comparable.
    const sample = path.join(root, 'parser-generator/examples/sample-grammar.ebnf');
    const jsPath = path.join(temporary, 'sample-parser.js');
    nativeGenerate(previous, nativeXml(previous, sample), 'javascript', jsPath);
    const Parser = require(jsPath);
    assert.doesNotThrow(() => new Parser('1 + 2 * 3').parse());
    assert.throws(() => new Parser('1 + )').parse());
    const wrapperOutput = path.join(temporary, 'wrapper.cpp');
    const wrapperXml = path.join(temporary, 'wrapper.xml');
    execFileSync('sh', [path.join(root, 'bin/tREx-cpp98.sh'), '--build-dir', previous,
      '--ebnf', '--to-xml', wrapperXml, '--language', 'cpp98', sample, wrapperOutput], {
      cwd: temporary, encoding: 'utf8', timeout: 30000,
      env: { ...process.env, PATH: forbiddenNode + path.delimiter + process.env.PATH },
    });
    const sampleModel = await new GrammarParser(fs.readFileSync(wrapperXml, 'utf8')).parse();
    assert.equal(fs.readFileSync(wrapperOutput, 'utf8'), new CodeGenerator(sampleModel, { language: 'cpp98' }).generate());

    for (const invalid of ['', '<Grammar></Other>', '<Grammar>&missing;</Grammar>', '<Grammar>', '<Grammar/><Grammar/>']) {
      const input = path.join(temporary, 'invalid.xml'); fs.writeFileSync(input, invalid);
      const output = path.join(temporary, 'untouched.cpp'); fs.writeFileSync(output, 'existing output');
      const result = spawnSync(path.join(previous, 'MaiaCC-cpp98'), [input, output], { encoding: 'utf8', timeout: 30000 });
      assert.notEqual(result.status, 0, `reject ${invalid}`);
      assert.equal(fs.readFileSync(output, 'utf8'), 'existing output', 'failure must not overwrite an existing result');
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
