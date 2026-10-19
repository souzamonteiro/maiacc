'use strict';

const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const CodeGenerator = require('../../code-generator.js');
const GrammarParser = require('../../grammar-parser.js');

const root = path.resolve(__dirname, '../..');
const grammarPath = path.join(root, '../grammar/REx.ebnf');
const referenceParserPath = path.join(root, 'rex-parser.js');
const rexPath = path.join(root, 'REx.js');

function findCppCompiler() {
  for (const compiler of [process.env.CXX, 'c++', 'clang++', 'g++'].filter(Boolean)) {
    const result = spawnSync(compiler, ['--version'], { encoding: 'utf8' });
    if (!result.error && result.status === 0) return compiler;
  }
  return null;
}

function contextualPairs(generator, tokens) {
  const tokenIds = new Map(
    [...generator.tokenMap.values()].map(({ id, name }) => [name, id]),
  );
  const pairs = [];
  for (const expectedToken of generator.grammar.tokens.values()) {
    const expectedId = tokenIds.get(expectedToken.name);
    const pattern = generator.tokenPatternToRegex(expectedToken);
    if (expectedId == null || !pattern) continue;
    const matcher = new RegExp(`^${pattern}`);
    for (const token of tokens) {
      if (token.type === expectedToken.name) continue;
      const match = token.value.match(matcher);
      if (match && match.index === 0 && match[0].length === token.value.length) {
        pairs.push(`  { ${token.start}, ${expectedId} }`);
      }
    }
  }
  return pairs;
}

function makeDriver(parserSource, tokens, pairs) {
  const tokenIds = new Map(
    [...parserSource.tokenMap.values()].map(({ id, name }) => [name, id]),
  );
  const tokenArray = tokens.map((token) => {
    const typeId = tokenIds.get(token.type);
    assert.notEqual(typeId, undefined, `No C++ token ID for JS token ${token.type}`);
    return `  { ${typeId}, "", 0, ${token.start}, ${token.end} }`;
  });
  const pairArray = pairs.length > 0 ? pairs.join(',\n') : '  { 0, 0 }';

  return `#include "generated-parser.cpp"
#include <stdio.h>

struct ParseTrace {
  unsigned int depth;
  unsigned int deepestDepth;
  unsigned int deepestPosition;
  char deepestRule[64];
  unsigned int furthestPosition;
  char furthestRule[64];
};

struct ContextMatch {
  unsigned int tokenStart;
  unsigned int expectedType;
};

static const ContextMatch kContextMatches[] = {
${pairArray}
};

static void traceStart(void* context, const char* name, unsigned int position) {
  ParseTrace* trace = static_cast<ParseTrace*>(context);
  ++trace->depth;
  if (position >= trace->furthestPosition) {
    trace->furthestPosition = position;
    unsigned int index = 0;
    while (name[index] && index + 1 < sizeof(trace->furthestRule)) {
      trace->furthestRule[index] = name[index];
      ++index;
    }
    trace->furthestRule[index] = '\\0';
  }
}

static void traceEnd(void* context, const char*, unsigned int) {
  ParseTrace* trace = static_cast<ParseTrace*>(context);
  if (trace->depth > 0) --trace->depth;
}

static void traceAbort(void* context, const char* name, unsigned int position) {
  ParseTrace* trace = static_cast<ParseTrace*>(context);
  if (trace->depth >= trace->deepestDepth) {
    trace->deepestDepth = trace->depth;
    trace->deepestPosition = position;
    unsigned int index = 0;
    while (name[index] && index + 1 < sizeof(trace->deepestRule)) {
      trace->deepestRule[index] = name[index];
      ++index;
    }
    trace->deepestRule[index] = '\\0';
  }
  if (trace->depth > 0) --trace->depth;
}

static int matchesContextual(void*, unsigned int expected, const MaiaCCParserToken* token) {
  const unsigned int count = ${pairs.length};
  for (unsigned int index = 0; index < count; ++index) {
    if (kContextMatches[index].tokenStart == token->start
        && kContextMatches[index].expectedType == expected) return 1;
  }
  return 0;
}

int main() {
  const MaiaCCParserToken tokens[] = {
${tokenArray.join(',\n')}
  };
  ParseTrace trace = { 0, 0, 0, { 0 }, 0, { 0 } };
  MaiaCCParseEvents events = {
    &trace, 0, 0, traceStart, 0, traceEnd, traceAbort, matchesContextual
  };
  MaiaCCParserState parser;
  maiaCCParserStateInit(&parser, tokens, ${tokenArray.length}, &events);
  if (!maiaCC_parse(&parser)) {
    const MaiaCCParserToken* next = parser.position < parser.tokenCount
        ? tokens + parser.position
        : 0;
    printf("parse failed in %s at token %u of %u, type %u (%s), offset %u; deepest failure %s at %u; furthest start %s at %u\\n",
      trace.deepestRule,
        parser.position, parser.tokenCount, next ? next->type : 0,
      next ? maiaCCParserTokenName(next->type) : "none",
      next ? next->start : 0, trace.deepestRule, trace.deepestPosition,
      trace.furthestRule, trace.furthestPosition);
    return 1;
  }

  MaiaCCParserState emptyParser;
  maiaCCParserStateInit(&emptyParser, 0, 0, &events);
  if (maiaCC_parse(&emptyParser)) return 2;
  return 0;
}
`;
}

test('C++98 parser accepts the same REx grammar tokenized by the JS self-host parser', {
  skip: !findCppCompiler(),
}, async () => {
  const source = fs.readFileSync(grammarPath, 'utf8');
  const xml = execFileSync(process.execPath, [rexPath, grammarPath], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const grammar = await new GrammarParser(xml).parse();
  const generator = new CodeGenerator(grammar, { language: 'cpp98' });
  const referenceParser = require(referenceParserPath);
  const jsParser = new referenceParser(source);

  assert.doesNotThrow(() => jsParser.parse());
  const tokens = jsParser.lexer.tokens;
  assert.ok(tokens.length > 0);

  const parserSource = generator.generate();
  const pairs = contextualPairs(generator, tokens);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'maiacc-cpp98-selfhost-'));
  const generatedParserPath = path.join(tempRoot, 'generated-parser.cpp');
  const driverPath = path.join(tempRoot, 'selfhost-driver.cpp');
  const executablePath = path.join(tempRoot, 'selfhost-test');

  try {
    fs.writeFileSync(generatedParserPath, parserSource);
    fs.writeFileSync(driverPath, makeDriver(generator, tokens, pairs));
    const compiler = findCppCompiler();
    const compile = spawnSync(
      compiler,
      ['-std=c++98', '-I', path.resolve(__dirname, '../../../maiaregex'), path.resolve(__dirname, '../../../maiaregex/maia_regex.c'), driverPath, '-o', executablePath],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    assert.equal(
      compile.status,
      0,
      `C++ self-host parser compilation failed:\n${compile.stdout || ''}${compile.stderr || ''}`,
    );

    const execution = spawnSync(executablePath, [], { encoding: 'utf8' });
    assert.equal(
      execution.status,
      0,
      `C++ self-host parser rejected REx.ebnf or accepted an empty token stream:\n${execution.stdout || ''}${execution.stderr || ''}`,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});