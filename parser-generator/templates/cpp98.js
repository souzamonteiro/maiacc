'use strict';

function cppIdentifier(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, (character) =>
    `_x${character.codePointAt(0).toString(16)}_`,
  );
}

function cppStringLiteral(value) {
  return `"${String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`;
}

function mapTokenName(name) {
  return `MAIACC_TOKEN_${cppIdentifier(name)}`;
}

function mapRuleName(name) {
  return `maiaCC_parse_${cppIdentifier(name)}`;
}

function generateBoundaryCheck(generator) {
  const boundaries = ['::=', '<<', '>>', '\\\\', '==']
    .map((literal) => generator.getTokenName(literal))
    .map((token) => `__next->type == ${token}`)
    .join(' ||\n            ');
  return `        const MaiaCCParserToken* __next = maiaCC_peek(self);
        if (__next && (${boundaries})) {
          self->position = _iterationStart;
          maiaCC_restoreEvents(self, _eventMark);
          break;
        }
`;
}

function generateLexer(generator) {
  let code = module.exports.lexerHeader;
  const tokens = [...generator.tokenMap.values()];

  for (const token of tokens) {
    code += generator.renderTemplate(module.exports.token, {
      tokenName: mapTokenName(token.name),
      id: String(token.id),
    });
  }

  code += generator.renderTemplate(module.exports.lexerFooter, {
    tokenCount: String(tokens.length + 1),
    tokenCases: tokens
      .map((token) => `    case ${mapTokenName(token.name)}: return ${cppStringLiteral(token.name)};`)
      .join('\n'),
    rulePrototypes: [...generator.grammar.rules.keys()]
      .map((name) => `static int ${mapRuleName(name)}(MaiaCCParserState* self);`)
      .join('\n'),
  });
  return code;
}

