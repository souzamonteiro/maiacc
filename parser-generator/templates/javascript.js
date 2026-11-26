// templates/javascript.js
module.exports = {
  // Lexer header
  lexerHeader: `class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
    this.charClassDepth = 0;
    this.templateDepth = 0;
    this.templateBraceDepthStack = [];
    this.tokenPatterns = [`,
  
  // Token definition
  token: `    { type: '{{name}}', regex: /^{{pattern}}/ },`,
  
  // Token that should be skipped (whitespace)
  skipToken: `    { type: 'skip', regex: /^{{pattern}}/, skip: true },`,
  
  // Lexer footer
  lexerFooter: `    ];
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

      if (ch === '\\\\') {
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
      const remainingInput = this.input.substring(this.position);

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
        const match = remainingInput.match(regex);

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
                ? remainingInput.match(templateMiddle.regex)
                : null;
              if (templateMatch && templateMatch.index === 0 && templateMatch[0].length > 0) {
                effectivePattern = templateMiddle;
                effectiveMatch = templateMatch;
              }
            } else if (this.isTemplateSpanPattern(this.position, 'TemplateTail')) {
              const templateTail = this.tokenPatterns.find((candidate) => candidate.type === 'TemplateTail');
              const templateMatch = templateTail
                ? remainingInput.match(templateTail.regex)
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
      if (candidates.length > 0 && /^\\s/.test(this.input.substring(this.position, this.position + 1))) {
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
        throw new Error(\`Unexpected character at position \${this.position}: '\${this.input[this.position]}'\`);
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
}`,
  
  booleanBacktracking: true,

  // Parser header
  parserHeader: `class Parser {
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
    return \`Syntax error: expected \${err.expected}, got \${err.found}\`;
  }`,
  
  // Entry parse method
  startRule: `
  parse() {
    if (!this.parse{{startRule}}()) {
      const err = this._lastError || this.errors[this.errors.length - 1];
      throw new Error(err ? \`Expected '\${err.expected}', got '\${err.found}'\` : this.getErrorMessage());
    }
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return undefined;
    }
    if (!next || next.type !== 'EOF') {
      throw new Error(\`Unexpected token at end: \${next ? next.type : 'EOF(consumed)'}\`);
    }
    return undefined;
  }`,
  
  // Rule function template
  ruleFunction: `
  parse{{ruleName}}() {
    const __memoStart = this.position;
    const __memoKey = '{{ruleName}}@' + __memoStart;
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
      this.eventHandler.startNonterminal('{{ruleName}}', this.position);
    }
    const __ok = this._parse{{ruleName}}Body();
    if (!__ok) {
      if (this.failureMemo.size > 200000) {
        this.failureMemo.clear();
      }
      this.failureMemo.add(__memoKey);
    }
    if (this.eventHandler) {
      if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
        this.eventHandler.endNonterminal('{{ruleName}}', this.position);
      }
      if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
        this.eventHandler.abortNonterminal('{{ruleName}}', this.position);
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

  _parse{{ruleName}}Body() {
{{ruleBody}}
    return true;
  }`,
  
  // Sequence template (AND)
  sequence: `    // Sequence
    {{items}}`,
  
  // Alternatives template (OR)
  alternatives: `    // Alternatives
    {{#each alternatives}}
    if ({{condition}}) {
      {{body}}
    }{{#unless @last}} else {{/unless}}
    {{/each}}
    else {
      throw __BACKTRACK_ERROR;
    }`,
  
  // Consume token
  consumeToken: `    this.consume('{{token}}');`,
  
  // Optional match
  optional: `    if (this.match('{{token}}')) {
      // Optional matched
    }`,
  
  // Zero-or-more match
  zeroOrMore: `    while (this.match('{{token}}')) {
      // Zero or more matched
    }`,
  
  // One-or-more match
  oneOrMore: `    this.consume('{{token}}');
    while (this.match('{{token}}')) {
      // Additional matches
    }`,
  
  // Call rule
  parseRule: `    this.parse{{rule}}();`,

  // Rule body fragments
  emptyRule: `    // Empty rule`,
  alternativesHeader: `    const _ruleStart = this.position;
    let _matched = false;
`,
  alternativeTryBlock: `    if (!_matched) {
      const _ruleMark = this.markEventState();
      let {{okVar}} = true;
{{sequence}}      if ({{okVar}}) {
        _matched = true;
      } else {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
`,
  alternativesFailure: `    if (!_matched) {
      {{fail}}
    }
`,

  // Terminal item fragments
  terminalOptional: `    if (this.match('{{token}}')) { /* optional matched */ }
`,
  terminalZeroOrMore: `    while (this.match('{{token}}')) { /* zero or more matched */ }
`,
  terminalOneOrMore: `    if (!this.consume('{{token}}')) { {{fail}} } else { while (this.match('{{token}}')) { /* additional terminal matched */ } }
`,
  terminalDefault: `    if (!this.consume('{{token}}')) { {{fail}} }
`,

  // Lexical nonterminal fragments
  lexicalOptional: `    if (this.match('{{token}}')) { /* optional token matched */ }
`,
  lexicalZeroOrMore: `    while (this.match('{{token}}')) { /* zero or more */ }
`,
  lexicalOneOrMore: `    if (!this.consume('{{token}}')) { {{fail}} } else { while (this.match('{{token}}')) { /* one or more */ } }
`,
  lexicalDefault: `    if (!this.consume('{{token}}')) { {{fail}} }
`,

  // Contextual lexical references (REx: Name^token). A more specific token
  // may have won lexing, but its full text still has to satisfy Name's regex.
  contextualLexicalOptional: `    { const savePos = this.position; const saveMark = this.markEventState(); if (!this.consumeContextual('{{token}}')) { this.position = savePos; this.restoreEventState(saveMark); } }
`,
  contextualLexicalZeroOrMore: `    while (true) { const savePos = this.position; const saveMark = this.markEventState(); if (!this.consumeContextual('{{token}}')) { this.position = savePos; this.restoreEventState(saveMark); break; } }
`,
  contextualLexicalOneOrMore: `    if (!this.consumeContextual('{{token}}')) { {{fail}} } else { while (true) { const savePos = this.position; const saveMark = this.markEventState(); if (!this.consumeContextual('{{token}}')) { this.position = savePos; this.restoreEventState(saveMark); break; } } }
`,
  contextualLexicalDefault: `    if (!this.consumeContextual('{{token}}')) { {{fail}} }
`,

  // Nonterminal item fragments
  nonterminalOptional: `    // Optional: try parsing {{name}}
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parse{{name}}()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
`,
  nonterminalBoundaryCheck: `        // Stop at statement boundaries so next headers/operators are not absorbed.
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
`,
  nonterminalBoundaryGuardNames: ['SyntaxItem', 'LexicalItem', 'NameOrString'],
  nonterminalZeroOrMore: `    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      if (!this.parse{{name}}()) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
{{boundaryCheck}}      if (this.position === savePos) break;
    }
`,
  nonterminalOneOrMore: `    {
      let count = 0;
      while (true) {
        const savePos = this.position;
        const saveMark = this.markEventState();
        if (!this.parse{{name}}()) {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
{{boundaryCheck}}        if (this.position === savePos) break;
        count++;
      }
      if (count === 0) {
        {{fail}}
      }
    }
`,
  nonterminalDefault: `    if (!this.parse{{name}}()) { {{fail}} }
`,

  // Group item fragments
  groupAlternativesHeader: `      let _matchedAlt = false;
`,
  groupAlternativeTryBlock: `      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        let {{okVar}} = true;
{{sequence}}        if ({{okVar}}) {
          _matchedAlt = true;
        } else {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
`,
  groupAlternativesFailure: `      if (!_matchedAlt) { {{fail}} }
`,
  groupZeroOrMore: `    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      let {{okVar}} = true;
{{attempt}}      if (!{{okVar}}) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
`,
  groupOneOrMore: `    // Group +
    {
      let _count = 0;
      while (true) {
        const _loopStart = this.position;
        const _loopMark = this.markEventState();
        let {{okVar}} = true;
{{attempt}}        if (!{{okVar}}) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) { {{fail}} }
    }
`,
  groupOptional: `    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      let {{okVar}} = true;
{{attempt}}      if (!{{okVar}}) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
`,
  groupDefault: `    // Group
    {
{{attempt}}    }
`,
  
  // Parser footer
  parserFooter: `
}

module.exports = Parser;`
};
