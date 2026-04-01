// code-generator.js - Generates JavaScript code from a parsed grammar
const templates = require('./templates/javascript');

class CodeGenerator {
  constructor(grammar) {
    this.grammar = grammar;
    this.tokenMap = this.buildTokenMap();
  }
  
  buildTokenMap() {
    const tokenMap = new Map();
    let tokenId = 1;

    // Collect all terminals recursively (including nested groups)
    const collectTerminals = (items) => {
      for (const item of items) {
        if (item.type === 'terminal' && !tokenMap.has(item.value)) {
          tokenMap.set(item.value, {
            id: tokenId++,
            name: `TOKEN_${this.sanitizeName(item.value)}`,
            pattern: this.escapeRegex(item.value),
            source: 'literal'
          });
        } else if (item.type === 'group' && item.sequences) {
          for (const seq of item.sequences) {
            collectTerminals(seq);
          }
        }
      }
    };

    // First, map literal tokens from syntax rules
    for (const [name, rule] of this.grammar.rules) {
      for (const sequence of rule.sequences) {
        collectTerminals(sequence);
      }
    }
    
    // Then, add lexical tokens
    for (const [name, token] of this.grammar.tokens) {
      if (!tokenMap.has(name)) {
        tokenMap.set(name, {
          id: tokenId++,
          name: name,
          pattern: this.tokenPatternToRegex(token),
          isSkip: token.isSkip,
          source: 'lexical'
        });
      }
    }
    
    return tokenMap;
  }
  
  tokenPatternToRegex(token) {
    return this.tokenPatternToRegexInternal(token, new Set());
  }

  tokenPatternToRegexInternal(token, visiting) {
    if (!token || !token.patterns || token.patterns.length === 0) return '';
    if (visiting.has(token.name)) return '';

    visiting.add(token.name);

    const alternatives = token.patterns
      .map(pattern => this.lexicalSequenceToRegex(pattern, visiting))
      .filter(Boolean);

    visiting.delete(token.name);

    if (alternatives.length === 0) return '';
    if (alternatives.length === 1) return alternatives[0];
    return `(?:${alternatives.join('|')})`;
  }

  lexicalSequenceToRegex(pattern, visiting) {
    return pattern.map(item => this.lexicalItemToRegex(item, visiting)).join('');
  }

  lexicalItemToRegex(item, visiting) {
    let base = '';

    if (item.type === 'literal') {
      base = this.escapeRegex(item.value);
    } else if (item.type === 'tokenRef') {
      // EOF is handled by the lexer automatically as the final token.
      if (item.value === 'EOF') {
        base = '';
      } else {
        const refToken = this.grammar.tokens.get(item.value);
        base = refToken ? this.tokenPatternToRegexInternal(refToken, visiting) : '';
      }
    } else if (item.type === 'charclass') {
      if (!item.value) {
        // Empty class: avoid generating [] (invalid regex)
        base = item.negated ? '[\\s\\S]' : '';
      } else {
        const prefix = item.negated ? '^' : '';
        base = `[${prefix}${this.escapeCharClassContent(item.value)}]`;
      }
    } else if (item.type === 'group') {
      const groupAlternatives = (item.patterns || [])
        .map(pattern => this.lexicalSequenceToRegex(pattern, visiting))
        .filter(Boolean);
      if (groupAlternatives.length === 1) {
        base = `(?:${groupAlternatives[0]})`;
      } else if (groupAlternatives.length > 1) {
        base = `(?:${groupAlternatives.join('|')})`;
      }
    } else if (item.type === 'anyChar') {
      base = '[\\s\\S]';
    }

    if (!base) return '';

    switch (item.quantifier) {
      case 'optional':
        return `(?:${base})?`;
      case 'zeroOrMore':
        return `(?:${base})*`;
      case 'oneOrMore':
        return `(?:${base})+`;
      default:
        return base;
    }
  }
  
  escapeRegex(str) {
    let escaped = '';
    for (const char of str) {
      const code = char.codePointAt(0);
      if (code < 0x20 || code === 0x7F) {
        escaped += `\\u${code.toString(16).padStart(4, '0')}`;
      } else if (/[.*+?^${}()|[\]\\/]/.test(char)) {
        escaped += `\\${char}`;
      } else {
        escaped += char;
      }
    }
    return escaped;
  }

