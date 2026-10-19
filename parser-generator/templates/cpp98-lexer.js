'use strict';

function compilePattern(pattern) {
  let position = 0;
  const instructions = [];
  const ranges = [];
  const emit = (op, first = 0, second = 0, next = 0) => {
    instructions.push([op, first, second, next]);
    return instructions.length - 1;
  };
  const error = () => { throw new Error(`Unsupported C++98 lexer pattern at ${position}: ${pattern}`); };
  function escaped() {
    const character = pattern[position++];
    if (character === undefined) return error();
    const controls = { n: 10, r: 13, t: 9, v: 11, f: 12, b: 8 };
    if (character in controls) return controls[character];
    if (character === 'u' || character === 'x') {
      const size = character === 'u' ? 4 : 2;
      const hex = pattern.slice(position, position + size);
      if (!new RegExp(`^[0-9a-fA-F]{${size}}$`).test(hex)) return error();
      position += size;
      return parseInt(hex, 16);
    }
    if (character === '0') return 0;
    if (/^[1-9]$/.test(character)) return error();
    return character.charCodeAt(0);
  }
  function atom() {
    const character = pattern[position++];
    if (character === '(') {
      let kind = 'group';
      if (pattern[position] === '?') {
        position++;
        const modifier = pattern[position++];
        if (modifier === '!') kind = 'negative';
        else if (modifier === '=') kind = 'positive';
        else if (modifier !== ':') return error();
      }
      const child = choice();
      if (pattern[position++] !== ')') return error();
      return kind === 'group' ? child : { kind, child };
    }
    if (character === '[') {
      const negated = pattern[position] === '^';
      if (negated) position++;
      const members = [];
      while (position < pattern.length && pattern[position] !== ']') {
        if (pattern[position] === '\\' && /[sSdDwW]/.test(pattern[position + 1] || '')) {
          const shorthand = pattern[position + 1];
          position += 2;
          members.push(...shorthandRanges(shorthand));
          continue;
        }
        const first = pattern[position++] === '\\' ? escaped() : pattern.charCodeAt(position - 1);
        let last = first;
        if (pattern[position] === '-' && pattern[position + 1] !== ']') {
          position++;
          last = pattern[position++] === '\\' ? escaped() : pattern.charCodeAt(position - 1);
        }
        if (last < first) return error();
        members.push([first, last]);
      }
      if (pattern[position++] !== ']') return error();
      return { kind: 'class', members, negated };
    }
    if (character === '\\') {
      if (/[sSdDwW]/.test(pattern[position] || '')) {
        return { kind: 'class', members: shorthandRanges(pattern[position++]), negated: false };
      }
      return { kind: 'char', value: escaped() };
    }
    if (character === '$') return { kind: 'end' };
    if (character === '.') return { kind: 'class', members: [[10, 10], [13, 13], [8232, 8233]], negated: true };
    if (character === undefined || '*+?{}^'.includes(character)) return error();
    return { kind: 'char', value: character.charCodeAt(0) };
  }
  function sequence() {
    const children = [];
    while (position < pattern.length && pattern[position] !== ')' && pattern[position] !== '|') {
      let child = atom();
      if ('*+?'.includes(pattern[position] || '\0')) {
        const quantifier = pattern[position++];
        const lazy = pattern[position] === '?';
        if (lazy) position++;
        child = { kind: 'repeat', child, quantifier, lazy };
      }
      children.push(child);
    }
    return { kind: 'sequence', children };
  }
  function choice() {
    const children = [sequence()];
    while (pattern[position] === '|') { position++; children.push(sequence()); }
    return { kind: 'choice', children };
  }
  function compile(node, next) {
    if (node.kind === 'sequence') return node.children.reduceRight((tail, child) => compile(child, tail), next);
    if (node.kind === 'choice') {
      let entry = compile(node.children[node.children.length - 1], next);
      for (let index = node.children.length - 2; index >= 0; index--) entry = emit(2, compile(node.children[index], next), entry);
      return entry;
    }
    if (node.kind === 'repeat') {
      if (node.quantifier === '?') {
        const entry = compile(node.child, next);
        return node.lazy ? emit(2, next, entry) : emit(2, entry, next);
      }
      const split = emit(2);
      const entry = compile(node.child, split);
      instructions[split] = node.lazy ? [2, next, entry, 0] : [2, entry, next, 0];
      return node.quantifier === '+' ? entry : split;
    }
    if (node.kind === 'char') return emit(1, node.value, 0, next);
    if (node.kind === 'class') {
      const start = ranges.length;
      ranges.push(...node.members);
      return emit(node.negated ? 4 : 3, start, node.members.length, next);
    }
    if (node.kind === 'end') return emit(5, 0, 0, next);
    if (node.kind === 'negative' || node.kind === 'positive') {
      return emit(node.kind === 'negative' ? 6 : 7, compile(node.child, emit(0)), 0, next);
    }
    return error();
  }
  const tree = choice();
  if (position !== pattern.length) error();
  const entry = compile(tree, emit(0));
  return { instructions, ranges, entry };
}

