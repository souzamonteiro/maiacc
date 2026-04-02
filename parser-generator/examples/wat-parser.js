class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
    this.charClassDepth = 0;
    this.tokenPatterns = [    { type: 'TOKEN__28_', regex: /^\(/ },    { type: 'TOKEN_module', regex: /^module/ },    { type: 'TOKEN__29_', regex: /^\)/ },    { type: 'TOKEN_type', regex: /^type/ },    { type: 'TOKEN_rec', regex: /^rec/ },    { type: 'TOKEN_sub', regex: /^sub/ },    { type: 'TOKEN_final', regex: /^final/ },    { type: 'TOKEN_func', regex: /^func/ },    { type: 'TOKEN_struct', regex: /^struct/ },    { type: 'TOKEN_array', regex: /^array/ },    { type: 'TOKEN_field', regex: /^field/ },    { type: 'TOKEN_mut', regex: /^mut/ },    { type: 'TOKEN_i8', regex: /^i8/ },    { type: 'TOKEN_i16', regex: /^i16/ },    { type: 'TOKEN_tag', regex: /^tag/ },    { type: 'TOKEN_global', regex: /^global/ },    { type: 'TOKEN_memory', regex: /^memory/ },    { type: 'TOKEN_table', regex: /^table/ },    { type: 'TOKEN_local', regex: /^local/ },    { type: 'TOKEN_import', regex: /^import/ },    { type: 'TOKEN_export', regex: /^export/ },    { type: 'TOKEN_start', regex: /^start/ },    { type: 'TOKEN_data', regex: /^data/ },    { type: 'TOKEN_elem', regex: /^elem/ },    { type: 'TOKEN_declare', regex: /^declare/ },    { type: 'TOKEN_item', regex: /^item/ },    { type: 'TOKEN_offset', regex: /^offset/ },    { type: 'TOKEN_block', regex: /^block/ },    { type: 'TOKEN_loop', regex: /^loop/ },    { type: 'TOKEN_if', regex: /^if/ },    { type: 'TOKEN_then', regex: /^then/ },    { type: 'TOKEN_else', regex: /^else/ },    { type: 'TOKEN_try_5F_table', regex: /^try_table/ },    { type: 'TOKEN_catch', regex: /^catch/ },    { type: 'TOKEN_catch_5F_ref', regex: /^catch_ref/ },    { type: 'TOKEN_catch_5F_all', regex: /^catch_all/ },    { type: 'TOKEN_catch_5F_all_5F_ref', regex: /^catch_all_ref/ },    { type: 'TOKEN_end', regex: /^end/ },    { type: 'TOKEN_nop', regex: /^nop/ },    { type: 'TOKEN_unreachable', regex: /^unreachable/ },    { type: 'TOKEN_drop', regex: /^drop/ },    { type: 'TOKEN_return', regex: /^return/ },    { type: 'TOKEN_throw_5F_ref', regex: /^throw_ref/ },    { type: 'TOKEN_select', regex: /^select/ },    { type: 'TOKEN_local_2E_get', regex: /^local\.get/ },    { type: 'TOKEN_local_2E_set', regex: /^local\.set/ },    { type: 'TOKEN_local_2E_tee', regex: /^local\.tee/ },    { type: 'TOKEN_global_2E_get', regex: /^global\.get/ },    { type: 'TOKEN_global_2E_set', regex: /^global\.set/ },    { type: 'TOKEN_table_2E_get', regex: /^table\.get/ },    { type: 'TOKEN_table_2E_set', regex: /^table\.set/ },    { type: 'TOKEN_table_2E_size', regex: /^table\.size/ },    { type: 'TOKEN_table_2E_grow', regex: /^table\.grow/ },    { type: 'TOKEN_table_2E_fill', regex: /^table\.fill/ },    { type: 'TOKEN_table_2E_copy', regex: /^table\.copy/ },    { type: 'TOKEN_table_2E_init', regex: /^table\.init/ },    { type: 'TOKEN_elem_2E_drop', regex: /^elem\.drop/ },    { type: 'TOKEN_memory_2E_size', regex: /^memory\.size/ },    { type: 'TOKEN_memory_2E_grow', regex: /^memory\.grow/ },    { type: 'TOKEN_memory_2E_fill', regex: /^memory\.fill/ },    { type: 'TOKEN_memory_2E_copy', regex: /^memory\.copy/ },    { type: 'TOKEN_memory_2E_init', regex: /^memory\.init/ },    { type: 'TOKEN_data_2E_drop', regex: /^data\.drop/ },    { type: 'TOKEN_ref_2E_null', regex: /^ref\.null/ },    { type: 'TOKEN_ref_2E_func', regex: /^ref\.func/ },    { type: 'TOKEN_ref_2E_is_5F_null', regex: /^ref\.is_null/ },    { type: 'TOKEN_ref_2E_as_5F_non_5F_null', regex: /^ref\.as_non_null/ },    { type: 'TOKEN_ref_2E_eq', regex: /^ref\.eq/ },    { type: 'TOKEN_ref_2E_test', regex: /^ref\.test/ },    { type: 'TOKEN_ref_2E_cast', regex: /^ref\.cast/ },    { type: 'TOKEN_struct_2E_new', regex: /^struct\.new/ },    { type: 'TOKEN_struct_2E_new_5F_default', regex: /^struct\.new_default/ },    { type: 'TOKEN_struct_2E_get', regex: /^struct\.get/ },    { type: 'TOKEN_struct_2E_get_5F_s', regex: /^struct\.get_s/ },    { type: 'TOKEN_struct_2E_get_5F_u', regex: /^struct\.get_u/ },    { type: 'TOKEN_struct_2E_set', regex: /^struct\.set/ },    { type: 'TOKEN_array_2E_new', regex: /^array\.new/ },    { type: 'TOKEN_array_2E_new_5F_default', regex: /^array\.new_default/ },    { type: 'TOKEN_array_2E_new_5F_fixed', regex: /^array\.new_fixed/ },    { type: 'TOKEN_array_2E_new_5F_data', regex: /^array\.new_data/ },    { type: 'TOKEN_array_2E_new_5F_elem', regex: /^array\.new_elem/ },    { type: 'TOKEN_array_2E_get', regex: /^array\.get/ },    { type: 'TOKEN_array_2E_get_5F_s', regex: /^array\.get_s/ },    { type: 'TOKEN_array_2E_get_5F_u', regex: /^array\.get_u/ },    { type: 'TOKEN_array_2E_set', regex: /^array\.set/ },    { type: 'TOKEN_array_2E_len', regex: /^array\.len/ },    { type: 'TOKEN_array_2E_fill', regex: /^array\.fill/ },    { type: 'TOKEN_array_2E_copy', regex: /^array\.copy/ },    { type: 'TOKEN_array_2E_init_5F_data', regex: /^array\.init_data/ },    { type: 'TOKEN_array_2E_init_5F_elem', regex: /^array\.init_elem/ },    { type: 'TOKEN_ref_2E_i31', regex: /^ref\.i31/ },    { type: 'TOKEN_i31_2E_get_5F_s', regex: /^i31\.get_s/ },    { type: 'TOKEN_i31_2E_get_5F_u', regex: /^i31\.get_u/ },    { type: 'TOKEN_any_2E_convert_5F_extern', regex: /^any\.convert_extern/ },    { type: 'TOKEN_extern_2E_convert_5F_any', regex: /^extern\.convert_any/ },    { type: 'TOKEN_call', regex: /^call/ },    { type: 'TOKEN_call_5F_ref', regex: /^call_ref/ },    { type: 'TOKEN_call_5F_indirect', regex: /^call_indirect/ },    { type: 'TOKEN_return_5F_call', regex: /^return_call/ },    { type: 'TOKEN_return_5F_call_5F_ref', regex: /^return_call_ref/ },    { type: 'TOKEN_return_5F_call_5F_indirect', regex: /^return_call_indirect/ },    { type: 'TOKEN_br', regex: /^br/ },    { type: 'TOKEN_br_5F_if', regex: /^br_if/ },    { type: 'TOKEN_br_5F_table', regex: /^br_table/ },    { type: 'TOKEN_br_5F_on_5F_null', regex: /^br_on_null/ },    { type: 'TOKEN_br_5F_on_5F_non_5F_null', regex: /^br_on_non_null/ },    { type: 'TOKEN_br_5F_on_5F_cast', regex: /^br_on_cast/ },    { type: 'TOKEN_br_5F_on_5F_cast_5F_fail', regex: /^br_on_cast_fail/ },    { type: 'TOKEN_throw', regex: /^throw/ },    { type: 'TOKEN_v128_2E_const', regex: /^v128\.const/ },    { type: 'TOKEN_i8x16_2E_shuffle', regex: /^i8x16\.shuffle/ },    { type: 'TOKEN_i8x16', regex: /^i8x16/ },    { type: 'TOKEN_i16x8', regex: /^i16x8/ },    { type: 'TOKEN_i32x4', regex: /^i32x4/ },    { type: 'TOKEN_i64x2', regex: /^i64x2/ },    { type: 'TOKEN_f32x4', regex: /^f32x4/ },    { type: 'TOKEN_f64x2', regex: /^f64x2/ },    { type: 'TOKEN_param', regex: /^param/ },    { type: 'TOKEN_result', regex: /^result/ },    { type: 'TOKEN_any', regex: /^any/ },    { type: 'TOKEN_eq', regex: /^eq/ },    { type: 'TOKEN_i31', regex: /^i31/ },    { type: 'TOKEN_none', regex: /^none/ },    { type: 'TOKEN_nofunc', regex: /^nofunc/ },    { type: 'TOKEN_exn', regex: /^exn/ },    { type: 'TOKEN_noexn', regex: /^noexn/ },    { type: 'TOKEN_extern', regex: /^extern/ },    { type: 'TOKEN_noextern', regex: /^noextern/ },    { type: 'TOKEN_funcref', regex: /^funcref/ },    { type: 'TOKEN_externref', regex: /^externref/ },    { type: 'TOKEN_exnref', regex: /^exnref/ },    { type: 'TOKEN_ref', regex: /^ref/ },    { type: 'TOKEN_null', regex: /^null/ },    { type: 'TOKEN_i32', regex: /^i32/ },    { type: 'TOKEN_i64', regex: /^i64/ },    { type: 'TOKEN_f32', regex: /^f32/ },    { type: 'TOKEN_f64', regex: /^f64/ },    { type: 'TOKEN_v128', regex: /^v128/ },    { type: 'TOKEN__5F_s', regex: /^_s/ },    { type: 'TOKEN__5F_u', regex: /^_u/ },    { type: 'TOKEN_offset_3D_', regex: /^offset=/ },    { type: 'TOKEN_align_3D_', regex: /^align=/ },    { type: 'skip', regex: /^(?:(?:(?:(?:(?:\u0009|\u000d| ))+|\u000a)|;;(?:(?:[\s\S](?:\u000a|\u000d|\u2028|\u2029)))*(?:(?:\u000a|\u000d|\u2028|\u2029))|(?:\(;(?:(?:[\s\S])*(?:(?:[\s\S])*;\)(?:[\s\S])*));\)|\(;(?:(?:(?:[\s\S])*(?:(?:[\s\S])*;\)(?:[\s\S])*))(?:(?:(?:(?:(?:\u0009|\u000d| ))+|\u000a))*ws(?:(?:(?:(?:\u0009|\u000d| ))+|\u000a))*:(?:[\s\S])*));\))))+/, skip: true },    { type: 'string', regex: /^"(?:(?:[\u0009]|[\u000a]|[\u000d]|[\u0020-\u0021]|[\u0023-\u005b]|[\u005d-\ud7ff]|[\ue000-\ufffd]|\\[\u0000-\ud7ff\ue000-\ufffd]))*"/ },    { type: 'nat', regex: /^(?:[0-9])+/ },    { type: 'float', regex: /^(?:(?:(?:\+|-))?(?:[0-9])+(?:(?:\.(?:[0-9])+))?(?:(?:(?:e|E)(?:(?:\+|-))?(?:[0-9])+))?|(?:(?:\+|-))?0x(?:[0-9A-Fa-f])+(?:(?:\.(?:[0-9A-Fa-f])+))?(?:(?:(?:p|P)(?:(?:\+|-))?(?:[0-9])+))?|(?:(?:\+|-))?inf|(?:(?:\+|-))?nan(?:(?::0x(?:[0-9A-Fa-f])+))?)/ },    { type: 'sign', regex: /^(?:\+|-)/ },    { type: 'identifier', regex: /^\$[A-Za-z_](?:[A-Za-z0-9_])*/ },    { type: 'dottedName', regex: /^[A-Za-z_](?:[A-Za-z0-9_])*(?:(?:\.[A-Za-z_](?:[A-Za-z0-9_])*))+/ },    ];
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
        const regex = pattern.regex;
        const match = this.input.substring(this.position).match(regex);

        if (match && match.index === 0 && match[0].length > 0) {
          candidates.push({ pattern, match });
          if (!bestMatch
              || match[0].length > bestMatch[0].length
              || (match[0].length === bestMatch[0].length && pattern.skip && !bestPattern.skip)
              || (match[0].length === bestMatch[0].length
                  && bestPattern
                  && isGenericNameType(bestPattern.type)
                  && !isGenericNameType(pattern.type))) {
            bestPattern = pattern;
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
    this.eventHandler = eventHandler;
  }
  
  peek() {
    return this.tokens[this.position];
  }
  
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      this.errors.push({
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      });
      throw new Error(`Expected '${expectedType}', got '${token ? token.type : 'EOF'}'`);
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
    return `Syntax error: expected ${err.expected}, got ${err.found}`;
  }
  parse() {
    const result = this.parsewat();
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return result;
    }
    if (!next || next.type !== 'EOF') {
      throw new Error(`Unexpected token at end: ${next ? next.type : 'EOF(consumed)'}`);
    }
    return result;
  }
  parsewat() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('wat', this.position);
    }
    let __ok = false;
    try {
    this.parsewatBody();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('wat', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('wat', this.position);
        }
      }
    }
  }
  parsewatBody() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('watBody', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsemodule();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('eof');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('watBody', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('watBody', this.position);
        }
      }
    }
  }
  parsemodule() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('module', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_module');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsemoduleField();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('module', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('module', this.position);
        }
      }
    }
  }
  parsemoduleField() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('moduleField', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsetypeDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseimportDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsetagDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseglobalDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsememDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsetableDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsefuncDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsedataDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseelemDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsestartDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseexportDef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 11 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('moduleField', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('moduleField', this.position);
        }
      }
    }
  }
  parsetypeDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('typeDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_type');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parserectype();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('typeDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('typeDef', this.position);
        }
      }
    }
  }
  parserectype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('rectype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_rec');
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsesubtype();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one subtype');
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsesubtype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('rectype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('rectype', this.position);
        }
      }
    }
  }
  parsesubtype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('subtype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_sub');
    // Optional: try parsing final
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsefinal();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsesupertype();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.parsecomptype();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsecomptype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('subtype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('subtype', this.position);
        }
      }
    }
  }
  parsefinal() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('final', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_final');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('final', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('final', this.position);
        }
      }
    }
  }
  parsesupertype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('supertype', this.position);
    }
    let __ok = false;
    try {
    this.parsetypeuse();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('supertype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('supertype', this.position);
        }
      }
    }
  }
  parsecomptype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('comptype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsefuncType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsestructType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsearrayType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('comptype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('comptype', this.position);
        }
      }
    }
  }
  parsefuncType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('funcType', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_func');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseparamDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseresultDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('funcType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('funcType', this.position);
        }
      }
    }
  }
  parsestructType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('structType', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_struct');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsefieldDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('structType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('structType', this.position);
        }
      }
    }
  }
  parsearrayType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('arrayType', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_array');
    this.parsefieldDecl();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('arrayType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('arrayType', this.position);
        }
      }
    }
  }
  parsefieldDecl() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('fieldDecl', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_field');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsestoragetype();
    // Optional: try parsing mutField
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsemutField();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('fieldDecl', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('fieldDecl', this.position);
        }
      }
    }
  }
  parsemutField() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('mutField', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_mut');
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('mutField', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('mutField', this.position);
        }
      }
    }
  }
  parsestoragetype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('storagetype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsevalueType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsepackType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('storagetype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('storagetype', this.position);
        }
      }
    }
  }
  parsepackType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('packType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i8');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i16');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('packType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('packType', this.position);
        }
      }
    }
  }
  parsetagDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tagDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_tag');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsetagType();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tagDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tagDef', this.position);
        }
      }
    }
  }
  parsetagType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tagType', this.position);
    }
    let __ok = false;
    try {
    this.parsetypeuse();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tagType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tagType', this.position);
        }
      }
    }
  }
  parseglobalDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('globalDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_global');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseglobalType();
    this.parseexpr();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('globalDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('globalDef', this.position);
        }
      }
    }
  }
  parseglobalType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('globalType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsevalueType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_mut');
    this.parsevalueType();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('globalType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('globalType', this.position);
        }
      }
    }
  }
  parsememDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('memDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_memory');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parselimits();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('memDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('memDef', this.position);
        }
      }
    }
  }
  parsetableDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tableDef', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_table');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parselimits();
    this.parsereftype();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_table');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parselimits();
    this.parsereftype();
    this.parsetableExpr();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tableDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tableDef', this.position);
        }
      }
    }
  }
  parsetableExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tableExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseexpr();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tableExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tableExpr', this.position);
        }
      }
    }
  }
  parsefuncDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('funcDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_func');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing typeuse
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsetypeuse();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselocalDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.parseexpr();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('funcDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('funcDef', this.position);
        }
      }
    }
  }
  parselocalDecl() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('localDecl', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_local');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsevalueType();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_local');
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsevalueType();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one valueType');
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('localDecl', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('localDecl', this.position);
        }
      }
    }
  }
  parseimportDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('importDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_import');
    this.consume('string');
    this.consume('string');
    this.parseimportDesc();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('importDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('importDef', this.position);
        }
      }
    }
  }
  parseimportDesc() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('importDesc', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_func');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing typeuse
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsetypeuse();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_table');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parselimits();
    this.parsereftype();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_memory');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parselimits();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_global');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseglobalType();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_tag');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsetagType();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('importDesc', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('importDesc', this.position);
        }
      }
    }
  }
  parseexportDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('exportDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_export');
    this.consume('string');
    this.parseexportDesc();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('exportDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('exportDef', this.position);
        }
      }
    }
  }
  parseexportDesc() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('exportDesc', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_func');
    this.parseindex();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_table');
    this.parseindex();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_memory');
    this.parseindex();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_global');
    this.parseindex();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_tag');
    this.parseindex();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('exportDesc', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('exportDesc', this.position);
        }
      }
    }
  }
  parsestartDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('startDef', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_start');
    this.parseindex();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('startDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('startDef', this.position);
        }
      }
    }
  }
  parsedataDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('dataDef', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_data');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsedatastring();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_data');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsememUse();
    this.parseoffset();
    this.parsedatastring();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_data');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseoffset();
    this.parsedatastring();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('dataDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('dataDef', this.position);
        }
      }
    }
  }
  parsedatastring() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('datastring', this.position);
    }
    let __ok = false;
    try {
    this.consume('string');
    while (this.match('string')) { /* one or more */ }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('datastring', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('datastring', this.position);
        }
      }
    }
  }
  parseelemDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('elemDef', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_elem');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseelemList();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_elem');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsetableUse();
    this.parseoffset();
    this.parseelemList();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_elem');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseoffset();
    this.parseelemList();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_elem');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN_declare');
    this.parseelemList();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('elemDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('elemDef', this.position);
        }
      }
    }
  }
  parseelemList() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('elemList', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsereftype();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseelemExpr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_func');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsefuncidx();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('elemList', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('elemList', this.position);
        }
      }
    }
  }
  parseelemExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('elemExpr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_item');
    this.parseexpr();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseinstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('elemExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('elemExpr', this.position);
        }
      }
    }
  }
  parsememUse() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('memUse', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_memory');
    this.parsememidx();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('memUse', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('memUse', this.position);
        }
      }
    }
  }
  parsetableUse() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tableUse', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_table');
    this.parsetableidx();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tableUse', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tableUse', this.position);
        }
      }
    }
  }
  parseoffset() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('offset', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_offset');
    this.parseexpr();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseexpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('offset', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('offset', this.position);
        }
      }
    }
  }
  parseinstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('instr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsefoldedInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseseqInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('instr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('instr', this.position);
        }
      }
    }
  }
  parsefoldedInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('foldedInstr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_block');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_loop');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_if');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_then');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_else');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_try_5F_table');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsecatchClause();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parsenonBlockInstr();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('foldedInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('foldedInstr', this.position);
        }
      }
    }
  }
  parsecatchClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('catchClause', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_catch');
    this.parsetagidx();
    this.parselabel();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_catch_5F_ref');
    this.parsetagidx();
    this.parselabel();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_catch_5F_all');
    this.parselabel();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_catch_5F_all_5F_ref');
    this.parselabel();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('catchClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('catchClause', this.position);
        }
      }
    }
  }
  parseseqInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('seqInstr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsenonBlockInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_block');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN_end');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_loop');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN_end');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_if');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_else');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_end');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_try_5F_table');
    // Optional: try parsing label
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabel();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing blockType
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseblockType();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsecatchClause();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    this.consume('TOKEN_end');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('seqInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('seqInstr', this.position);
        }
      }
    }
  }
  parsenonBlockInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('nonBlockInstr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_nop');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_unreachable');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_drop');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_return');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_throw_5F_ref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_select');
    // Optional: try parsing resultTypes
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseresultTypes();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsesimdLikeInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsememLikeInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsenumericLikeInstr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_local_2E_get');
    this.parseindex();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_local_2E_set');
    this.parseindex();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_local_2E_tee');
    this.parseindex();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_global_2E_get');
    this.parseindex();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_global_2E_set');
    this.parseindex();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_get');
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_set');
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_size');
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_grow');
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_fill');
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_copy');
    this.parsetableidx();
    this.parsetableidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_table_2E_init');
    this.parsetableidx();
    this.parseelemidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_elem_2E_drop');
    this.parseelemidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_memory_2E_size');
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_memory_2E_grow');
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_memory_2E_fill');
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_memory_2E_copy');
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_memory_2E_init');
    // Optional: try parsing memidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsedataidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_data_2E_drop');
    this.parsedataidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_null');
    this.parseheaptype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_func');
    this.parsefuncidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_is_5F_null');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_as_5F_non_5F_null');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_eq');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_test');
    this.parsereftype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_cast');
    this.parsereftype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_new');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_new_5F_default');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_get');
    this.parsetypeidx();
    this.parsefieldidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_get_5F_s');
    this.parsetypeidx();
    this.parsefieldidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_get_5F_u');
    this.parsetypeidx();
    this.parsefieldidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct_2E_set');
    this.parsetypeidx();
    this.parsefieldidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_new');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_new_5F_default');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_new_5F_fixed');
    this.parsetypeidx();
    this.consume('nat');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_new_5F_data');
    this.parsetypeidx();
    this.parsedataidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_new_5F_elem');
    this.parsetypeidx();
    this.parseelemidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_get');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_get_5F_s');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_get_5F_u');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_set');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_len');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_fill');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_copy');
    this.parsetypeidx();
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_init_5F_data');
    this.parsetypeidx();
    this.parsedataidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array_2E_init_5F_elem');
    this.parsetypeidx();
    this.parseelemidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ref_2E_i31');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i31_2E_get_5F_s');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i31_2E_get_5F_u');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_any_2E_convert_5F_extern');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_extern_2E_convert_5F_any');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_call');
    this.parsefuncidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_call_5F_ref');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_call_5F_indirect');
    // Optional: try parsing tableidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsetableidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsetypeuse();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_return_5F_call');
    this.parsefuncidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_return_5F_call_5F_ref');
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_return_5F_call_5F_indirect');
    // Optional: try parsing tableidx
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsetableidx();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsetypeuse();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br');
    this.parselabelidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_if');
    this.parselabelidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_table');
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parselabelidx();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one labelidx');
    }
    this.parselabelidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_on_5F_null');
    this.parselabelidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_on_5F_non_5F_null');
    this.parselabelidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_on_5F_cast');
    this.parselabelidx();
    this.parsereftype();
    this.parsereftype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_br_5F_on_5F_cast_5F_fail');
    this.parselabelidx();
    this.parsereftype();
    this.parsereftype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_throw');
    this.parsetagidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 74 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('nonBlockInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('nonBlockInstr', this.position);
        }
      }
    }
  }
  parsenumericLikeInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('numericLikeInstr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('dottedName');
    this.parsememarg();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('dottedName');
    this.consume('float');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('dottedName');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('numericLikeInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('numericLikeInstr', this.position);
        }
      }
    }
  }
  parsememLikeInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('memLikeInstr', this.position);
    }
    let __ok = false;
    try {
    this.consume('dottedName');
    // Optional: try parsing memarg
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsememarg();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('memLikeInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('memLikeInstr', this.position);
        }
      }
    }
  }
  parsesimdLikeInstr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('simdLikeInstr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_v128_2E_const');
    this.parsesimdConst();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('dottedName');
    this.parselaneidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i8x16_2E_shuffle');
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
    this.parselaneidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('simdLikeInstr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('simdLikeInstr', this.position);
        }
      }
    }
  }
  parseblockType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('blockType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsetypeuse();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseresultTypes();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsevalueType();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('blockType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('blockType', this.position);
        }
      }
    }
  }
  parselabel() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('label', this.position);
    }
    let __ok = false;
    try {
    this.parseid();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('label', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('label', this.position);
        }
      }
    }
  }
  parsesimdConst() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('simdConst', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i8x16');
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i16x8');
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i32x4');
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
    this.parsesignedNat();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i64x2');
    this.parsesignedNat();
    this.parsesignedNat();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f32x4');
    this.consume('float');
    this.consume('float');
    this.consume('float');
    this.consume('float');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f64x2');
    this.consume('float');
    this.consume('float');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 6 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('simdConst', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('simdConst', this.position);
        }
      }
    }
  }
  parsetypeuse() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('typeuse', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_type');
    this.parsetypeidx();
    this.consume('TOKEN__29_');
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseparamDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseresultDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseparamDecl();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one paramDecl');
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseresultDecl();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseresultDecl();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one resultDecl');
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('typeuse', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('typeuse', this.position);
        }
      }
    }
  }
  parseparamDecl() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('paramDecl', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_param');
    // Optional: try parsing id
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseid();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsevalueType();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one valueType');
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('paramDecl', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('paramDecl', this.position);
        }
      }
    }
  }
  parseresultDecl() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('resultDecl', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_result');
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsevalueType();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one valueType');
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('resultDecl', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('resultDecl', this.position);
        }
      }
    }
  }
  parseresultTypes() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('resultTypes', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_result');
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parsevalueType();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one valueType');
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('resultTypes', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('resultTypes', this.position);
        }
      }
    }
  }
  parseheaptype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('heaptype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_any');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_eq');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i31');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_struct');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_array');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_none');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_func');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_nofunc');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_exn');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_noexn');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_extern');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_noextern');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_funcref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_externref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_exnref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsetypeidx();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 16 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('heaptype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('heaptype', this.position);
        }
      }
    }
  }
  parsereftype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('reftype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN_ref');
    if (this.match('TOKEN_null')) { /* optional matched */ }
    this.parseheaptype();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_funcref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_externref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_exnref');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('reftype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('reftype', this.position);
        }
      }
    }
  }
  parsevalueType() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('valueType', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i32');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i64');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f32');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f64');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_v128');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parsereftype();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 6 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('valueType', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('valueType', this.position);
        }
      }
    }
  }
  parseid() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('id', this.position);
    }
    let __ok = false;
    try {
    this.consume('identifier');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('id', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('id', this.position);
        }
      }
    }
  }
  parseindex() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('index', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseid();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('nat');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('index', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('index', this.position);
        }
      }
    }
  }
  parsetypeidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('typeidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('typeidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('typeidx', this.position);
        }
      }
    }
  }
  parsefuncidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('funcidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('funcidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('funcidx', this.position);
        }
      }
    }
  }
  parsetableidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tableidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tableidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tableidx', this.position);
        }
      }
    }
  }
  parsememidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('memidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('memidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('memidx', this.position);
        }
      }
    }
  }
  parsetagidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('tagidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('tagidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('tagidx', this.position);
        }
      }
    }
  }
  parseelemidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('elemidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('elemidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('elemidx', this.position);
        }
      }
    }
  }
  parsedataidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('dataidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('dataidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('dataidx', this.position);
        }
      }
    }
  }
  parselabelidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('labelidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('labelidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('labelidx', this.position);
        }
      }
    }
  }
  parsefieldidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('fieldidx', this.position);
    }
    let __ok = false;
    try {
    this.parseindex();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('fieldidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('fieldidx', this.position);
        }
      }
    }
  }
  parsesignedNat() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('signedNat', this.position);
    }
    let __ok = false;
    try {
    if (this.match('sign')) { /* optional token matched */ }
    this.consume('nat');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('signedNat', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('signedNat', this.position);
        }
      }
    }
  }
  parsent() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('nt', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i32');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i64');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f32');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_f64');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('nt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('nt', this.position);
        }
      }
    }
  }
  parsesz() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('sz', this.position);
    }
    let __ok = false;
    try {
    this.consume('nat');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('sz', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('sz', this.position);
        }
      }
    }
  }
  parsesx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('sx', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__5F_s');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__5F_u');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('sx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('sx', this.position);
        }
      }
    }
  }
  parselimits() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('limits', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing addrtype
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseaddrtype();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('nat');
    if (this.match('nat')) { /* optional token matched */ }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('limits', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('limits', this.position);
        }
      }
    }
  }
  parseaddrtype() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('addrtype', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i32');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_i64');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('addrtype', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('addrtype', this.position);
        }
      }
    }
  }
  parsememarg() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('memarg', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_offset_3D_');
    this.consume('nat');
    this.consume('TOKEN_align_3D_');
    this.consume('nat');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_offset_3D_');
    this.consume('nat');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_align_3D_');
    this.consume('nat');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('memarg', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('memarg', this.position);
        }
      }
    }
  }
  parselaneidx() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('laneidx', this.position);
    }
    let __ok = false;
    try {
    this.consume('nat');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('laneidx', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('laneidx', this.position);
        }
      }
    }
  }
  parseexpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('expr', this.position);
    }
    let __ok = false;
    try {
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseinstr();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('expr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('expr', this.position);
        }
      }
    }
  }
}

module.exports = Parser;