  // Escape raw characters in a char-class string so they're safe inside a regex literal
  escapeCharClassContent(content) {
    let result = '';
    for (const char of content) {
      const code = char.codePointAt(0);
      if (code < 0x20 || code === 0x7F) {
        result += `\\u${code.toString(16).padStart(4, '0')}`;
      } else if (char === '\\') {
        result += '\\\\';
      } else if (char === ']') {
        result += '\\]';
      } else {
        result += char;
      }
    }
    return result;
  }
  
  sanitizeName(name) {
    // Convert each non-alphanumeric character to its hex code point for uniqueness
    return name.replace(/[^a-zA-Z0-9]/g, c => {
      const code = c.codePointAt(0);
      return `_${code.toString(16).toUpperCase()}_`;
    });
  }

  regexCanMatchEmpty(pattern) {
    if (!pattern) return true;
    try {
      const re = new RegExp(`^${pattern}`);
      return re.test('');
    } catch {
      return true;
    }
  }
  
  generate() {
    const lexerCode = this.generateLexer();
    const parserCode = this.generateParser();
    
    return `${lexerCode}\n\n${parserCode}`;
  }
  
  generateLexer() {
    let code = templates.lexerHeader;
    const emitted = new Set();
    const referencedLexicalTokens = this.collectReferencedLexicalTokens();
    
    // Add literal tokens
    for (const [value, token] of this.tokenMap) {
      if (token.source === 'literal' && token.pattern && !this.regexCanMatchEmpty(token.pattern) && !token.isSkip && !emitted.has(token.name)) {
        emitted.add(token.name);
        code += templates.token
          .replace(/{{name}}/g, token.name)
          .replace(/{{pattern}}/g, token.pattern);
      }
    }
    
    // Add lexical tokens
    for (const [name, token] of this.grammar.tokens) {
      const suppressedContextTokens = new Set(['EOF', 'DirPIContents']);
      const shouldEmit = !suppressedContextTokens.has(name) && (token.isSkip || referencedLexicalTokens.has(name));
      if (shouldEmit && token.patterns.length > 0 && !emitted.has(name)) {
        let pattern = this.tokenPatternToRegex(token);

        // Special-case REx whitespace: avoid over-greedy comment regexes that can
        // swallow the remainder of the file in single-state lexers.
        if (token.isSkip && name === 'Whitespace') {
          pattern = '(?:[\\u0009\\u000A\\u000D\\u0020]+|\\/\\/[^\\n]*\\n?|\\/\\*(?!\\s*ws\\s*:)[\\s\\S]*?\\*\\/)+';
        }

        if (pattern && !this.regexCanMatchEmpty(pattern)) {
          emitted.add(name);
          if (token.isSkip) {
            code += templates.skipToken
              .replace(/{{name}}/g, name)
              .replace(/{{pattern}}/g, pattern);
          } else {
            code += templates.token
              .replace(/{{name}}/g, name)
              .replace(/{{pattern}}/g, pattern);
          }
        }
      }
    }
    
    code += templates.lexerFooter;
    return code;
  }

  collectReferencedLexicalTokens() {
    const referenced = new Set();

    const visitItems = (items) => {
      for (const item of items) {
        if (item.type === 'nonterminal' && this.grammar.tokens.has(item.value)) {
          referenced.add(item.value);
        } else if (item.type === 'group' && item.sequences) {
          for (const seq of item.sequences) {
            visitItems(seq);
          }
        }
      }
    };

    for (const [, rule] of this.grammar.rules) {
      for (const sequence of rule.sequences) {
        visitItems(sequence);
      }
    }

    return referenced;
  }
  
  generateParser() {
    let code = templates.parserHeader;
    
    // Add the entry parse method
    code += templates.startRule
      .replace(/{{startRule}}/g, this.grammar.startSymbol);
    
    // Generate one function per rule
    for (const [name, rule] of this.grammar.rules) {
      code += this.generateRuleFunction(rule);
    }
    
    code += templates.parserFooter;
    return code;
  }
  
  generateRuleFunction(rule) {
    const body = this.generateRuleBody(rule);
    
    return templates.ruleFunction
      .replace(/{{ruleName}}/g, rule.name)
      .replace(/{{ruleBody}}/g, body);
  }
  