const spaceRanges = [[9, 13], [32, 32], [160, 160], [5760, 5760], [8192, 8202], [8232, 8233], [8239, 8239], [8287, 8287], [12288, 12288], [65279, 65279]];
function shorthandRanges(character) {
  let ranges;
  if (character.toLowerCase() === 's') ranges = spaceRanges;
  else if (character.toLowerCase() === 'd') ranges = [[48, 57]];
  else ranges = [[48, 57], [65, 90], [95, 95], [97, 122]];
  if (character === character.toLowerCase()) return ranges;
  const complement = [];
  let start = 0;
  for (const [first, last] of ranges) {
    if (first > start) complement.push([start, first - 1]);
    start = last + 1;
  }
  if (start <= 65535) complement.push([start, 65535]);
  return complement;
}

function generateScanner(generator) {
  const patterns = generator.collectLexerPatterns();
  const contextual = patterns.filter((token) => !token.isSkip);
  let tables = '';
  const records = [];
  for (const [index, token] of [...patterns, ...contextual].entries()) {
    const compiled = compilePattern(token.pattern);
    tables += `static const MaiaCCLexInstruction maiaCCLexCode${index}[] = {\n${compiled.instructions.map((row) => `  { ${row.join(', ')} }`).join(',\n')}\n};\n`;
    tables += `static const MaiaCCLexRange maiaCCLexRanges${index}[] = {\n${(compiled.ranges.length ? compiled.ranges : [[0, 0]]).map((row) => `  { ${row.join(', ')} }`).join(',\n')}\n};\n`;
    const name = token.isSkip ? 'skip' : token.name;
    const generic = ['Name', 'NameChar', 'NameStartChar'].includes(name);
    const preferred = ['CharCodeRange', 'CharRange', 'CharCode', 'Char', 'TOKEN__5D_'].includes(name);
    const role = { TemplateMiddle: 1, TemplateTail: 2, TemplateHead: 3, TOKEN__7B_: 4, TOKEN__7D_: 5, TOKEN__5B_: 6, TOKEN__5B__5E_: 6, TOKEN__5D_: 7 }[name] || 0;
    records.push(`  { maiaCCLexCode${index}, maiaCCLexRanges${index}, ${compiled.instructions.length}, ${compiled.entry}, ${generator.mapTokenName(token.name)}, ${token.isSkip ? 1 : 0}, ${generic ? 1 : 0}, ${preferred ? 1 : 0}, ${role}, ${compiled.ranges.length} }`);
  }
  const eof = generator.tokenMap.get('EOF') || { name: 'EOF' };
  return scannerTypes + tables + `static const MaiaCCLexPattern maiaCCLexPatterns[] = {\n${records.length ? records.join(',\n') : '  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }'}\n};
static const unsigned int maiaCCLexPatternCount = ${patterns.length};
static const unsigned int maiaCCLexContextCount = ${records.length};
` + runtime.replace(/MAIACC_LEX_EOF/g, generator.mapTokenName(eof.name));
}

const scannerTypes = String.raw`
typedef MaiaRegexInstruction MaiaCCLexInstruction;
typedef MaiaRegexRange MaiaCCLexRange;
struct MaiaCCLexPattern {
  const MaiaCCLexInstruction* code;
  const MaiaCCLexRange* ranges;
  unsigned int count;
  unsigned int entry;
  unsigned int token;
  int skip;
  int generic;
  int preferred;
  int role;
  unsigned int rangeCount;
};
struct MaiaCCLexerState {
  const char* input;
  unsigned int length;
  unsigned int position;
  unsigned int bytePosition;
  unsigned int tokenCount;
  int failed;
};
static void maiaCCLexerStateInit(MaiaCCLexerState* self, const char* input, unsigned int length) {
  self->input = input;
  self->length = length;
  self->position = 0;
  self->bytePosition = 0;
  self->tokenCount = 0;
  self->failed = 0;
}
`;

