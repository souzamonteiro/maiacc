'use strict';

const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const CodeGenerator = require('../../code-generator.js');
const GrammarParser = require('../../grammar-parser.js');
const { ParseTreeCollector } = require('../../parse-tree-collector.js');
const regexRoot = path.resolve(__dirname, '../../../maiaregex');
const regexArgs = ['-I', regexRoot, path.join(regexRoot, 'maia_regex.c')];
const { compilePattern } = require('../../templates/cpp98-lexer.js');

test('MaiaRegex programs preserve JavaScript ordered paths, empty repetitions, assertions and UTF-16 units', () => {
  const patterns = ['a|aa', 'aa|a', 'a*', 'a*?', 'a+?', '(?:a?)*b', '(?:a?)*?b',
    '(?:a|aa)*b', '(?:a|aa)*?b', '(?=a)a+', '(?!b)a*', '(?:(?=a)a)*',
    '(?!a*)b', '(?:a?)*', '(?:a?)*?', '$', 'a$', '[^a]+', '[\\s\\S]',
    '[\\s\\S]*?', '\\u00e9+', '[\\d\\s]+', '(?:ab|a)b?', '.+'];
  const inputs = ['', 'a', 'aa', 'aab', 'aaaab', 'ab', 'b', 'bb', '\n', 'a\n',
    'a\r\n', '\u2028', '\0', 'éé', '😀', '1 \t2'];
  const declarations = [];
  const calls = [];
  const expected = [];
  for (const [index, pattern] of patterns.entries()) {
    const compiled = compilePattern(pattern);
    declarations.push(`static const MaiaRegexInstruction code${index}[] = {${compiled.instructions.map((row) => `{${row.join(',')}}`).join(',')}};`);
    declarations.push(`static const MaiaRegexRange ranges${index}[] = {${(compiled.ranges.length ? compiled.ranges : [[0, 0]]).map((row) => `{${row.join(',')}}`).join(',')}};`);
    declarations.push(`static const MaiaRegexProgram program${index} = {code${index}, ranges${index}, ${compiled.instructions.length}, ${compiled.ranges.length}, ${compiled.entry}};`);
    for (const [inputIndex, input] of inputs.entries()) {
      const units = input.split('').map((character) => character.charCodeAt(0));
      declarations.push(`static const unsigned int input${index}_${inputIndex}[] = {${units.length ? units.join(',') : 0}};`);
      for (let start = 0; start <= input.length; start++) {
        const match = new RegExp(`^(?:${pattern})`).exec(input.slice(start));
        expected.push(match ? `0 ${start + match[0].length}` : '1 999');
        calls.push(`end = 999; result = maia_regex_exec(&program${index}, input${index}_${inputIndex}, ${units.length}, ${start}, 0, &end); printf("%d %u\\n", result, end);`);
      }
    }
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-regex-'));
  try {
    const driver = path.join(temporary, 'program.cpp');
    const executable = path.join(temporary, 'program');
    fs.writeFileSync(driver, `#include "maia_regex.h"\n#include <stdio.h>\n${declarations.join('\n')}\nint main() { unsigned int end; int result; ${calls.join('\n')} return 0; }\n`);
    const compilation = spawnSync(process.env.CXX || 'clang++', ['-std=c++98', '-pedantic-errors', ...regexArgs, driver, '-o', executable], { encoding: 'utf8', timeout: 60000 });
    assert.equal(compilation.status, 0, compilation.stderr);
    const execution = spawnSync(executable, [], { encoding: 'utf8', timeout: 15000 });
    assert.equal(execution.status, 0, execution.stderr);
    assert.deepEqual(execution.stdout.trimEnd().split('\n'), expected);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

async function grammarFromEbnf(source) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-ebnf-'));
  try {
    const filename = path.join(temporary, 'grammar.ebnf');
    fs.writeFileSync(filename, source);
    const xml = execFileSync(process.execPath, [path.resolve(__dirname, '../../REx.js'), filename], {
      encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    });
    return await new GrammarParser(xml).parse();
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function compareSourceCorpus(grammar, sources) {
  const generator = new CodeGenerator(grammar, { language: 'cpp98' });
  const source = generator.generate();
  const module = { exports: {} };
  vm.runInNewContext(new CodeGenerator(grammar).generate(), { module, structuredClone });
  const Parser = module.exports;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-corpus-'));
  try {
    fs.writeFileSync(path.join(temporary, 'parser.hpp'), source);
    fs.writeFileSync(path.join(temporary, 'test.cpp'), `#include "parser.hpp"
#include <stdio.h>
#include <string>
#include <vector>
static std::vector<std::string> trace;
static std::string hex(const char* text, unsigned int length) {
  const char* digits = "0123456789abcdef";
  std::string result;
  for (unsigned int index = 0; index < length; ++index) {
    unsigned char value = (unsigned char)text[index];
    result += digits[value >> 4]; result += digits[value & 15];
  }
  return result;
}
static unsigned int checkpoint(void*) { return (unsigned int)trace.size(); }
static void restore(void*, unsigned int mark) { trace.resize(mark); }
static void start(void*, const char* name, unsigned int) { trace.push_back(std::string("N ") + name); }
static void terminal(void*, unsigned int type, const char* value, unsigned int length, unsigned int) {
  trace.push_back(std::string("T ") + maiaCCParserTokenName(type) + " " + hex(value, length));
}
static void end(void*, const char*, unsigned int) { trace.push_back("E"); }
static void abortRule(void*, const char*, unsigned int) {}
int main(int argc, char** argv) {
  if (argc != 2) return 10;
  FILE* file = fopen(argv[1], "rb"); if (!file) return 11;
  std::string input; int byte;
  while ((byte = fgetc(file)) != EOF) input += (char)byte;
  fclose(file);
  MaiaCCLexerState lexer;
  std::vector<MaiaCCParserToken> tokens(input.size() + 2);
  maiaCCLexerStateInit(&lexer, input.c_str(), (unsigned int)input.size());
  if (!maiaCCLexerTokenize(&lexer, &tokens[0], (unsigned int)tokens.size())) {
    printf("LEX_ERROR %u\\n", lexer.position); return 0;
  }
  for (unsigned int index = 0; index < lexer.tokenCount; ++index) {
    MaiaCCParserToken token = tokens[index];
    printf("TOKEN %s %u %u %s\\n", maiaCCParserTokenName(token.type), token.start, token.end, hex(token.value, token.length).c_str());
  }
  MaiaCCParseEvents events = { 0, checkpoint, restore, start, terminal, end, abortRule, 0 };
  MaiaCCParserState parser;
  maiaCCParserStateInit(&parser, &tokens[0], lexer.tokenCount, &events);
  if (!maiaCC_parse(&parser)) {
    puts("REJECT");
    if (parser.errorCount) printf("ERROR %s %s %u\\n", maiaCCParserTokenName(parser.expectedToken), maiaCCParserTokenName(parser.foundToken), parser.errorPosition);
    return 0;
  }
  puts("ACCEPT");
  for (unsigned int index = 0; index < trace.size(); ++index) puts(trace[index].c_str());
  return 0;
}
`);
    const executable = path.join(temporary, 'test');
    const compilation = spawnSync(process.env.CXX || 'clang++', ['-std=c++98', '-pedantic-errors', '-O1', ...regexArgs, path.join(temporary, 'test.cpp'), '-o', executable], { encoding: 'utf8', timeout: 60000 });
    assert.equal(compilation.status, 0, compilation.stderr);
    for (const input of sources) {
      let parser;
      const collector = new ParseTreeCollector();
      let accepted = false;
      try { parser = new Parser(input, collector); collector.parse(parser); accepted = true; } catch {}
      const filename = path.join(temporary, 'input');
      fs.writeFileSync(filename, input);
      const execution = spawnSync(executable, [filename], { encoding: 'utf8', timeout: 15000, maxBuffer: 16 * 1024 * 1024 });
      assert.equal(execution.status, 0, `${JSON.stringify(input.slice(0, 80))}: ${execution.stderr || execution.error}`);
      const actual = execution.stdout.trimEnd().split('\n');
      if (!parser) {
        assert.match(actual[0], /^LEX_ERROR /, JSON.stringify(input));
        continue;
      }
      const expectedTokens = Array.from(parser.tokens, (token) =>
        `TOKEN ${token.type} ${token.start} ${token.end} ${Buffer.from(token.value).toString('hex')}`);
      assert.deepEqual(actual.slice(0, expectedTokens.length).map((row) => row.trimEnd()), expectedTokens.map((row) => row.trimEnd()), JSON.stringify(input.slice(0, 160)));
      assert.equal(actual[expectedTokens.length], accepted ? 'ACCEPT' : 'REJECT', JSON.stringify(input));
      if (!accepted && parser.errors.length) {
        const first = parser.errors[0];
        assert.equal(actual[expectedTokens.length + 1], `ERROR ${first.expected} ${first.found} ${first.position}`, JSON.stringify(input));
      }
      if (accepted) {
        const expectedTrace = [];
        const walk = (node) => {
          if (node.kind === 'terminal') {
            expectedTrace.push(`T ${node.token} ${Buffer.from(node.value).toString('hex')}`.trimEnd());
          } else {
            expectedTrace.push(`N ${node.name}`);
            for (const child of node.children) walk(child);
            expectedTrace.push('E');
          }
        };
        walk(collector.root);
        assert.deepEqual(actual.slice(expectedTokens.length + 1).map((row) => row.trimEnd()), expectedTrace, JSON.stringify(input.slice(0, 160)));
      }
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

test('C++98 generated lexer and parser match JavaScript groups, quantifiers, skips, Unicode and errors', async () => {
  const grammar = await grammarFromEbnf(`Input ::= ('if' | Word | Number | Quoted)* EOF
<?TOKENS?>
EOF ::= $
Word ::= [A-Za-z_#x00E9]+ [0-9]*
Number ::= [0-9]+ ('.' [0-9]+)?
Quoted ::= #x22 ([^#x22#x5C] | #x5C [#x20-#x7E])* #x22
Space ::= [#x20#x09#x0A#x0D]+
/* ws: definition */
`);
  compareSourceCorpus(grammar, ['if iffy word42 3.14 9', '"a\\"b" éé\nif', '"😀"', '', '  \r\n ', 'word @', '"unfinished', 'if2', '"back\\\\slash"']);
});

test('C++98 implicit EOF and contextual lexical matching do not require a caller lexer', async () => {
  const grammar = await grammarFromEbnf(`Input ::= 'for' Name^token ('in' Name^token)*
<?TOKENS?>
Name ::= [a-z]+
Space ::= ' '+
/* ws: definition */
`);
  compareSourceCorpus(grammar, ['for item in value', 'for for in in', 'for', 'for item extra', 'for item']);
});

test('C++98 lexer supports EOF-only grammars without zero-sized generated arrays', async () => {
  const grammar = await grammarFromEbnf('Input ::= EOF\n<?TOKENS?>\nEOF ::= $\n');
  compareSourceCorpus(grammar, ['', 'x']);
});

test('C++98 scanner reproduces ordered alternatives, lazy comments, lookahead and lexical preferences', async () => {
  const grammar = await grammarFromEbnf(`Input ::= ('x' | Word | nat | float)* EOF
<?TOKENS?>
EOF ::= $
Word ::= [a-z]+
nat ::= [0-9]+
float ::= [0-9]+ ('.' [0-9]+)?
nat << float
Whitespace ::= ' '+ | '//' [^#x0A]* #x0A? | '/*' [^#x00]* '*/'
/* ws: definition */
`);
  compareSourceCorpus(grammar, ['x // comment\nword', 'x /* short */ word /* next */ x', '3 3.14', '/* ws: no */', '   x', '/* unfinished']);
});

test('C++98 lexer self-hosts REx directly from UTF-8 source with matching tokens and trees', async () => {
  const root = path.resolve(__dirname, '../..');
  const input = fs.readFileSync(path.join(root, '../grammar/REx.ebnf'), 'utf8');
  const grammar = await grammarFromEbnf(input);
  compareSourceCorpus(grammar, [input]);
});

test('C++98 shell lexer/parser consumes scripts directly and matches JavaScript tokens, trees and failures', async () => {
  const input = fs.readFileSync(path.resolve(__dirname, '../fixtures/shell.ebnf'), 'utf8');
  const grammar = await grammarFromEbnf(input);
  compareSourceCorpus(grammar, [
    '', 'help\n', 'echo hello world\n', 'echo "two words" \'single quoted\' one\\ two\n',
    '# heading\necho hi # trailing\n', 'name=value\n', 'name=value echo hi\n', 'echo name=value\n',
    'cat < input.txt\n', 'echo hi >> output.txt 2>&1\n', '> output.txt echo hi\n',
    'echo a |\ncat\n', 'echo a &&\necho b\n', 'false || echo recovered\n',
    'pwd; ls\n', 'sleep 1 &\n', '(echo sub; pwd)\n', '{ echo brace; }\n',
    'if true; then echo yes; else echo no; fi\n',
    'if false; then echo no; elif true; then echo yes; fi\n',
    'while false; do echo loop; done\n', 'until true; do echo loop; done\n',
    'for name in a b; do echo $name; done\n', 'for name; do echo $name; done\n',
    'echo pre\'fix\'"tail"\n', 'echo "é 😀"\r\n', 'echo a\recho b\r',
    ';;\n', 'echo a; ; echo b\n', 'echo a | | cat\n', 'echo >\n',
    'if true; then echo yes\n', '(echo hi\n', 'for item in a; do echo hi\n',
    'echo hi &&\n', 'then\n', 'echo "unfinished\n',
  ]);
});

test('C++98 template interpolation modes preserve nested brace and span tokenization', async () => {
  const grammar = await grammarFromEbnf("Input ::= (TemplateHead | TemplateMiddle | TemplateTail | NoSubstitutionTemplate | Word | '{' | '}')* EOF\n"
    + "<?TOKENS?>\nEOF ::= $\n"
    + "TemplateHead ::= '`' TemplateChar* '${'\n"
    + "TemplateMiddle ::= '}' TemplateChar* '${'\n"
    + "TemplateTail ::= '}' TemplateChar* '`'\n"
    + "NoSubstitutionTemplate ::= '`' TemplateChar* '`'\n"
    + "TemplateChar ::= [a-z#x20]\nWord ::= [a-z]+\n"
    + "Space ::= ' '+\n/* ws: definition */\n");
  compareSourceCorpus(grammar, [
    '`plain`', '`hello ${name}`', '`a ${name} b ${other} c`',
    '`outer ${ {name} } end`', '`outer ${ `inner ${name}` } end`',
    '{name} `plain`', '`unfinished ${name}',
  ]);
});

test('C++98 lexer reports invalid UTF-8, invalid input, and insufficient token capacity without overruns', async () => {
  const grammar = await grammarFromEbnf("Input ::= Word* EOF\n<?TOKENS?>\nEOF ::= $\nWord ::= [a-z]+\n");
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-capacity-'));
  try {
    fs.writeFileSync(path.join(temporary, 'parser.hpp'), new CodeGenerator(grammar, { language: 'cpp98' }).generate());
    fs.writeFileSync(path.join(temporary, 'test.cpp'), `#include "parser.hpp"
int main() {
  MaiaCCLexerState lexer;
  MaiaCCParserToken tokens[2];
  tokens[1].type = 999;
  maiaCCLexerStateInit(&lexer, "word", 4);
  if (maiaCCLexerTokenize(&lexer, tokens, 1) || lexer.failed != 3 || tokens[1].type != 999) return 1;
  maiaCCLexerStateInit(&lexer, "word", 4);
  if (!maiaCCLexerTokenize(&lexer, tokens, 2) || lexer.tokenCount != 2) return 2;
  maiaCCLexerStateInit(&lexer, "@", 1);
  if (maiaCCLexerTokenize(&lexer, tokens, 2) || lexer.failed != 1 || lexer.position != 0) return 3;
  const char invalid[] = { (char)0xc0, (char)0x80, 0 };
  maiaCCLexerStateInit(&lexer, invalid, 2);
  if (maiaCCLexerTokenize(&lexer, tokens, 2) || lexer.failed != 1) return 4;
  maiaCCLexerStateInit(&lexer, 0, 0);
  if (maiaCCLexerTokenize(&lexer, tokens, 2)) return 5;
  maiaCCLexerStateInit(&lexer, "word", 4);
  if (!maiaCCLexerTokenize(&lexer, tokens, 2)) return 6;
  MaiaCCParserState parser;
  maiaCCParserStateInit(&parser, tokens, lexer.tokenCount, 0);
  if (!maiaCC_parse(&parser)) return 7;
  return 0;
}
`);
    const executable = path.join(temporary, 'test');
    const compilation = spawnSync(process.env.CXX || 'clang++', ['-std=c++98', '-pedantic-errors', ...regexArgs, path.join(temporary, 'test.cpp'), '-o', executable], { encoding: 'utf8' });
    assert.equal(compilation.status, 0, compilation.stderr);
    const execution = spawnSync(executable, [], { encoding: 'utf8', timeout: 10000 });
    assert.equal(execution.status, 0, execution.stderr);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('C++98 lexer tokenizes source directly with JavaScript token precedence', () => {
  const grammar = {
    startSymbol: 'Input',
    rules: new Map([['Input', { name: 'Input', sequences: [[
      { type: 'terminal', value: 'if' },
      { type: 'nonterminal', value: 'WORD', quantifier: 'zeroOrMore' },
      { type: 'nonterminal', value: 'EOF' },
    ]] }]]),
    tokens: new Map([
      ['WORD', { name: 'WORD', patterns: [[{ type: 'charclass', value: 'a-z', quantifier: 'oneOrMore' }]] }],
      ['SPACE', { name: 'SPACE', isSkip: true, patterns: [[{ type: 'literal', value: ' ', quantifier: 'oneOrMore' }]] }],
      ['EOF', { name: 'EOF', patterns: [] }],
    ]),
  };
  const source = 'if iffy hello';
  const module = { exports: {} };
  vm.runInNewContext(new CodeGenerator(grammar).generate(), { module });
  const reference = new module.exports(source);
  reference.parse();
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-lexer-'));
  try {
    fs.writeFileSync(path.join(temporary, 'parser.hpp'), new CodeGenerator(grammar, { language: 'cpp98' }).generate());
    fs.writeFileSync(path.join(temporary, 'test.cpp'), `#include "parser.hpp"
#include <stdio.h>
int main() {
  MaiaCCLexerState lexer;
  MaiaCCParserToken tokens[32];
  maiaCCLexerStateInit(&lexer, ${JSON.stringify(source)}, ${source.length});
  if (!maiaCCLexerTokenize(&lexer, tokens, 32)) return 1;
  for (unsigned int index = 0; index < lexer.tokenCount; ++index) {
    printf("%s %u %u\\n", maiaCCParserTokenName(tokens[index].type), tokens[index].start, tokens[index].end);
  }
  MaiaCCParserState parser;
  maiaCCParserStateInit(&parser, tokens, lexer.tokenCount, 0);
  return maiaCC_parse(&parser) ? 0 : 2;
}
`);
    const executable = path.join(temporary, 'test');
    const compilation = spawnSync(process.env.CXX || 'clang++', ['-std=c++98', '-pedantic-errors', ...regexArgs, path.join(temporary, 'test.cpp'), '-o', executable], { encoding: 'utf8' });
    assert.equal(compilation.status, 0, compilation.stderr);
    const execution = spawnSync(executable, [], { encoding: 'utf8', timeout: 10000 });
    assert.equal(execution.status, 0, execution.stderr);
    assert.equal(execution.stdout, reference.tokens.map((token) => `${token.type} ${token.start} ${token.end}\n`).join(''));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});