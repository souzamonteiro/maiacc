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
  return `parse_${cppIdentifier(name)}`;
}

function generateBoundaryCheck(generator) {
  const boundaries = ['::=', '<<', '>>', '\\\\', '==']
    .map((literal) => generator.getTokenName(literal))
    .map((token) => `__next->type == ${token}`)
    .join(' ||\n            ');
  return `        const MaiaCCParserToken* __next = this->peek();
        if (__next && (${boundaries})) {
          position_ = _iterationStart;
          this->restoreEvents(_eventMark);
          break;
        }
`;
}

function generateLexer(generator) {
  let code = module.exports.lexerHeader;
  for (const token of generator.tokenMap.values()) {
    code += generator.renderTemplate(module.exports.token, {
      tokenName: mapTokenName(token.name),
      id: String(token.id),
    });
  }
  code += generator.renderTemplate(module.exports.lexerFooter, {
    tokenCount: String(generator.tokenMap.size + 1),
    tokenCases: [...generator.tokenMap.values()]
      .map((token) => `    case ${mapTokenName(token.name)}: return ${cppStringLiteral(token.name)};`)
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

enum MaiaCCParserTokenType {
`,
  token: `    {{tokenName}} = {{id}},
`,
  lexerFooter: `    MAIACC_TOKEN_COUNT = {{tokenCount}}
};

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

class MaiaCCGeneratedParser {
public:
  MaiaCCGeneratedParser(
      const MaiaCCParserToken* tokens,
      unsigned int tokenCount,
      const MaiaCCParseEvents* events)
      : tokens_(tokens), tokenCount_(tokenCount), position_(0), events_(events) {}

  unsigned int position() const { return position_; }
  unsigned int tokenCount() const { return tokenCount_; }

private:
  const MaiaCCParserToken* tokens_;
  unsigned int tokenCount_;
  unsigned int position_;
  const MaiaCCParseEvents* events_;

  const MaiaCCParserToken* peek() const {
    return position_ < tokenCount_ ? tokens_ + position_ : 0;
  }

  unsigned int checkpointEvents() const {
    return events_ && events_->checkpoint
        ? events_->checkpoint(events_->context)
        : 0;
  }

  void restoreEvents(unsigned int mark) const {
    if (events_ && events_->restore) events_->restore(events_->context, mark);
  }

  void startNonterminal(const char* name) const {
    if (events_ && events_->startNonterminal) {
      events_->startNonterminal(events_->context, name, position_);
    }
  }

  void endNonterminal(const char* name) const {
    if (events_ && events_->endNonterminal) {
      events_->endNonterminal(events_->context, name, position_);
    }
  }

  void abortNonterminal(const char* name) const {
    if (events_ && events_->abortNonterminal) {
      events_->abortNonterminal(events_->context, name, position_);
    }
  }

  void emitTerminal(const MaiaCCParserToken* token) const {
    if (events_ && events_->terminal && token) {
      events_->terminal(
          events_->context,
          token->type,
          token->value,
          token->length,
          position_);
    }
  }

  bool matchToken(unsigned int expected) {
    const MaiaCCParserToken* token = peek();
    if (!token || token->type != expected) return false;
    emitTerminal(token);
    ++position_;
    return true;
  }

  bool matchContextualToken(unsigned int expected) {
    const MaiaCCParserToken* token = peek();
    if (!token) return false;
    const bool accepted = token->type == expected
        || (events_ && events_->matchesContextual
            && events_->matchesContextual(events_->context, expected, token));
    if (!accepted) return false;
    emitTerminal(token);
    ++position_;
    return true;
  }

  void expectToken(unsigned int expected) {
    if (!matchToken(expected)) throw 1;
  }

  void expectContextualToken(unsigned int expected) {
    if (!matchContextualToken(expected)) throw 1;
  }

public:
`,

  parserHeader: '',

  startRule: `  bool parse() {
    position_ = 0;
    return {{startRule}}() && position_ == tokenCount_;
  }
`,

  parserFooter: `
};

#endif
`,

  ruleFunction: `
  bool {{ruleName}}() {
    const unsigned int __ruleStart = position_;
    this->startNonterminal({{ruleLabel}});
    try {
{{ruleBody}}      this->endNonterminal({{ruleLabel}});
      return true;
    } catch (int) {
      position_ = __ruleStart;
      this->abortNonterminal({{ruleLabel}});
      return false;
    }
  }
`,

  emptyRule: `      /* empty production */
`,
  alternativesHeader: `      bool _matched = false;
`,
  alternativeTryBlock: `      if (!_matched) {
        const unsigned int _alternativeStart = position_;
        const unsigned int _eventMark = this->checkpointEvents();
        try {
{{sequence}}          _matched = true;
        } catch (int) {
          position_ = _alternativeStart;
          this->restoreEvents(_eventMark);
        }
      }
`,
  alternativesFailure: `      if (!_matched) throw 1;
`,

  terminalOptional: `      this->matchToken({{token}});
`,
  terminalZeroOrMore: `      while (this->matchToken({{token}})) {}
`,
  terminalOneOrMore: `      this->expectToken({{token}});
      while (this->matchToken({{token}})) {}
`,
  terminalDefault: `      this->expectToken({{token}});
`,

  lexicalOptional: `      this->matchToken({{token}});
`,
  lexicalZeroOrMore: `      while (this->matchToken({{token}})) {}
`,
  lexicalOneOrMore: `      this->expectToken({{token}});
      while (this->matchToken({{token}})) {}
`,
  lexicalDefault: `      this->expectToken({{token}});
`,
  contextualLexicalOptional: `      this->matchContextualToken({{token}});
`,
  contextualLexicalZeroOrMore: `      while (this->matchContextualToken({{token}})) {}
`,
  contextualLexicalOneOrMore: `      this->expectContextualToken({{token}});
      while (this->matchContextualToken({{token}})) {}
`,
  contextualLexicalDefault: `      this->expectContextualToken({{token}});
`,

  parseRule: `      if (!this->{{rule}}()) throw 1;
`,
  nonterminalOptional: `      {
        const unsigned int _optionalStart = position_;
        const unsigned int _eventMark = this->checkpointEvents();
        if (!this->{{name}}()) {
          position_ = _optionalStart;
          this->restoreEvents(_eventMark);
        }
      }
`,
  nonterminalZeroOrMore: `      while (true) {
        const unsigned int _iterationStart = position_;
        const unsigned int _eventMark = this->checkpointEvents();
        if (!this->{{name}}()) {
          position_ = _iterationStart;
          this->restoreEvents(_eventMark);
          break;
        }
{{boundaryCheck}}        if (position_ == _iterationStart) break;
      }
`,
  nonterminalOneOrMore: `      {
        unsigned int _count = 0;
        while (true) {
          const unsigned int _iterationStart = position_;
          const unsigned int _eventMark = this->checkpointEvents();
          if (!this->{{name}}()) {
            position_ = _iterationStart;
            this->restoreEvents(_eventMark);
            break;
          }
{{boundaryCheck}}          if (position_ == _iterationStart) break;
          ++_count;
        }
        if (_count == 0) throw 1;
      }
`,
  nonterminalDefault: `      if (!this->{{name}}()) throw 1;
`,

  groupAlternativesHeader: `        bool _matchedAlternative = false;
`,
  groupAlternativeTryBlock: `        if (!_matchedAlternative) {
          const unsigned int _alternativeStart = position_;
          const unsigned int _eventMark = this->checkpointEvents();
          try {
{{sequence}}            _matchedAlternative = true;
          } catch (int) {
            position_ = _alternativeStart;
            this->restoreEvents(_eventMark);
          }
        }
`,
  groupAlternativesFailure: `        if (!_matchedAlternative) throw 1;
`,
  groupZeroOrMore: `      while (true) {
        const unsigned int _iterationStart = position_;
        const unsigned int _eventMark = this->checkpointEvents();
        try {
{{attempt}}        } catch (int) {
          position_ = _iterationStart;
          this->restoreEvents(_eventMark);
          break;
        }
        if (position_ == _iterationStart) break;
      }
`,
  groupOneOrMore: `      {
        unsigned int _count = 0;
        while (true) {
          const unsigned int _iterationStart = position_;
          const unsigned int _eventMark = this->checkpointEvents();
          try {
{{attempt}}          } catch (int) {
            position_ = _iterationStart;
            this->restoreEvents(_eventMark);
            break;
          }
          if (position_ == _iterationStart) break;
          ++_count;
        }
        if (_count == 0) throw 1;
      }
`,
  groupOptional: `      {
        const unsigned int _optionalStart = position_;
        const unsigned int _eventMark = this->checkpointEvents();
        try {
{{attempt}}        } catch (int) {
          position_ = _optionalStart;
          this->restoreEvents(_eventMark);
        }
      }
`,
  groupDefault: `      {
{{attempt}}      }
`,
};