const runtime = String.raw`
static int maiaCCLexWhitespace(unsigned int value) {
  return (value >= 9 && value <= 13) || value == 32 || value == 160 || value == 5760
      || (value >= 8192 && value <= 8202) || value == 8232 || value == 8233
      || value == 8239 || value == 8287 || value == 12288 || value == 65279;
}

static int maiaCCLexDecode(const char* input, unsigned int length,
    unsigned int* units, unsigned int* offsets, unsigned int* count) {
  unsigned int position = 0;
  *count = 0;
  while (position < length) {
    unsigned int start = position;
    unsigned int first = (unsigned char)input[position++];
    unsigned int value = first;
    unsigned int extra = 0;
    unsigned int minimum = 0;
    if (first >= 194 && first <= 223) { value = first & 31; extra = 1; minimum = 128; }
    else if (first >= 224 && first <= 239) { value = first & 15; extra = 2; minimum = 2048; }
    else if (first >= 240 && first <= 244) { value = first & 7; extra = 3; minimum = 65536; }
    else if (first >= 128) return 0;
    if (extra > length - position) return 0;
    while (extra > 0) {
      unsigned int byte = (unsigned char)input[position++];
      if (byte < 128 || byte > 191) return 0;
      value = (value << 6) | (byte & 63);
      --extra;
    }
    if (value < minimum || value > 1114111 || (value >= 55296 && value <= 57343)) return 0;
    offsets[*count] = start;
    if (value > 65535) {
      value -= 65536;
      units[(*count)++] = 55296 + (value >> 10);
      offsets[*count] = start;
      units[(*count)++] = 56320 + (value & 1023);
    } else units[(*count)++] = value;
  }
  offsets[*count] = length;
  return 1;
}

static int maiaCCLexMatch(const MaiaCCLexPattern* pattern, const unsigned int* units,
    unsigned int length, unsigned int position) {
  MaiaRegexProgram program = { pattern->code, pattern->ranges, pattern->count, pattern->rangeCount, pattern->entry };
  unsigned int end = 0;
  int result = maia_regex_exec(&program, units, length, position, 0, &end);
  if (result == MAIA_REGEX_MATCH) return (int)end;
  return result == MAIA_REGEX_NOMATCH ? -1 : -2;
}

static int maiaCCLexerTokenize(MaiaCCLexerState* self, MaiaCCParserToken* tokens, unsigned int capacity) {
  self->tokenCount = 0;
  self->position = 0;
  self->bytePosition = 0;
  self->failed = 0;
  if (!self->input || !tokens || !capacity || self->length > 2147483646U) { self->failed = 1; return 0; }
  size_t entries = (size_t)self->length + 1;
  if (entries > ((size_t)-1) / (3 * sizeof(unsigned int))) { self->failed = 2; return 0; }
  unsigned int* storage = (unsigned int*)malloc(entries * 3 * sizeof(unsigned int));
  if (!storage) { self->failed = 2; return 0; }
  unsigned int* units = storage;
  unsigned int* offsets = storage + entries;
  unsigned int* braces = storage + 2 * entries;
  unsigned int length = 0;
  unsigned int classDepth = 0;
  unsigned int templateDepth = 0;
  if (!maiaCCLexDecode(self->input, self->length, units, offsets, &length)) self->failed = 1;
  int middle = -1;
  int tail = -1;
  for (unsigned int index = 0; index < maiaCCLexPatternCount; ++index) {
    if (maiaCCLexPatterns[index].role == 1) middle = (int)index;
    if (maiaCCLexPatterns[index].role == 2) tail = (int)index;
  }
  while (!self->failed && self->position < length) {
    int best = -1;
    int bestEnd = -1;
    int preferred = -1;
    int preferredEnd = -1;
    int whitespace = -1;
    int whitespaceEnd = -1;
    for (unsigned int index = 0; index < maiaCCLexPatternCount; ++index) {
      int candidate = (int)index;
      const MaiaCCLexPattern* pattern = maiaCCLexPatterns + candidate;
      if (pattern->role == 1 || pattern->role == 2) continue;
      int end = maiaCCLexMatch(pattern, units, length, self->position);
      if (end == -2) { self->failed = 2; break; }
      if (end <= (int)self->position) continue;
      if (templateDepth && pattern->role == 5 && braces[templateDepth - 1] == 0) {
        unsigned int limit = self->position + 256;
        if (limit > length) limit = length;
        for (unsigned int scan = self->position + 1; scan < limit; ++scan) {
          if (units[scan] == 92) { ++scan; continue; }
          int span = -1;
          if (units[scan] == 36 && scan + 1 < length && units[scan + 1] == 123) span = middle;
          else if (units[scan] == 96) span = tail;
          else continue;
          if (span >= 0) {
            int spanEnd = maiaCCLexMatch(maiaCCLexPatterns + span, units, length, self->position);
            if (spanEnd == -2) self->failed = 2;
            if (spanEnd > (int)self->position) { candidate = span; end = spanEnd; pattern = maiaCCLexPatterns + span; }
          }
          break;
        }
      }
      if (best < 0 || end > bestEnd || (end == bestEnd && pattern->skip && !maiaCCLexPatterns[best].skip)
          || (end == bestEnd && maiaCCLexPatterns[best].generic && !pattern->generic)) { best = candidate; bestEnd = end; }
      if (classDepth && pattern->preferred && end > preferredEnd) { preferred = candidate; preferredEnd = end; }
      if (pattern->skip && end > whitespaceEnd) { whitespace = candidate; whitespaceEnd = end; }
    }
    if (preferred >= 0) { best = preferred; bestEnd = preferredEnd; }
    if (whitespace >= 0 && maiaCCLexWhitespace(units[self->position])) { best = whitespace; bestEnd = whitespaceEnd; }
    if (self->failed) break;
    if (best < 0) { self->failed = 1; break; }
    const MaiaCCLexPattern* pattern = maiaCCLexPatterns + best;
    if (!pattern->skip) {
      if (self->tokenCount + 1 >= capacity) { self->failed = 3; break; }
      MaiaCCParserToken* token = tokens + self->tokenCount++;
      token->type = pattern->token;
      token->value = self->input + offsets[self->position];
      token->length = offsets[bestEnd] - offsets[self->position];
      token->start = self->position;
      token->end = (unsigned int)bestEnd;
      if (pattern->role == 6) ++classDepth;
      else if (pattern->role == 7 && classDepth) --classDepth;
      else if (pattern->role == 4 && templateDepth) ++braces[templateDepth - 1];
      else if (pattern->role == 5 && templateDepth && braces[templateDepth - 1]) --braces[templateDepth - 1];
      else if (pattern->role == 3) braces[templateDepth++] = 0;
      else if (pattern->role == 2 && templateDepth) --templateDepth;
    }
    self->position = (unsigned int)bestEnd;
    self->bytePosition = offsets[self->position];
  }
  if (!self->failed) {
    MaiaCCParserToken* token = tokens + self->tokenCount++;
    token->type = MAIACC_LEX_EOF;
    token->value = self->input + self->length;
    token->length = 0;
    token->start = length;
    token->end = length;
  }
  free(storage);
  return !self->failed;
}

static int maiaCCLexMatchesContextual(unsigned int expected, const MaiaCCParserToken* token) {
  size_t entries = (size_t)token->length + 1;
  if (entries > ((size_t)-1) / (2 * sizeof(unsigned int))) return 0;
  unsigned int* units = (unsigned int*)malloc(entries * 2 * sizeof(unsigned int));
  if (!units) return 0;
  unsigned int length = 0;
  int accepted = 0;
  if (maiaCCLexDecode(token->value, token->length, units, units + entries, &length)) {
    for (unsigned int index = maiaCCLexPatternCount; index < maiaCCLexContextCount; ++index) {
      if (maiaCCLexPatterns[index].token == expected) {
        accepted = maiaCCLexMatch(maiaCCLexPatterns + index, units, length, 0) == (int)length;
        break;
      }
    }
  }
  free(units);
  return accepted;
}
`;

module.exports = { generateScanner, compilePattern };