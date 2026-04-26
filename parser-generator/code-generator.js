// code-generator.js - Generates JavaScript code from a parsed grammar
const templates = require('./templates/javascript');

class CodeGenerator {
  constructor(grammar) {
    this.grammar = grammar;
    this.tokenMap = this.buildTokenMap();
  }

  renderTemplate(template, values = {}) {
    let rendered = template;
    for (const [key, value] of Object.entries(values)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }

  getBoundaryCheck(name) {
    const guarded = new Set(templates.nonterminalBoundaryGuardNames || []);
    if (!guarded.has(name)) return '';
    return templates.nonterminalBoundaryCheck || '';
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
    } else if (item.type === 'difference') {
      // Lexical difference (A - B)
      const lft = item.left;
      const rgt = item.right;
      if (
        lft.type === 'anyChar' && lft.quantifier === 'exactly1' &&
        rgt.type === 'literal' && rgt.quantifier === 'exactly1' && rgt.value.length === 1
      ) {
        // Simple single-char exclusion: any char except the given literal → [^char]
        const ch = rgt.value;
        const esc = this.escapeCharClassChar(ch);
        base = `[^${esc}]`;
      } else if (
        (lft.type === 'anyChar' || (lft.type === 'tokenRef' && lft.value === 'SourceCharacter')) &&
        lft.quantifier === 'exactly1' &&
        rgt.type === 'group'
      ) {
        // anyChar - group: exclude all single-char literals and known token refs in the group
        const excluded = this.extractLiteralsFromGroup(rgt);
        if (excluded.length > 0) {
          const charClass = excluded
            .map(ch => this.escapeCharClassChar(ch))
            .join('');
          base = `[^${charClass}]`;
        } else {
          base = this.lexicalItemToRegex(lft, visiting);
        }
      } else {
        // Complex or unsupported difference: fall back to matching A (original behaviour)
        base = this.lexicalItemToRegex(lft, visiting);
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
    extractLiteralsFromGroup(group) {
      if (!group || group.type !== 'group' || !group.patterns) return [];
      const chars = [];
      for (const pattern of group.patterns) {
        if (!Array.isArray(pattern) || pattern.length === 0) continue;
        if (pattern.length === 1) {
          const item = pattern[0];
          if (item.type === 'literal') {
            const ch = this.decodeSingleLiteralChar(item.value);
            if (ch != null) chars.push(ch);
          } else if (item.type === 'tokenRef' && item.value === 'LineTerminator') {
            chars.push('\n', '\r', '\u2028', '\u2029');
          }
        }
      }
      return chars;
    }

    escapeCharClassChar(ch) {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\u2028') return '\\u2028';
      if (ch === '\u2029') return '\\u2029';
      return /[\]\\^-]/.test(ch) ? '\\' + ch : ch;
    }

    decodeSingleLiteralChar(value) {
      if (typeof value !== 'string' || value.length === 0) return null;
      if (value.length === 1) return value;
      if (value === '\\\\') return '\\';
      return null;
    }
  
  escapeRegex(str) {
    let escaped = '';
    for (const char of str) {
      const code = char.codePointAt(0);
      if (code < 0x20 || code === 0x7F || code === 0x2028 || code === 0x2029) {
        // For control characters, create Unicode escape for regex literal
        // In regex literal /pattern/, \uXXXX needs single backslash  
        escaped += String.fromCharCode(92) + `u${code.toString(16).padStart(4, '0')}`;
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
    let i = 0;
    
    while (i < content.length) {
      // Preserve Unicode escape sequences like \uXXXX that grammar-parser provides
      if (content[i] === '\\' && content[i + 1] === 'u' && 
          i + 5 < content.length &&
          /[0-9a-fA-F]/.test(content[i + 2]) &&
          /[0-9a-fA-F]/.test(content[i + 3]) &&
          /[0-9a-fA-F]/.test(content[i + 4]) &&
          /[0-9a-fA-F]/.test(content[i + 5])) {
        // This looks like a Unicode escape - preserve it as-is
        result += content.substring(i, i + 6);
        i += 6;
        continue;
      }

      const char = content[i];
      const code = char.codePointAt(0);
      
      // Characters that need escaping in character classes
      if (code < 0x20 || code === 0x7F || code === 0x2028 || code === 0x2029) {
        result += `\\u${code.toString(16).padStart(4, '0')}`;
      } else if (char === '\\') {
        // Escape backslashes
        result += '\\\\';
      } else if (char === ']') {
        // Keep closing bracket literal valid inside generated character classes.
        result += '\\]';
      } else {
        // No escaping needed for other characters when we have \uXXXX escapes
        result += char;
      }
      i++;
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
    const orderedLexicalNames = this.getOrderedLexicalTokenNames();
    
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
    for (const name of orderedLexicalNames) {
      const token = this.grammar.tokens.get(name);
      if (!token) continue;
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

  getOrderedLexicalTokenNames() {
    const names = [...this.grammar.tokens.keys()];
    if (names.length <= 1) return names;

    const index = new Map(names.map((n, i) => [n, i]));
    const adj = new Map(names.map(n => [n, new Set()]));
    const indeg = new Map(names.map(n => [n, 0]));

    const prefs = Array.isArray(this.grammar.lexicalPreferences)
      ? this.grammar.lexicalPreferences
      : [];

    const resolveTokenName = (atom) => {
      if (!atom) return null;
      if (atom.kind === 'name') return this.grammar.tokens.has(atom.value) ? atom.value : null;
      if (atom.kind === 'literal') {
        // Literal preferences are naturally honored by emitting literal tokens before
        // lexical tokens. Keep only lexical token names here.
        return this.grammar.tokens.has(atom.value) ? atom.value : null;
      }
      return null;
    };

    for (const pref of prefs) {
      const low = resolveTokenName(pref.lower);
      const high = resolveTokenName(pref.higher);
      if (!low || !high || low === high) continue;
      if (!adj.get(high).has(low)) {
        adj.get(high).add(low);
        indeg.set(low, indeg.get(low) + 1);
      }
    }

    const ready = names.filter(n => indeg.get(n) === 0).sort((a, b) => index.get(a) - index.get(b));
    const out = [];

    while (ready.length > 0) {
      const current = ready.shift();
      out.push(current);
      const nexts = [...adj.get(current)].sort((a, b) => index.get(a) - index.get(b));
      for (const next of nexts) {
        indeg.set(next, indeg.get(next) - 1);
        if (indeg.get(next) === 0) {
          ready.push(next);
          ready.sort((a, b) => index.get(a) - index.get(b));
        }
      }
    }

    // If there is a cycle in preferences, preserve original order as a safe fallback.
    return out.length === names.length ? out : names;
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
      return templates.emptyRule;
    }
    
    if (rule.sequences.length === 1) {
      return this.generateSequence(rule.sequences[0]);
    }

    // Multiple alternatives with backtracking (no early return)
    let alternatives = templates.alternativesHeader;

    const orderedSequences = [...rule.sequences].sort((a, b) => {
      const aEmpty = a.length === 0;
      const bEmpty = b.length === 0;
      if (aEmpty === bEmpty) return 0;
      return aEmpty ? 1 : -1; // non-empty alternatives first
    });

    for (let i = 0; i < orderedSequences.length; i++) {
      const seq = orderedSequences[i];
      alternatives += this.renderTemplate(templates.alternativeTryBlock, {
        sequence: this.generateSequence(seq)
      });
    }

    alternatives += this.renderTemplate(templates.alternativesFailure, {
      count: String(rule.sequences.length)
    });

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
        return this.renderTemplate(templates.terminalOptional, { token: tokenName });
      case 'zeroOrMore':
        return this.renderTemplate(templates.terminalZeroOrMore, { token: tokenName });
      case 'oneOrMore':
        return this.renderTemplate(templates.terminalOneOrMore, { token: tokenName });
      default:
        return this.renderTemplate(templates.terminalDefault, { token: tokenName });
    }
  }
  
  generateNonterminal(item) {
    // If the name is a lexical token, consume it instead of calling a parse rule
    if (this.grammar.tokens.has(item.value)) {
      switch (item.quantifier) {
        case 'optional':
          return this.renderTemplate(templates.lexicalOptional, { token: item.value });
        case 'zeroOrMore':
          return this.renderTemplate(templates.lexicalZeroOrMore, { token: item.value });
        case 'oneOrMore':
          return this.renderTemplate(templates.lexicalOneOrMore, { token: item.value });
        default:
          return this.renderTemplate(templates.lexicalDefault, { token: item.value });
      }
    }

    switch (item.quantifier) {
      case 'optional':
        return this.renderTemplate(templates.nonterminalOptional, { name: item.value });
      case 'zeroOrMore':
        {
          const boundaryCheck = this.getBoundaryCheck(item.value);
        return this.renderTemplate(templates.nonterminalZeroOrMore, {
          name: item.value,
          boundaryCheck
        });
        }
      case 'oneOrMore':
        {
          const boundaryCheck = this.getBoundaryCheck(item.value);
        return this.renderTemplate(templates.nonterminalOneOrMore, {
          name: item.value,
          boundaryCheck
        });
        }
      default:
        return this.renderTemplate(templates.nonterminalDefault, { name: item.value });
    }
  }
  
  generateGroup(item) {
    // Body that tries to match the group once and throws on failure.
    let attempt = '';
    if (item.sequences.length === 1) {
      attempt += this.generateSequence(item.sequences[0]);
    } else {
      attempt += templates.groupAlternativesHeader;
      for (const seq of item.sequences) {
        attempt += this.renderTemplate(templates.groupAlternativeTryBlock, {
          sequence: this.generateSequence(seq)
        });
      }
      attempt += templates.groupAlternativesFailure;
    }

    switch (item.quantifier) {
      case 'zeroOrMore':
        return this.renderTemplate(templates.groupZeroOrMore, { attempt });
      case 'oneOrMore':
        return this.renderTemplate(templates.groupOneOrMore, { attempt });
      case 'optional':
        return this.renderTemplate(templates.groupOptional, { attempt });
      default:
        return this.renderTemplate(templates.groupDefault, { attempt });
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