  generateRuleBody(rule) {
    if (rule.sequences.length === 0) {
      return '    // Empty rule';
    }
    
    if (rule.sequences.length === 1) {
      return this.generateSequence(rule.sequences[0]);
    }

    // Multiple alternatives with backtracking (no early return)
    let alternatives = '    const _ruleStart = this.position;\n';
    alternatives += '    let _matched = false;\n';

    const orderedSequences = [...rule.sequences].sort((a, b) => {
      const aEmpty = a.length === 0;
      const bEmpty = b.length === 0;
      if (aEmpty === bEmpty) return 0;
      return aEmpty ? 1 : -1; // non-empty alternatives first
    });

    for (let i = 0; i < orderedSequences.length; i++) {
      const seq = orderedSequences[i];
      alternatives += `    if (!_matched) {\n`;
      alternatives += `      const _ruleMark = this.markEventState();\n`;
      alternatives += `      try {\n`;
      alternatives += this.generateSequence(seq);
      alternatives += `        _matched = true;\n`;
      alternatives += `      } catch (e) {\n`;
      alternatives += `        this.position = _ruleStart;\n`;
      alternatives += `        this.restoreEventState(_ruleMark);\n`;
      alternatives += `      }\n`;
      alternatives += `    }\n`;
    }

    alternatives += `    if (!_matched) {\n`;
    alternatives += `      throw new Error(\`Expected one of: ${rule.sequences.length} alternatives\`);\n`;
    alternatives += `    }\n`;

    return alternatives;
  }
  
  generateSequence(sequence) {
    let code = '';
    
    for (const item of sequence) {
      code += this.generateItem(item);
    }
    
    return code;
  }
  
  generateItem(item) {
    switch (item.type) {
      case 'terminal':
        return this.generateTerminal(item);
      case 'nonterminal':
        return this.generateNonterminal(item);
      case 'group':
        return this.generateGroup(item);
      default:
        return '';
    }
  }
  
  generateTerminal(item) {
    const tokenName = this.getTokenName(item.value);
    
    switch (item.quantifier) {
      case 'optional':
        return `    if (this.match('${tokenName}')) { /* optional matched */ }\n`;
      case 'zeroOrMore':
        return `    while (this.match('${tokenName}')) { /* zero or more matched */ }\n`;
      case 'oneOrMore':
        return `    do { /* one or more matched */ } while (this.match('${tokenName}'));\n`;
      default:
        return `    this.consume('${tokenName}');\n`;
    }
  }
  