module.exports = {
  mapTokenName,
  mapRuleName,
  cppStringLiteral,
  generateLexer,
  nonterminalBoundaryGuardNames: ['SyntaxItem', 'LexicalItem', 'NameOrString'],
  generateBoundaryCheck,

  lexerHeader: `#ifndef MAIACC_GENERATED_CPP98_PARSER_H
#define MAIACC_GENERATED_CPP98_PARSER_H

`,
  token: `#define {{tokenName}} {{id}}
`,
  lexerFooter: `#define MAIACC_TOKEN_COUNT {{tokenCount}}

static const char* maiaCCParserTokenName(unsigned int type) {
  switch (type) {
{{tokenCases}}
    default: return "UNKNOWN";
  }
}

struct MaiaCCParserToken {
  unsigned int type;
  const char* value;
  unsigned int length;
  unsigned int start;
  unsigned int end;
};

struct MaiaCCParseEvents {
  void* context;
  unsigned int (*checkpoint)(void*);
  void (*restore)(void*, unsigned int);
  void (*startNonterminal)(void*, const char*, unsigned int);
  void (*terminal)(void*, unsigned int, const char*, unsigned int, unsigned int);
  void (*endNonterminal)(void*, const char*, unsigned int);
  void (*abortNonterminal)(void*, const char*, unsigned int);
  int (*matchesContextual)(void*, unsigned int, const MaiaCCParserToken*);
};

struct MaiaCCParserState {
  const MaiaCCParserToken* tokens;
  unsigned int tokenCount;
  unsigned int position;
  const MaiaCCParseEvents* events;
  int failed;
};

static void maiaCCParserStateInit(
    MaiaCCParserState* self,
    const MaiaCCParserToken* tokens,
    unsigned int tokenCount,
    const MaiaCCParseEvents* events) {
  self->tokens = tokens;
  self->tokenCount = tokenCount;
  self->position = 0;
  self->events = events;
  self->failed = 0;
}

static const MaiaCCParserToken* maiaCC_peek(const MaiaCCParserState* self) {
  return self->position < self->tokenCount ? self->tokens + self->position : 0;
}

static unsigned int maiaCC_checkpointEvents(const MaiaCCParserState* self) {
  return self->events && self->events->checkpoint
      ? self->events->checkpoint(self->events->context)
      : 0;
}

static void maiaCC_restoreEvents(const MaiaCCParserState* self, unsigned int mark) {
  if (self->events && self->events->restore) {
    self->events->restore(self->events->context, mark);
  }
}

static void maiaCC_startNonterminal(const MaiaCCParserState* self, const char* name) {
  if (self->events && self->events->startNonterminal) {
    self->events->startNonterminal(self->events->context, name, self->position);
  }
}

static void maiaCC_endNonterminal(const MaiaCCParserState* self, const char* name) {
  if (self->events && self->events->endNonterminal) {
    self->events->endNonterminal(self->events->context, name, self->position);
  }
}

static void maiaCC_abortNonterminal(const MaiaCCParserState* self, const char* name) {
  if (self->events && self->events->abortNonterminal) {
    self->events->abortNonterminal(self->events->context, name, self->position);
  }
}

static void maiaCC_emitTerminal(
    const MaiaCCParserState* self,
    const MaiaCCParserToken* token) {
  if (self->events && self->events->terminal && token) {
    self->events->terminal(
        self->events->context,
        token->type,
        token->value,
        token->length,
        self->position);
  }
}

static int maiaCC_matchToken(MaiaCCParserState* self, unsigned int expected) {
  if (self->failed) return 0;
  const MaiaCCParserToken* token = maiaCC_peek(self);
  if (!token || token->type != expected) return 0;
  maiaCC_emitTerminal(self, token);
  ++self->position;
  return 1;
}

static int maiaCC_matchContextualToken(MaiaCCParserState* self, unsigned int expected) {
  if (self->failed) return 0;
  const MaiaCCParserToken* token = maiaCC_peek(self);
  if (!token) return 0;
  const int accepted = token->type == expected
      || (self->events && self->events->matchesContextual
          && self->events->matchesContextual(self->events->context, expected, token));
  if (!accepted) return 0;
  maiaCC_emitTerminal(self, token);
  ++self->position;
  return 1;
}

static int maiaCC_expectToken(MaiaCCParserState* self, unsigned int expected) {
  if (maiaCC_matchToken(self, expected)) return 1;
  self->failed = 1;
  return 0;
}

static int maiaCC_expectContextualToken(MaiaCCParserState* self, unsigned int expected) {
  if (maiaCC_matchContextualToken(self, expected)) return 1;
  self->failed = 1;
  return 0;
}

{{rulePrototypes}}
`,

  parserHeader: '',
  startRule: `static int maiaCC_parse(MaiaCCParserState* self) {
  self->position = 0;
  self->failed = 0;
  return {{startRule}}(self) && !self->failed && self->position == self->tokenCount;
}
`,
  parserFooter: `
#endif
`,

  ruleFunction: `
static int {{ruleName}}(MaiaCCParserState* self) {
  if (self->failed) return 0;
  const unsigned int __ruleStart = self->position;
  const unsigned int __eventMark = maiaCC_checkpointEvents(self);
  maiaCC_startNonterminal(self, {{ruleLabel}});
{{ruleBody}}  if (!self->failed) {
    maiaCC_endNonterminal(self, {{ruleLabel}});
    return 1;
  }
  self->position = __ruleStart;
  maiaCC_restoreEvents(self, __eventMark);
  maiaCC_abortNonterminal(self, {{ruleLabel}});
  return 0;
}
`,

  emptyRule: `    /* empty production */
`,
  alternativesHeader: `    int _matched = 0;
`,
  alternativeTryBlock: `    if (!_matched && !self->failed) {
      const unsigned int _alternativeStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
{{sequence}}      if (!self->failed) {
        _matched = 1;
      } else {
        self->position = _alternativeStart;
        maiaCC_restoreEvents(self, _eventMark);
        self->failed = 0;
      }
    }
`,
  alternativesFailure: `    if (!_matched) self->failed = 1;
`,

  terminalOptional: `    maiaCC_matchToken(self, {{token}});
`,
  terminalZeroOrMore: `    while (maiaCC_matchToken(self, {{token}})) {}
`,
  terminalOneOrMore: `    if (!self->failed) maiaCC_expectToken(self, {{token}});
    while (maiaCC_matchToken(self, {{token}})) {}
`,
  terminalDefault: `    if (!self->failed) maiaCC_expectToken(self, {{token}});
`,

  lexicalOptional: `    maiaCC_matchToken(self, {{token}});
`,
  lexicalZeroOrMore: `    while (maiaCC_matchToken(self, {{token}})) {}
`,
  lexicalOneOrMore: `    if (!self->failed) maiaCC_expectToken(self, {{token}});
    while (maiaCC_matchToken(self, {{token}})) {}
`,
  lexicalDefault: `    if (!self->failed) maiaCC_expectToken(self, {{token}});
`,
  contextualLexicalOptional: `    maiaCC_matchContextualToken(self, {{token}});
`,
  contextualLexicalZeroOrMore: `    while (maiaCC_matchContextualToken(self, {{token}})) {}
`,
  contextualLexicalOneOrMore: `    if (!self->failed) maiaCC_expectContextualToken(self, {{token}});
    while (maiaCC_matchContextualToken(self, {{token}})) {}
`,
  contextualLexicalDefault: `    if (!self->failed) maiaCC_expectContextualToken(self, {{token}});
`,

  nonterminalOptional: `    if (!self->failed) {
      const unsigned int _optionalStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      if (!{{name}}(self)) {
        self->position = _optionalStart;
        maiaCC_restoreEvents(self, _eventMark);
        self->failed = 0;
      }
    }
`,
  nonterminalZeroOrMore: `    while (!self->failed) {
      const unsigned int _iterationStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      if (!{{name}}(self)) {
        self->position = _iterationStart;
        maiaCC_restoreEvents(self, _eventMark);
        self->failed = 0;
        break;
      }
{{boundaryCheck}}      if (self->position == _iterationStart) break;
    }
`,
  nonterminalOneOrMore: `    {
      unsigned int _count = 0;
      while (!self->failed) {
        const unsigned int _iterationStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
        if (!{{name}}(self)) {
          self->position = _iterationStart;
          maiaCC_restoreEvents(self, _eventMark);
          self->failed = 0;
          break;
        }
{{boundaryCheck}}        if (self->position == _iterationStart) break;
        ++_count;
      }
      if (_count == 0) self->failed = 1;
    }
`,
  nonterminalDefault: `    if (!self->failed && !{{name}}(self)) self->failed = 1;
`,

  groupAlternativesHeader: `      int _matchedAlternative = 0;
`,
  groupAlternativeTryBlock: `      if (!_matchedAlternative && !self->failed) {
        const unsigned int _alternativeStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
{{sequence}}        if (!self->failed) {
          _matchedAlternative = 1;
        } else {
          self->position = _alternativeStart;
          maiaCC_restoreEvents(self, _eventMark);
          self->failed = 0;
        }
      }
`,
  groupAlternativesFailure: `      if (!_matchedAlternative) self->failed = 1;
`,
  groupZeroOrMore: `    while (!self->failed) {
      const unsigned int _iterationStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
{{attempt}}      if (self->failed) {
        self->position = _iterationStart;
        maiaCC_restoreEvents(self, _eventMark);
        self->failed = 0;
        break;
      }
      if (self->position == _iterationStart) break;
    }
`,
  groupOneOrMore: `    {
      unsigned int _count = 0;
      while (!self->failed) {
        const unsigned int _iterationStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
    {{attempt}}        if (self->failed) {
          self->position = _iterationStart;
          maiaCC_restoreEvents(self, _eventMark);
          self->failed = 0;
          break;
        }
        if (self->position == _iterationStart) break;
        ++_count;
      }
      if (_count == 0) self->failed = 1;
    }
`,
  groupOptional: `    if (!self->failed) {
      const unsigned int _optionalStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
{{attempt}}      if (self->failed) {
        self->position = _optionalStart;
        maiaCC_restoreEvents(self, _eventMark);
        self->failed = 0;
      }
    }
`,
  groupDefault: `    {
{{attempt}}    }
`,
};
