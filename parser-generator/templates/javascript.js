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
    this.tokenPatterns = [`,
  
  // Token definition
  token: `    { type: '{{name}}', regex: /^{{pattern}}/ },`,
  
  // Token that should be skipped (whitespace)
  skipToken: `    { type: 'skip', regex: /^{{pattern}}/, skip: true },`,
  
  // Lexer footer
  lexerFooter: `    ];
    this.lineStarts = [0];
    for (let i = 0; i < this.input.length; i++) {
      if (this.input[i] === '\\n') {
        this.lineStarts.push(i + 1);
      }
    }
  }

  getLineColumn(offset) {
    const clamped = Math.max(0, Math.min(Number(offset) || 0, this.input.length));
    let low = 0;
    let high = this.lineStarts.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const start = this.lineStarts[mid];
      const next = mid + 1 < this.lineStarts.length ? this.lineStarts[mid + 1] : this.input.length + 1;

      if (clamped < start) {
        high = mid - 1;
      } else if (clamped >= next) {
        low = mid + 1;
      } else {
        return {
          line: mid + 1,
          column: clamped - start + 1,
          offset: clamped
        };
      }
    }

    return { line: 1, column: clamped + 1, offset: clamped };
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
  }

  exitTemplateSpan() {
    if (this.templateDepth > 0) {
      this.templateDepth--;
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
        // Template middle/tail tokens are context-sensitive and must only
        // be considered while lexing inside an active template expression.
        if ((pattern.type === 'TemplateMiddle' || pattern.type === 'TemplateTail') && this.templateDepth === 0) {
          continue;
        }

        const regex = pattern.regex;
        const match = this.input.substring(this.position).match(regex);

        if (match && match.index === 0 && match[0].length > 0) {
          let effectivePattern = pattern;
          // When parsing template expressions, disambiguate closing brace as template span boundary.
          if (this.templateDepth > 0 && pattern.type === 'TOKEN__7D_') {
            if (this.isTemplateSpanPattern(this.position, 'TemplateMiddle')) {
              effectivePattern = { ...pattern, type: 'TemplateMiddle' };
            } else if (this.isTemplateSpanPattern(this.position, 'TemplateTail')) {
              effectivePattern = { ...pattern, type: 'TemplateTail' };
            }
          }

          candidates.push({ pattern: effectivePattern, match });
          if (!bestMatch
              || match[0].length > bestMatch[0].length
              || (match[0].length === bestMatch[0].length && effectivePattern.skip && !bestPattern.skip)
              || (match[0].length === bestMatch[0].length
                  && bestPattern
                  && isGenericNameType(bestPattern.type)
                  && !isGenericNameType(effectivePattern.type))) {
            bestPattern = effectivePattern;
            bestMatch = match;
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
        const loc = this.getLineColumn(this.position);
        throw new Error(\`Unexpected character at line \${loc.line}, column \${loc.column} (offset \${loc.offset}): '\${this.input[this.position]}'\`);
      }

      if (!bestPattern.skip) {
        const startLoc = this.getLineColumn(this.position);
        const endLoc = this.getLineColumn(this.position + bestMatch[0].length);
        const matchedToken = {
          type: bestPattern.type,
          value: bestMatch[0],
          start: this.position,
          end: this.position + bestMatch[0].length,
          line: startLoc.line,
          column: startLoc.column,
          endLine: endLoc.line,
          endColumn: endLoc.column
        };
        this.tokens.push(matchedToken);

        if (bestPattern.type === 'TOKEN__5B_' || bestPattern.type === 'TOKEN__5B__5E_') {
          this.charClassDepth++;
        } else if (bestPattern.type === 'TOKEN__5D_' && this.charClassDepth > 0) {
          this.charClassDepth--;
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
      end: this.position,
      line: this.getLineColumn(this.position).line,
      column: this.getLineColumn(this.position).column,
      endLine: this.getLineColumn(this.position).line,
      endColumn: this.getLineColumn(this.position).column
    });
    
    return this.tokens;
  }
}`,
  
  // Parser header
  parserHeader: `class Parser {
  constructor(input, eventHandler = null) {
    this.lexer = new Lexer(input);
    this.tokens = this.lexer.tokenize();
    this.position = 0;
    this.errors = [];
    this.eventHandler = eventHandler;
  }
  
  peek() {
    return this.tokens[this.position];
  }
  
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      const offset = token ? token.start : (this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].end : 0);
      const loc = this.lexer.getLineColumn(offset);
      this.errors.push({
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position,
        offset,
        line: loc.line,
        column: loc.column
      });
      throw new Error(\`Expected '\${expectedType}', got '\${token ? token.type : 'EOF'}' at line \${loc.line}, column \${loc.column} (offset \${offset})\`);
    }
    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(expectedType, token.value, this.position);
    }
    this.position++;
    return token;
  }
  
  match(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      this.position++;
      return true;
    }
    return false;
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
    const line = Number(err.line) || 1;
    const column = Number(err.column) || 1;
    const offset = Number(err.offset) || 0;
    return \`Syntax error: expected \${err.expected}, got \${err.found} at line \${line}, column \${column} (offset \${offset})\`;
  }`,
  
  // Entry parse method
  startRule: `
  parse() {
    const result = this.parse{{startRule}}();
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return result;
    }
    if (!next || next.type !== 'EOF') {
      const offset = next ? next.start : (this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].end : 0);
      const loc = this.lexer.getLineColumn(offset);
      throw new Error(\`Unexpected token at end: \${next ? next.type : 'EOF(consumed)'} at line \${loc.line}, column \${loc.column} (offset \${offset})\`);
    }
    return result;
  }`,
  
  // Rule function template
  ruleFunction: `
  parse{{ruleName}}() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('{{ruleName}}', this.position);
    }
    let __ok = false;
    try {
{{ruleBody}}
      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('{{ruleName}}', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('{{ruleName}}', this.position);
        }
      }
    }
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
      throw new Error(\`Expected one of: {{expected}}\`);
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
  oneOrMore: `    do {
      // One or more matched
    } while (this.match('{{token}}'));`,
  
  // Call rule
  parseRule: `    this.parse{{rule}}();`,

  // Rule body fragments
  emptyRule: `    // Empty rule`,
  alternativesHeader: `    const _ruleStart = this.position;
    let _matched = false;
`,
  alternativeTryBlock: `    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
{{sequence}}        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
`,
  alternativesFailure: `    if (!_matched) {
      throw new Error(\`Expected one of: {{count}} alternatives\`);
    }
`,

  // Terminal item fragments
  terminalOptional: `    if (this.match('{{token}}')) { /* optional matched */ }
`,
  terminalZeroOrMore: `    while (this.match('{{token}}')) { /* zero or more matched */ }
`,
  terminalOneOrMore: `    do { /* one or more matched */ } while (this.match('{{token}}'));
`,
  terminalDefault: `    this.consume('{{token}}');
`,

  // Lexical nonterminal fragments
  lexicalOptional: `    if (this.match('{{token}}')) { /* optional token matched */ }
`,
  lexicalZeroOrMore: `    while (this.match('{{token}}')) { /* zero or more */ }
`,
  lexicalOneOrMore: `    this.consume('{{token}}');
    while (this.match('{{token}}')) { /* one or more */ }
`,
  lexicalDefault: `    this.consume('{{token}}');
`,

  // Nonterminal item fragments
  nonterminalOptional: `    // Optional: try parsing {{name}}
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parse{{name}}();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
`,
  nonterminalBoundaryCheck: `        // Stop at production header boundary: Name ::= ...
        if (this.peek() && this.peek().type === 'TOKEN__3A__3A__3D_') {
          this.position = savePos;
          this.restoreEventState(saveMark);
          break;
        }
`,
  nonterminalBoundaryGuardNames: ['SyntaxItem', 'LexicalItem'],
  nonterminalZeroOrMore: `    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parse{{name}}();
{{boundaryCheck}}        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
`,
  nonterminalOneOrMore: `    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parse{{name}}();
{{boundaryCheck}}        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one {{name}}');
    }
`,
  nonterminalDefault: `    this.parse{{name}}();
`,

  // Group item fragments
  groupAlternativesHeader: `      let _matchedAlt = false;
`,
  groupAlternativeTryBlock: `      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
{{sequence}}          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
`,
  groupAlternativesFailure: `      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
`,
  groupZeroOrMore: `    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
{{attempt}}      } catch (e) {
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
        try {
{{attempt}}        } catch (e) {
          this.position = _loopStart;
          this.restoreEventState(_loopMark);
          break;
        }
        if (this.position === _loopStart) break;
        _count++;
      }
      if (_count === 0) throw new Error('Expected at least one group match');
    }
`,
  groupOptional: `    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
{{attempt}}      } catch (e) {
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