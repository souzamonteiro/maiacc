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
      .map((name) => `static bool ${mapRuleName(name)}(MaiaCCParserState* self);`)
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

static bool maiaCC_matchToken(MaiaCCParserState* self, unsigned int expected) {
  const MaiaCCParserToken* token = maiaCC_peek(self);
  if (!token || token->type != expected) return false;
  maiaCC_emitTerminal(self, token);
  ++self->position;
  return true;
}

static bool maiaCC_matchContextualToken(MaiaCCParserState* self, unsigned int expected) {
  const MaiaCCParserToken* token = maiaCC_peek(self);
  if (!token) return false;
  const bool accepted = token->type == expected
      || (self->events && self->events->matchesContextual
          && self->events->matchesContextual(self->events->context, expected, token));
  if (!accepted) return false;
  maiaCC_emitTerminal(self, token);
  ++self->position;
  return true;
}

static void maiaCC_expectToken(MaiaCCParserState* self, unsigned int expected) {
  if (!maiaCC_matchToken(self, expected)) throw 1;
}

static void maiaCC_expectContextualToken(MaiaCCParserState* self, unsigned int expected) {
  if (!maiaCC_matchContextualToken(self, expected)) throw 1;
}

{{rulePrototypes}}
`,

  parserHeader: '',
  startRule: `static bool maiaCC_parse(MaiaCCParserState* self) {
  self->position = 0;
  return {{startRule}}(self) && self->position == self->tokenCount;
}
`,
  parserFooter: `
#endif
`,

  ruleFunction: `
static bool {{ruleName}}(MaiaCCParserState* self) {
  const unsigned int __ruleStart = self->position;
  maiaCC_startNonterminal(self, {{ruleLabel}});
  try {
{{ruleBody}}    maiaCC_endNonterminal(self, {{ruleLabel}});
    return true;
  } catch (int) {
    self->position = __ruleStart;
    maiaCC_abortNonterminal(self, {{ruleLabel}});
    return false;
  }
}
`,

  emptyRule: `    /* empty production */
`,
  alternativesHeader: `    bool _matched = false;
`,
  alternativeTryBlock: `    if (!_matched) {
      const unsigned int _alternativeStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      try {
{{sequence}}        _matched = true;
      } catch (int) {
        self->position = _alternativeStart;
        maiaCC_restoreEvents(self, _eventMark);
      }
    }
`,
  alternativesFailure: `    if (!_matched) throw 1;
`,

  terminalOptional: `    maiaCC_matchToken(self, {{token}});
`,
  terminalZeroOrMore: `    while (maiaCC_matchToken(self, {{token}})) {}
`,
  terminalOneOrMore: `    maiaCC_expectToken(self, {{token}});
    while (maiaCC_matchToken(self, {{token}})) {}
`,
  terminalDefault: `    maiaCC_expectToken(self, {{token}});
`,

  lexicalOptional: `    maiaCC_matchToken(self, {{token}});
`,
  lexicalZeroOrMore: `    while (maiaCC_matchToken(self, {{token}})) {}
`,
  lexicalOneOrMore: `    maiaCC_expectToken(self, {{token}});
    while (maiaCC_matchToken(self, {{token}})) {}
`,
  lexicalDefault: `    maiaCC_expectToken(self, {{token}});
`,
  contextualLexicalOptional: `    maiaCC_matchContextualToken(self, {{token}});
`,
  contextualLexicalZeroOrMore: `    while (maiaCC_matchContextualToken(self, {{token}})) {}
`,
  contextualLexicalOneOrMore: `    maiaCC_expectContextualToken(self, {{token}});
    while (maiaCC_matchContextualToken(self, {{token}})) {}
`,
  contextualLexicalDefault: `    maiaCC_expectContextualToken(self, {{token}});
`,

  nonterminalOptional: `    {
      const unsigned int _optionalStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      if (!{{name}}(self)) {
        self->position = _optionalStart;
        maiaCC_restoreEvents(self, _eventMark);
      }
    }
`,
  nonterminalZeroOrMore: `    while (true) {
      const unsigned int _iterationStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      if (!{{name}}(self)) {
        self->position = _iterationStart;
        maiaCC_restoreEvents(self, _eventMark);
        break;
      }
{{boundaryCheck}}      if (self->position == _iterationStart) break;
    }
`,
  nonterminalOneOrMore: `    {
      unsigned int _count = 0;
      while (true) {
        const unsigned int _iterationStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
        if (!{{name}}(self)) {
          self->position = _iterationStart;
          maiaCC_restoreEvents(self, _eventMark);
          break;
        }
{{boundaryCheck}}        if (self->position == _iterationStart) break;
        ++_count;
      }
      if (_count == 0) throw 1;
    }
`,
  nonterminalDefault: `    if (!{{name}}(self)) throw 1;
`,

  groupAlternativesHeader: `      bool _matchedAlternative = false;
`,
  groupAlternativeTryBlock: `      if (!_matchedAlternative) {
        const unsigned int _alternativeStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
        try {
{{sequence}}          _matchedAlternative = true;
        } catch (int) {
          self->position = _alternativeStart;
          maiaCC_restoreEvents(self, _eventMark);
        }
      }
`,
  groupAlternativesFailure: `      if (!_matchedAlternative) throw 1;
`,
  groupZeroOrMore: `    while (true) {
      const unsigned int _iterationStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      try {
{{attempt}}      } catch (int) {
        self->position = _iterationStart;
        maiaCC_restoreEvents(self, _eventMark);
        break;
      }
      if (self->position == _iterationStart) break;
    }
`,
  groupOneOrMore: `    {
      unsigned int _count = 0;
      while (true) {
        const unsigned int _iterationStart = self->position;
        const unsigned int _eventMark = maiaCC_checkpointEvents(self);
        try {
{{attempt}}        } catch (int) {
          self->position = _iterationStart;
          maiaCC_restoreEvents(self, _eventMark);
          break;
        }
        if (self->position == _iterationStart) break;
        ++_count;
      }
      if (_count == 0) throw 1;
    }
`,
  groupOptional: `    {
      const unsigned int _optionalStart = self->position;
      const unsigned int _eventMark = maiaCC_checkpointEvents(self);
      try {
{{attempt}}      } catch (int) {
        self->position = _optionalStart;
        maiaCC_restoreEvents(self, _eventMark);
      }
    }
`,
  groupDefault: `    {
{{attempt}}    }
`,
};