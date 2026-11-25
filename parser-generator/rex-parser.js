class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
    this.charClassDepth = 0;
    this.templateDepth = 0;
    this.templateBraceDepthStack = [];
    this.tokenPatterns = [    { type: 'TOKEN__3C__3F_', regex: /^<\?/ },    { type: 'TOKEN__3F__3E_', regex: /^\?>/ },    { type: 'TOKEN__3A__3A__3D_', regex: /^::=/ },    { type: 'TOKEN__7C_', regex: /^\|/ },    { type: 'TOKEN__2F_', regex: /^\// },    { type: 'TOKEN__3F_', regex: /^\?/ },    { type: 'TOKEN__2A_', regex: /^\*/ },    { type: 'TOKEN__2B_', regex: /^\+/ },    { type: 'TOKEN__28_', regex: /^\(/ },    { type: 'TOKEN__29_', regex: /^\)/ },    { type: 'TOKEN__3C__3F_TOKENS_3F__3E_', regex: /^<\?TOKENS\?>/ },    { type: 'TOKEN__2E_', regex: /^\./ },    { type: 'TOKEN__26_', regex: /^&/ },    { type: 'TOKEN__2D_', regex: /^-/ },    { type: 'TOKEN__24_', regex: /^\$/ },    { type: 'TOKEN__5B_', regex: /^\[/ },    { type: 'TOKEN__5B__5E_', regex: /^\[\^/ },    { type: 'TOKEN__5D_', regex: /^\]/ },    { type: 'TOKEN__2F__2A_', regex: /^\/\*/ },    { type: 'TOKEN_ws', regex: /^ws/ },    { type: 'TOKEN__3A_', regex: /^:/ },    { type: 'TOKEN_explicit', regex: /^explicit/ },    { type: 'TOKEN_definition', regex: /^definition/ },    { type: 'TOKEN__2A__2F_', regex: /^\*\// },    { type: 'TOKEN__3E__3E_', regex: /^>>/ },    { type: 'TOKEN__3C__3C_', regex: /^<</ },    { type: 'TOKEN__5C__5C_', regex: /^\\\\/ },    { type: 'TOKEN__3D__3D_', regex: /^==/ },    { type: 'TOKEN__3C__3F_ENCORE_3F__3E_', regex: /^<\?ENCORE\?>/ },    { type: 'Name', regex: /^(?:[A-Z]|_|[a-z]|[\u00c0-\u00d6]|[\u00d8-\u00f6]|[\u00f8-\u02ff]|[\u0370-\u037d]|[\u037f-\u1fff]|[\u200c-\u200d]|[\u2070-\u218f]|[\u2c00-\u2fef]|[\u3001-\ud7ff]|[\uf900-\ufdcf]|[\ufdf0-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udb7e][\udc00-\udfff]|[\udb7f][\udc00-\udfff]))(?:(?:(?:[A-Z]|_|[a-z]|[\u00c0-\u00d6]|[\u00d8-\u00f6]|[\u00f8-\u02ff]|[\u0370-\u037d]|[\u037f-\u1fff]|[\u200c-\u200d]|[\u2070-\u218f]|[\u2c00-\u2fef]|[\u3001-\ud7ff]|[\uf900-\ufdcf]|[\ufdf0-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udb7e][\udc00-\udfff]|[\udb7f][\udc00-\udfff]))|-|\.|[0-9]|·|[\u0300-\u036f]|[\u203f-\u2040]))*/ },    { type: 'Space', regex: /^(?:(?:(?:\u0009|\u000d| ))+|\u000a)/ },    { type: 'StringLiteral', regex: /^(?:"(?:[^"\u0009\u000a\u000d])*"|'(?:[^'\u0009\u000a\u000d])*')/ },    { type: 'CaretName', regex: /^\^(?:(?:[A-Z]|_|[a-z]|[\u00c0-\u00d6]|[\u00d8-\u00f6]|[\u00f8-\u02ff]|[\u0370-\u037d]|[\u037f-\u1fff]|[\u200c-\u200d]|[\u2070-\u218f]|[\u2c00-\u2fef]|[\u3001-\ud7ff]|[\uf900-\ufdcf]|[\ufdf0-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udb7e][\udc00-\udfff]|[\udb7f][\udc00-\udfff]))(?:(?:(?:[A-Z]|_|[a-z]|[\u00c0-\u00d6]|[\u00d8-\u00f6]|[\u00f8-\u02ff]|[\u0370-\u037d]|[\u037f-\u1fff]|[\u200c-\u200d]|[\u2070-\u218f]|[\u2c00-\u2fef]|[\u3001-\ud7ff]|[\uf900-\ufdcf]|[\ufdf0-\ufffd]|(?:[\ud800][\udc00-\udfff]|[\ud801-\udb7e][\udc00-\udfff]|[\udb7f][\udc00-\udfff]))|-|\.|[0-9]|·|[\u0300-\u036f]|[\u203f-\u2040]))*)?/ },    { type: 'CharCode', regex: /^#x(?:[0-9a-fA-F])+/ },    { type: 'Char', regex: /^(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))/ },    { type: 'CharRange', regex: /^(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))-(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))/ },    { type: 'CharCodeRange', regex: /^#x(?:[0-9a-fA-F])+-#x(?:[0-9a-fA-F])+/ },    { type: 'EquivalenceLookAhead', regex: /^(?=(?:\[(?:(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))|#x(?:[0-9a-fA-F])+|(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))-(?:[\ud800-\udbff][\udc00-\udfff]|[^\u0009\u000a\u000d#\]]|#(?=[^0-9a-fA-F]))|#x(?:[0-9a-fA-F])+-#x(?:[0-9a-fA-F])+)\](?:(?:(?:(?:(?:(?:\u0009|\u000d| ))+|\u000a)|\/\/(?:[^\u000a])*(?:\u000a)?|\/\*(?:(?:(?:[\s\S])*))\*\/))+)?==))/ },    { type: 'skip', regex: /^(?:[\u0009\u000A\u000D\u0020]+|\/\/[^\n]*\n?|\/\*(?!\s*ws\s*:)[\s\S]*?\*\/)+/, skip: true },    ];
  }

  isTemplateSpanPattern(pos, kind) {
    // Deterministic scan to avoid regex escaping issues in generated code.
    if (this.input[pos] !== '}') return false;
    const BACKTICK = String.fromCharCode(96);
    const max = Math.min(this.input.length, pos + 256);
    let i = pos + 1;
    while (i < max) {
      const ch = this.input[i];
      const next = this.input[i + 1];

      if (ch === '\\') {
        i += 2;
        continue;
      }

      if (ch === '$' && next === '{') {
        return kind === 'TemplateMiddle';
      }

      if (ch === BACKTICK) {
        return kind === 'TemplateTail';
      }

      i++;
    }
    return false;
  }

  enterTemplateSpan() {
    this.templateDepth++;
    this.templateBraceDepthStack.push(0);
  }

  exitTemplateSpan() {
    if (this.templateDepth > 0) {
      this.templateDepth--;
    }
    if (this.templateBraceDepthStack.length > 0) {
      this.templateBraceDepthStack.pop();
    }
  }

  currentTemplateBraceDepth() {
    return this.templateBraceDepthStack.length === 0
      ? 0
      : this.templateBraceDepthStack[this.templateBraceDepthStack.length - 1];
  }

  incrementTemplateBraceDepth() {
    if (this.templateBraceDepthStack.length > 0) {
      this.templateBraceDepthStack[this.templateBraceDepthStack.length - 1] += 1;
    }
  }

  decrementTemplateBraceDepth() {
    const index = this.templateBraceDepthStack.length - 1;
    if (index >= 0 && this.templateBraceDepthStack[index] > 0) {
      this.templateBraceDepthStack[index] -= 1;
    }
  }
  
  tokenize() {
    while (this.position < this.input.length) {
      let bestPattern = null;
      let bestMatch = null;
      const candidates = [];

      const isGenericNameType = (type) => (
        type === 'Name' || type === 'NameChar' || type === 'NameStartChar'
      );

      for (const pattern of this.tokenPatterns) {
        // Template spans are synthesized only when a closing brace ends the
        // active interpolation. Their raw patterns must not consume ordinary
        // braces from nested expressions.
        if (pattern.type === 'TemplateMiddle' || pattern.type === 'TemplateTail') {
          continue;
        }

        const regex = pattern.regex;
        const match = this.input.substring(this.position).match(regex);

        if (match && match.index === 0 && match[0].length > 0) {
          let effectivePattern = pattern;
          let effectiveMatch = match;
          // When parsing template expressions, disambiguate closing brace as template span boundary.
          if (this.templateDepth > 0
            && pattern.type === 'TOKEN__7D_'
            && this.currentTemplateBraceDepth() === 0) {
            if (this.isTemplateSpanPattern(this.position, 'TemplateMiddle')) {
              const templateMiddle = this.tokenPatterns.find((candidate) => candidate.type === 'TemplateMiddle');
              const templateMatch = templateMiddle
                ? this.input.substring(this.position).match(templateMiddle.regex)
                : null;
              if (templateMatch && templateMatch.index === 0 && templateMatch[0].length > 0) {
                effectivePattern = templateMiddle;
                effectiveMatch = templateMatch;
              }
            } else if (this.isTemplateSpanPattern(this.position, 'TemplateTail')) {
              const templateTail = this.tokenPatterns.find((candidate) => candidate.type === 'TemplateTail');
              const templateMatch = templateTail
                ? this.input.substring(this.position).match(templateTail.regex)
                : null;
              if (templateMatch && templateMatch.index === 0 && templateMatch[0].length > 0) {
                effectivePattern = templateTail;
                effectiveMatch = templateMatch;
              }
            }
          }

          candidates.push({ pattern: effectivePattern, match: effectiveMatch });
          if (!bestMatch
              || effectiveMatch[0].length > bestMatch[0].length
              || (effectiveMatch[0].length === bestMatch[0].length && effectivePattern.skip && !bestPattern.skip)
              || (effectiveMatch[0].length === bestMatch[0].length
                  && bestPattern
                  && isGenericNameType(bestPattern.type)
                  && !isGenericNameType(effectivePattern.type))) {
            bestPattern = effectivePattern;
            bestMatch = effectiveMatch;
          }
        }
      }

      // Inside character classes, prefer Char/CharCode/CharRange-like tokens
      // over generic global terminals such as '?>' that can overmatch.
      if (this.charClassDepth > 0 && candidates.length > 0) {
        const preferredTypes = new Set(['CharCodeRange', 'CharRange', 'CharCode', 'Char', 'TOKEN__5D_']);
        const preferred = candidates.filter(c => preferredTypes.has(c.pattern.type));
        if (preferred.length > 0) {
          let localBest = preferred[0];
          for (const c of preferred) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      // If current input starts with whitespace and a skip token is available,
      // prefer skipping whitespace first instead of consuming it as grammar data.
      if (candidates.length > 0 && /^\s/.test(this.input.substring(this.position, this.position + 1))) {
        const skipCandidates = candidates.filter(c => c.pattern.skip);
        if (skipCandidates.length > 0) {
          let localBest = skipCandidates[0];
          for (const c of skipCandidates) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      if (!bestMatch) {
        throw new Error(`Unexpected character at position ${this.position}: '${this.input[this.position]}'`);
      }

      if (!bestPattern.skip) {
        const matchedToken = {
          type: bestPattern.type,
          value: bestMatch[0],
          start: this.position,
          end: this.position + bestMatch[0].length
        };
        this.tokens.push(matchedToken);

        if (bestPattern.type === 'TOKEN__5B_' || bestPattern.type === 'TOKEN__5B__5E_') {
          this.charClassDepth++;
        } else if (bestPattern.type === 'TOKEN__5D_' && this.charClassDepth > 0) {
          this.charClassDepth--;
        } else if (bestPattern.type === 'TOKEN__7B_' && this.templateDepth > 0) {
          this.incrementTemplateBraceDepth();
        } else if (bestPattern.type === 'TOKEN__7D_' && this.templateDepth > 0) {
          this.decrementTemplateBraceDepth();
        } else if (bestPattern.type === 'TemplateHead') {
          this.enterTemplateSpan();
        } else if (bestPattern.type === 'TemplateTail') {
          this.exitTemplateSpan();
        }
      }

      this.position += bestMatch[0].length;
    }
    
    // Add EOF token
    this.tokens.push({
      type: 'EOF',
      value: '',
      start: this.position,
      end: this.position
    });
    
    return this.tokens;
  }
}

class Parser {
  constructor(input, eventHandler = null) {
    this.lexer = new Lexer(input);
    this.tokens = this.lexer.tokenize();
    this.position = 0;
    this.errors = [];
    this._lastError = null;
    this.eventHandler = eventHandler;
    this.failureMemo = new Set();
    this.successMemo = new Map();
    this._canMemoSuccess = !eventHandler || typeof eventHandler.appendNode === 'function';
  }
  
  peek(offset = 0) {
    return this.tokens[this.position + offset];
  }
  
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      const errObj = {
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      };
      this._lastError = errObj;
      if (this.errors.length === 0 || this.position >= this.errors[this.errors.length - 1].position) {
        this.errors.length = 0;
        this.errors.push(errObj);
      }
      return false;
    }
    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(expectedType, token.value, this.position);
    }
    this.position++;
    return true;
  }
  
  match(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
        this.eventHandler.terminal(expectedType, token.value, this.position);
      }
      this.position++;
      return true;
    }
    return false;
  }

  consumeContextual(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      return this.consume(expectedType);
    }

    const pattern = this.lexer.tokenPatterns.find((candidate) => candidate.type === expectedType);
    const match = pattern && token ? token.value.match(pattern.regex) : null;
    if (!match || match.index !== 0 || match[0].length !== token.value.length) {
      const errObj = {
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      };
      this._lastError = errObj;
      if (this.errors.length === 0 || this.position >= this.errors[this.errors.length - 1].position) {
        this.errors.length = 0;
        this.errors.push(errObj);
      }
      return false;
    }

    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(token.type, token.value, this.position);
    }
    this.position++;
    return true;
  }

  markEventState() {
    if (this.eventHandler && typeof this.eventHandler.checkpoint === 'function') {
      return this.eventHandler.checkpoint();
    }
    return null;
  }

  restoreEventState(mark) {
    if (mark !== null && this.eventHandler && typeof this.eventHandler.restore === 'function') {
      this.eventHandler.restore(mark);
    }
  }
  
  getErrorMessage() {
    if (this.errors.length === 0) return 'No errors';
    const err = this.errors[0];
    return `Syntax error: expected ${err.expected}, got ${err.found}`;
  }
  parse() {
    if (!this.parseGrammar()) {
      const err = this._lastError || this.errors[this.errors.length - 1];
      throw new Error(err ? `Expected '${err.expected}', got '${err.found}'` : this.getErrorMessage());
    }
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return undefined;
    }
    if (!next || next.type !== 'EOF') {
      throw new Error(`Unexpected token at end: ${next ? next.type : 'EOF(consumed)'}`);
    }
    return undefined;
  }
  parseGrammar() {
    const __memoStart = this.position;
    const __memoKey = 'Grammar@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Grammar', this.position);
    }
    const __ok = this._parseGrammarBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Grammar', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Grammar', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseGrammarBody() {
    if (!this.parseProlog()) { return false; }
    if (!this.parseSyntaxDefinition()) { return false; }
    // Optional: try parsing LexicalDefinition
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseLexicalDefinition()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing Encore
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseEncore()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    if (!this.consume('EOF')) { return false; }

    return true;
  }
  parseProlog() {
    const __memoStart = this.position;
    const __memoKey = 'Prolog@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Prolog', this.position);
    }
    const __ok = this._parsePrologBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Prolog', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Prolog', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parsePrologBody() {
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseProcessingInstruction()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
      if (this.position === savePos) break;
    }

    return true;
  }
  parseProcessingInstruction() {
    const __memoStart = this.position;
    const __memoKey = 'ProcessingInstruction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ProcessingInstruction', this.position);
    }
    const __ok = this._parseProcessingInstructionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('ProcessingInstruction', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('ProcessingInstruction', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseProcessingInstructionBody() {
    if (!this.consume('TOKEN__3C__3F_')) { return false; }
    if (!this.consume('Name')) { return false; }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('Space')) { _ok_1 = false; } else { while (this.match('Space')) { /* one or more */ } }
      if (_ok_1) {
    if (this.match('DirPIContents')) { /* optional token matched */ }
      }
      if (!_ok_1) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    if (!this.consume('TOKEN__3F__3E_')) { return false; }

    return true;
  }
  parseSyntaxDefinition() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxDefinition@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxDefinition', this.position);
    }
    const __ok = this._parseSyntaxDefinitionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxDefinition', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxDefinition', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxDefinitionBody() {
    {
      let count = 0;
      while (true) {
        const savePos = this.position;
        const saveMark = this.markEventState();
        if (!this.parseSyntaxProduction()) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        if (this.position === savePos) break;
        count++;
      }
      if (count === 0) {
        return false;
      }
    }

    return true;
  }
  parseSyntaxProduction() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxProduction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxProduction', this.position);
    }
    const __ok = this._parseSyntaxProductionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxProduction', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxProduction', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxProductionBody() {
    if (!this.consume('Name')) { return false; }
    if (!this.consume('TOKEN__3A__3A__3D_')) { return false; }
    if (!this.parseSyntaxChoice()) { return false; }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseOption()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
      if (this.position === savePos) break;
    }

    return true;
  }
  parseSyntaxChoice() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxChoice@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxChoice', this.position);
    }
    const __ok = this._parseSyntaxChoiceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxChoice', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxChoice', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxChoiceBody() {
    if (!this.parseSyntaxSequence()) { return false; }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let _ok_1 = true;
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        let _ok_3 = true;
    if (!this.consume('TOKEN__7C_')) { _ok_3 = false; }
      if (_ok_3) {
    if (!this.parseSyntaxSequence()) { _ok_3 = false; }
      }
        if (!_ok_3) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) { _ok_2 = false; }
    }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        let _ok_5 = true;
    if (!this.consume('TOKEN__2F_')) { _ok_5 = false; }
      if (_ok_5) {
    if (!this.parseSyntaxSequence()) { _ok_5 = false; }
      }
        if (!_ok_5) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) { _ok_4 = false; }
    }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
      if (!_ok_1) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

    return true;
  }
  parseSyntaxSequence() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxSequence@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxSequence', this.position);
    }
    const __ok = this._parseSyntaxSequenceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxSequence', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxSequence', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxSequenceBody() {
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseSyntaxItem()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
        // Stop at statement boundaries so next headers/operators are not absorbed.
        const next = this.peek();
        if (next && (
          next.type === 'TOKEN__3A__3A__3D_' ||
          next.type === 'TOKEN__3C__3C_' ||
          next.type === 'TOKEN__3E__3E_' ||
          next.type === 'TOKEN__5C__5C_' ||
          next.type === 'TOKEN__3D__3D_'
        )) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
      if (this.position === savePos) break;
    }

    return true;
  }
  parseSyntaxItem() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxItem@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxItem', this.position);
    }
    const __ok = this._parseSyntaxItemBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxItem', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxItem', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxItemBody() {
    if (!this.parseSyntaxPrimary()) { return false; }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let _ok_1 = true;
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__3F_')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    if (!this.consume('TOKEN__2A_')) { _ok_3 = false; }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    if (!this.consume('TOKEN__2B_')) { _ok_4 = false; }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
      if (!_ok_1) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

    return true;
  }
  parseSyntaxPrimary() {
    const __memoStart = this.position;
    const __memoKey = 'SyntaxPrimary@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SyntaxPrimary', this.position);
    }
    const __ok = this._parseSyntaxPrimaryBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('SyntaxPrimary', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('SyntaxPrimary', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseSyntaxPrimaryBody() {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_1 = true;
    if (!this.parseNameOrString()) { _ok_1 = false; }
      if (_ok_1) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_2 = true;
    if (!this.consume('TOKEN__28_')) { _ok_2 = false; }
      if (_ok_2) {
    if (!this.parseSyntaxChoice()) { _ok_2 = false; }
      }
      if (_ok_2) {
    if (!this.consume('TOKEN__29_')) { _ok_2 = false; }
      }
      if (_ok_2) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_3 = true;
    if (!this.parseProcessingInstruction()) { _ok_3 = false; }
      if (_ok_3) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      return false;
    }

    return true;
  }
  parseLexicalDefinition() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalDefinition@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalDefinition', this.position);
    }
    const __ok = this._parseLexicalDefinitionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalDefinition', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalDefinition', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalDefinitionBody() {
    if (!this.consume('TOKEN__3C__3F_TOKENS_3F__3E_')) { return false; }
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      let _ok_1 = true;
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.parseLexicalProduction()) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    if (!this.parsePreference()) { _ok_3 = false; }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    if (!this.parseDelimiter()) { _ok_4 = false; }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_5 = true;
    if (!this.parseEquivalence()) { _ok_5 = false; }
        if (_ok_5) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
      if (!_ok_1) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

    return true;
  }
  parseLexicalProduction() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalProduction@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalProduction', this.position);
    }
    const __ok = this._parseLexicalProductionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalProduction', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalProduction', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalProductionBody() {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_1 = true;
    if (!this.consume('Name')) { _ok_1 = false; }
        if (_ok_1) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__2E_')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { return false; }
    }
    if (this.match('TOKEN__3F_')) { /* optional matched */ }
    if (!this.consume('TOKEN__3A__3A__3D_')) { return false; }
    if (!this.parseContextChoice()) { return false; }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseOption()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
      if (this.position === savePos) break;
    }

    return true;
  }
  parseContextChoice() {
    const __memoStart = this.position;
    const __memoKey = 'ContextChoice@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ContextChoice', this.position);
    }
    const __ok = this._parseContextChoiceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('ContextChoice', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('ContextChoice', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseContextChoiceBody() {
    if (!this.parseContextExpression()) { return false; }
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('TOKEN__7C_')) { _ok_1 = false; }
      if (_ok_1) {
    if (!this.parseContextExpression()) { _ok_1 = false; }
      }
      if (!_ok_1) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

    return true;
  }
  parseLexicalChoice() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalChoice@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalChoice', this.position);
    }
    const __ok = this._parseLexicalChoiceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalChoice', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalChoice', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalChoiceBody() {
    if (!this.parseLexicalSequence()) { return false; }
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('TOKEN__7C_')) { _ok_1 = false; }
      if (_ok_1) {
    if (!this.parseLexicalSequence()) { _ok_1 = false; }
      }
      if (!_ok_1) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

    return true;
  }
  parseContextExpression() {
    const __memoStart = this.position;
    const __memoKey = 'ContextExpression@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ContextExpression', this.position);
    }
    const __ok = this._parseContextExpressionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('ContextExpression', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('ContextExpression', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseContextExpressionBody() {
    if (!this.parseLexicalSequence()) { return false; }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('TOKEN__26_')) { _ok_1 = false; }
      if (_ok_1) {
    if (!this.parseLexicalItem()) { _ok_1 = false; }
      }
      if (!_ok_1) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

    return true;
  }
  parseLexicalSequence() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalSequence@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalSequence', this.position);
    }
    const __ok = this._parseLexicalSequenceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalSequence', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalSequence', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalSequenceBody() {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_1 = true;
    if (!this.parseLexicalItem()) { _ok_1 = false; }
      if (_ok_1) {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__2D_')) { _ok_2 = false; }
      if (_ok_2) {
    if (!this.parseLexicalItem()) { _ok_2 = false; }
      }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseLexicalItem()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
        // Stop at statement boundaries so next headers/operators are not absorbed.
        const next = this.peek();
        if (next && (
          next.type === 'TOKEN__3A__3A__3D_' ||
          next.type === 'TOKEN__3C__3C_' ||
          next.type === 'TOKEN__3E__3E_' ||
          next.type === 'TOKEN__5C__5C_' ||
          next.type === 'TOKEN__3D__3D_'
        )) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
      if (this.position === savePos) break;
    }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
    }
      }
      if (_ok_1) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_4 = true;
      if (_ok_4) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      return false;
    }

    return true;
  }
  parseLexicalItem() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalItem@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalItem', this.position);
    }
    const __ok = this._parseLexicalItemBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalItem', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalItem', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalItemBody() {
    if (!this.parseLexicalPrimary()) { return false; }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let _ok_1 = true;
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__3F_')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    if (!this.consume('TOKEN__2A_')) { _ok_3 = false; }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    if (!this.consume('TOKEN__2B_')) { _ok_4 = false; }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
      if (!_ok_1) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

    return true;
  }
  parseLexicalPrimary() {
    const __memoStart = this.position;
    const __memoKey = 'LexicalPrimary@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LexicalPrimary', this.position);
    }
    const __ok = this._parseLexicalPrimaryBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('LexicalPrimary', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('LexicalPrimary', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseLexicalPrimaryBody() {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_1 = true;
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('Name')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    if (!this.consume('TOKEN__2E_')) { _ok_3 = false; }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_1 = false; }
    }
      if (_ok_1) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_4 = true;
    if (!this.consume('StringLiteral')) { _ok_4 = false; }
      if (_ok_4) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_5 = true;
    if (!this.consume('TOKEN__28_')) { _ok_5 = false; }
      if (_ok_5) {
    if (!this.parseLexicalChoice()) { _ok_5 = false; }
      }
      if (_ok_5) {
    if (!this.consume('TOKEN__29_')) { _ok_5 = false; }
      }
      if (_ok_5) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_6 = true;
    if (!this.consume('TOKEN__24_')) { _ok_6 = false; }
      if (_ok_6) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_7 = true;
    if (!this.consume('CharCode')) { _ok_7 = false; }
      if (_ok_7) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_8 = true;
    if (!this.parseCharClass()) { _ok_8 = false; }
      if (_ok_8) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      return false;
    }

    return true;
  }
  parseNameOrString() {
    const __memoStart = this.position;
    const __memoKey = 'NameOrString@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NameOrString', this.position);
    }
    const __ok = this._parseNameOrStringBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('NameOrString', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('NameOrString', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseNameOrStringBody() {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('Name')) { _ok_1 = false; }
      if (_ok_1) {
    // Optional: try parsing Context
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseContext()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
      }
      if (_ok_1) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_2 = true;
    if (!this.consume('StringLiteral')) { _ok_2 = false; }
      if (_ok_2) {
    // Optional: try parsing Context
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseContext()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
      }
      if (_ok_2) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      return false;
    }

    return true;
  }
  parseContext() {
    const __memoStart = this.position;
    const __memoKey = 'Context@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Context', this.position);
    }
    const __ok = this._parseContextBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Context', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Context', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseContextBody() {
    if (!this.consume('CaretName')) { return false; }

    return true;
  }
  parseCharClass() {
    const __memoStart = this.position;
    const __memoKey = 'CharClass@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CharClass', this.position);
    }
    const __ok = this._parseCharClassBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('CharClass', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('CharClass', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseCharClassBody() {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_1 = true;
    if (!this.consume('TOKEN__5B_')) { _ok_1 = false; }
        if (_ok_1) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__5B__5E_')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { return false; }
    }
    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        let _ok_3 = true;
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    if (!this.consume('Char')) { _ok_4 = false; }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_5 = true;
    if (!this.consume('CharCode')) { _ok_5 = false; }
        if (_ok_5) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_6 = true;
    if (!this.consume('CharRange')) { _ok_6 = false; }
        if (_ok_6) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_7 = true;
    if (!this.consume('CharCodeRange')) { _ok_7 = false; }
        if (_ok_7) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_3 = false; }
        if (!_ok_3) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) { return false; }
    }
    if (!this.consume('TOKEN__5D_')) { return false; }

    return true;
  }
  parseOption() {
    const __memoStart = this.position;
    const __memoKey = 'Option@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Option', this.position);
    }
    const __ok = this._parseOptionBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Option', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Option', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseOptionBody() {
    if (!this.consume('TOKEN__2F__2A_')) { return false; }
    while (this.match('Space')) { /* zero or more */ }
    if (!this.consume('TOKEN_ws')) { return false; }
    if (!this.consume('TOKEN__3A_')) { return false; }
    while (this.match('Space')) { /* zero or more */ }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_1 = true;
    if (!this.consume('TOKEN_explicit')) { _ok_1 = false; }
        if (_ok_1) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN_definition')) { _ok_2 = false; }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { return false; }
    }
    while (this.match('Space')) { /* zero or more */ }
    if (!this.consume('TOKEN__2A__2F_')) { return false; }

    return true;
  }
  parsePreference() {
    const __memoStart = this.position;
    const __memoKey = 'Preference@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Preference', this.position);
    }
    const __ok = this._parsePreferenceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Preference', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Preference', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parsePreferenceBody() {
    if (!this.parseNameOrString()) { return false; }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_1 = true;
    if (!this.consume('TOKEN__3E__3E_')) { _ok_1 = false; }
      if (_ok_1) {
    {
      let count = 0;
      while (true) {
        const savePos = this.position;
        const saveMark = this.markEventState();
        if (!this.parseNameOrString()) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        // Stop at statement boundaries so next headers/operators are not absorbed.
        const next = this.peek();
        if (next && (
          next.type === 'TOKEN__3A__3A__3D_' ||
          next.type === 'TOKEN__3C__3C_' ||
          next.type === 'TOKEN__3E__3E_' ||
          next.type === 'TOKEN__5C__5C_' ||
          next.type === 'TOKEN__3D__3D_'
        )) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        if (this.position === savePos) break;
        count++;
      }
      if (count === 0) {
        _ok_1 = false;
      }
    }
      }
        if (_ok_1) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_2 = true;
    if (!this.consume('TOKEN__3C__3C_')) { _ok_2 = false; }
      if (_ok_2) {
    {
      let count = 0;
      while (true) {
        const savePos = this.position;
        const saveMark = this.markEventState();
        if (!this.parseNameOrString()) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        // Stop at statement boundaries so next headers/operators are not absorbed.
        const next = this.peek();
        if (next && (
          next.type === 'TOKEN__3A__3A__3D_' ||
          next.type === 'TOKEN__3C__3C_' ||
          next.type === 'TOKEN__3E__3E_' ||
          next.type === 'TOKEN__5C__5C_' ||
          next.type === 'TOKEN__3D__3D_'
        )) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        if (this.position === savePos) break;
        count++;
      }
      if (count === 0) {
        _ok_2 = false;
      }
    }
      }
        if (_ok_2) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { return false; }
    }

    return true;
  }
  parseDelimiter() {
    const __memoStart = this.position;
    const __memoKey = 'Delimiter@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Delimiter', this.position);
    }
    const __ok = this._parseDelimiterBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Delimiter', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Delimiter', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseDelimiterBody() {
    if (!this.consume('Name')) { return false; }
    if (!this.consume('TOKEN__5C__5C_')) { return false; }
    {
      let count = 0;
      while (true) {
        const savePos = this.position;
        const saveMark = this.markEventState();
        if (!this.parseNameOrString()) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        // Stop at statement boundaries so next headers/operators are not absorbed.
        const next = this.peek();
        if (next && (
          next.type === 'TOKEN__3A__3A__3D_' ||
          next.type === 'TOKEN__3C__3C_' ||
          next.type === 'TOKEN__3E__3E_' ||
          next.type === 'TOKEN__5C__5C_' ||
          next.type === 'TOKEN__3D__3D_'
        )) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
        if (this.position === savePos) break;
        count++;
      }
      if (count === 0) {
        return false;
      }
    }

    return true;
  }
  parseEquivalence() {
    const __memoStart = this.position;
    const __memoKey = 'Equivalence@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Equivalence', this.position);
    }
    const __ok = this._parseEquivalenceBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Equivalence', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Equivalence', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseEquivalenceBody() {
    if (!this.consume('EquivalenceLookAhead')) { return false; }
    if (!this.parseEquivalenceCharRange()) { return false; }
    if (!this.consume('TOKEN__3D__3D_')) { return false; }
    if (!this.parseEquivalenceCharRange()) { return false; }

    return true;
  }
  parseEquivalenceCharRange() {
    const __memoStart = this.position;
    const __memoKey = 'EquivalenceCharRange@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('EquivalenceCharRange', this.position);
    }
    const __ok = this._parseEquivalenceCharRangeBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('EquivalenceCharRange', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('EquivalenceCharRange', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseEquivalenceCharRangeBody() {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_1 = true;
    if (!this.consume('StringLiteral')) { _ok_1 = false; }
      if (_ok_1) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      let _ok_2 = true;
    if (!this.consume('TOKEN__5B_')) { _ok_2 = false; }
      if (_ok_2) {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_3 = true;
    if (!this.consume('Char')) { _ok_3 = false; }
        if (_ok_3) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_4 = true;
    if (!this.consume('CharCode')) { _ok_4 = false; }
        if (_ok_4) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_5 = true;
    if (!this.consume('CharRange')) { _ok_5 = false; }
        if (_ok_5) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let _ok_6 = true;
    if (!this.consume('CharCodeRange')) { _ok_6 = false; }
        if (_ok_6) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { _ok_2 = false; }
    }
      }
      if (_ok_2) {
    if (!this.consume('TOKEN__5D_')) { _ok_2 = false; }
      }
      if (_ok_2) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      return false;
    }

    return true;
  }
  parseEncore() {
    const __memoStart = this.position;
    const __memoKey = 'Encore@' + __memoStart;
    if (this.failureMemo.has(__memoKey)) {
      return false;
    }
    if (this._canMemoSuccess) {
      const __memoHit = this.successMemo.get(__memoKey);
      if (__memoHit !== undefined) {
        this.position = __memoHit.endPos;
        if (this.eventHandler && __memoHit.node) {
          this.eventHandler.appendNode(__memoHit.node);
        }
        return true;
      }
    }
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Encore', this.position);
    }
    const __ok = this._parseEncoreBody();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('Encore', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('Encore', this.position);
      }
    }
    if (__ok && this._canMemoSuccess) {
      if (this.successMemo.size > 200000) {
        this.successMemo.clear();
      }
      this.successMemo.set(__memoKey, {
        endPos: this.position,
        node: this.eventHandler ? this.eventHandler.lastClosedNode : null
      });
    }
    return __ok;
  }

  _parseEncoreBody() {
    if (!this.consume('TOKEN__3C__3F_ENCORE_3F__3E_')) { return false; }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parseProcessingInstruction()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
      if (this.position === savePos) break;
    }

    return true;
  }
}

module.exports = Parser;