  generateNonterminal(item) {
    // If the name is a lexical token, consume it instead of calling a parse rule
    if (this.grammar.tokens.has(item.value)) {
      switch (item.quantifier) {
        case 'optional':
          return `    if (this.match('${item.value}')) { /* optional token matched */ }\n`;
        case 'zeroOrMore':
          return `    while (this.match('${item.value}')) { /* zero or more */ }\n`;
        case 'oneOrMore':
          return `    this.consume('${item.value}');\n` +
                 `    while (this.match('${item.value}')) { /* one or more */ }\n`;
        default:
          return `    this.consume('${item.value}');\n`;
      }
    }

    switch (item.quantifier) {
      case 'optional':
        return `    // Optional: try parsing ${item.value}\n` +
               `    {\n` +
               `      const savePos = this.position;\n` +
               `      const saveMark = this.markEventState();\n` +
               `      try {\n` +
               `        this.parse${item.value}();\n` +
               `      } catch(e) {\n` +
               `        this.position = savePos;\n` +
               `        this.restoreEventState(saveMark);\n` +
               `      }\n` +
               `    }\n`;
      case 'zeroOrMore':
        {
          const boundaryCheck = (item.value === 'SyntaxItem' || item.value === 'LexicalItem')
            ? `        // Stop at production header boundary: Name ::= ...\n` +
              `        if (this.peek() && this.peek().type === 'TOKEN__3A__3A__3D_') {\n` +
              `          this.position = savePos;\n` +
              `          this.restoreEventState(saveMark);\n` +
              `          break;\n` +
              `        }\n`
            : '';
        return `    while (true) {\n` +
               `      const savePos = this.position;\n` +
           `      const saveMark = this.markEventState();\n` +
               `      try {\n` +
               `        this.parse${item.value}();\n` +
               boundaryCheck +
               `        if (this.position === savePos) break;\n` +
               `      } catch(e) {\n` +
               `        this.position = savePos;\n` +
           `        this.restoreEventState(saveMark);\n` +
               `        break;\n` +
               `      }\n` +
               `    }\n`;
        }
      case 'oneOrMore':
        {
          const boundaryCheck = (item.value === 'SyntaxItem' || item.value === 'LexicalItem')
            ? `        // Stop at production header boundary: Name ::= ...\n` +
              `        if (this.peek() && this.peek().type === 'TOKEN__3A__3A__3D_') {\n` +
              `          this.position = savePos;\n` +
              `          this.restoreEventState(saveMark);\n` +
              `          break;\n` +
              `        }\n`
            : '';
        return `    let count = 0;\n` +
               `    while (true) {\n` +
               `      const savePos = this.position;\n` +
           `      const saveMark = this.markEventState();\n` +
               `      try {\n` +
               `        this.parse${item.value}();\n` +
               boundaryCheck +
               `        if (this.position === savePos) break;\n` +
               `        count++;\n` +
               `      } catch(e) {\n` +
               `        this.position = savePos;\n` +
           `        this.restoreEventState(saveMark);\n` +
               `        break;\n` +
               `      }\n` +
               `    }\n` +
               `    if (count === 0) {\n` +
               `      throw new Error('Expected at least one ${item.value}');\n` +
               `    }\n`;
        }
      default:
        return `    this.parse${item.value}();\n`;
    }
  }
  
  generateGroup(item) {
    // Body that tries to match the group once and throws on failure.
    let attempt = '';
    if (item.sequences.length === 1) {
      attempt += this.generateSequence(item.sequences[0]);
    } else {
      attempt += '      let _matchedAlt = false;\n';
      for (const seq of item.sequences) {
        attempt += '      if (!_matchedAlt) {\n';
        attempt += '        const _altStart = this.position;\n';
        attempt += '        const _altMark = this.markEventState();\n';
        attempt += '        try {\n';
        attempt += this.generateSequence(seq);
        attempt += '          _matchedAlt = true;\n';
        attempt += '        } catch (e) {\n';
        attempt += '          this.position = _altStart;\n';
        attempt += '          this.restoreEventState(_altMark);\n';
        attempt += '        }\n';
        attempt += '      }\n';
      }
      attempt += '      if (!_matchedAlt) { throw new Error(\'No group alternative matched\'); }\n';
    }

    switch (item.quantifier) {
      case 'zeroOrMore':
        return `    // Group *\n    while (true) {\n      const _loopStart = this.position;\n      const _loopMark = this.markEventState();\n      try {\n${attempt}      } catch (e) {\n        this.position = _loopStart;\n        this.restoreEventState(_loopMark);\n        break;\n      }\n      if (this.position === _loopStart) break;\n    }\n`;
      case 'oneOrMore':
        return `    // Group +\n    {\n      let _count = 0;\n      while (true) {\n        const _loopStart = this.position;\n        const _loopMark = this.markEventState();\n        try {\n${attempt}        } catch (e) {\n          this.position = _loopStart;\n          this.restoreEventState(_loopMark);\n          break;\n        }\n        if (this.position === _loopStart) break;\n        _count++;\n      }\n      if (_count === 0) throw new Error('Expected at least one group match');\n    }\n`;
      case 'optional':
        return `    // Group ?\n    {\n      const _optStart = this.position;\n      const _optMark = this.markEventState();\n      try {\n${attempt}      } catch (e) {\n        this.position = _optStart;\n        this.restoreEventState(_optMark);\n      }\n    }\n`;
      default:
        return `    // Group\n    {\n${attempt}    }\n`;
    }
  }
  
  getTokenName(value) {
    // Look up the mapped token name
    for (const [tokenValue, token] of this.tokenMap) {
      if (tokenValue === value) {
        return token.name;
      }
    }
    // If not found, create a name based on the literal value
    return `TOKEN_${this.sanitizeName(value)}`;
  }
}

module.exports = CodeGenerator;