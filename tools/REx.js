// This file was generated on Thu Mar 26, 2026 19:48 (UTC-03) by REx v6.1 which is Copyright (c) 1979-2025 by Gunther Rademacher <grd@gmx.net>
// REx command line: REx.ebnf -backtrack -javascript -tree

function REx(string, parsingEventHandler)
{
  init(string, parsingEventHandler);

  var thisParser = this;

  this.ParseException = function(b, e, s, o, x)
  {
    var begin = b;
    var end = e;
    var state = s;
    var offending = o;
    var expected = x;

    this.getBegin = function() {return begin;};
    this.getEnd = function() {return end;};
    this.getState = function() {return state;};
    this.getExpected = function() {return expected;};
    this.getOffending = function() {return offending;};
    this.isAmbiguousInput = function() {return false;};

    this.getMessage = function()
    {
      return offending < 0
           ? "lexical analysis failed"
           : "syntax error";
    };
  };

  function init(source, parsingEventHandler)
  {
    eventHandler = parsingEventHandler;
    input = source;
    size = source.length;
    reset(0, 0, 0);
  }

  this.getInput = function()
  {
    return input;
  };

  this.getTokenOffset = function()
  {
    return b0;
  };

  this.getTokenEnd = function()
  {
    return e0;
  };

  function reset(l, b, e)
  {
            b0 = b; e0 = b;
    l1 = l; b1 = b; e1 = e;
    l2 = 0; b2 = 0; e2 = 0;
    l3 = 0; b3 = 0; e3 = 0;
    end = e;
    eventHandler.reset(input);
  }

  this.reset = function(l, b, e)
  {
    reset(l, b, e);
  };

  this.getOffendingToken = function(e)
  {
    var o = e.getOffending();
    return o >= 0 ? REx.TOKEN[o] : null;
  };

  this.getExpectedTokenSet = function(e)
  {
    var expected;
    if (e.getExpected() < 0)
    {
      expected = REx.getTokenSet(- e.getState());
    }
    else
    {
      expected = [REx.TOKEN[e.getExpected()]];
    }
    return expected;
  };

  this.getErrorMessage = function(e)
  {
    var message = e.getMessage();
    var found = this.getOffendingToken(e);
    var tokenSet = this.getExpectedTokenSet(e);
    var size = e.getEnd() - e.getBegin();
    message += (found == null ? "" : ", found " + found)
            + "\nwhile expecting "
            + (tokenSet.length == 1 ? tokenSet[0] : ("[" + tokenSet.join(", ") + "]"))
            + "\n"
            + (size == 0 || found != null ? "" : "after successfully scanning " + size + " characters beginning ");
    var prefix = input.substring(0, e.getBegin());
    var lines = prefix.split("\n");
    var line = lines.length;
    var column = lines[line - 1].length + 1;
    return message
         + "at line " + line + ", column " + column + ":\n..."
         + input.substring(e.getBegin(), Math.min(input.length, e.getBegin() + 64))
         + "...";
  };

  this.parse_Grammar = function()
  {
    eventHandler.startNonterminal("Grammar", e0);
    lookahead1W(11);                // Whitespace | Name | '<?'
    whitespace();
    parse_Prolog();
    whitespace();
    parse_SyntaxDefinition();
    if (l1 == 29)                   // '<?TOKENS?>'
    {
      whitespace();
      parse_LexicalDefinition();
    }
    if (l1 == 28)                   // '<?ENCORE?>'
    {
      whitespace();
      parse_Encore();
    }
    consume(11);                    // EOF
    eventHandler.endNonterminal("Grammar", e0);
  };

  function parse_Prolog()
  {
    eventHandler.startNonterminal("Prolog", e0);
    for (;;)
    {
      lookahead1W(11);              // Whitespace | Name | '<?'
      if (l1 != 27)                 // '<?'
      {
        break;
      }
      whitespace();
      parse_ProcessingInstruction();
    }
    eventHandler.endNonterminal("Prolog", e0);
  }

  function parse_ProcessingInstruction()
  {
    eventHandler.startNonterminal("ProcessingInstruction", e0);
    consume(27);                    // '<?'
    lookahead1(0);                  // Name
    consume(2);                     // Name
    lookahead1(8);                  // Space | '?>'
    if (l1 == 3)                    // Space
    {
      for (;;)
      {
        consume(3);                 // Space
        lookahead1(17);             // Space | DirPIContents | '?>'
        if (l1 != 3)                // Space
        {
          break;
        }
      }
      if (l1 == 4)                  // DirPIContents
      {
        consume(4);                 // DirPIContents
      }
    }
    lookahead1(2);                  // '?>'
    consume(33);                    // '?>'
    eventHandler.endNonterminal("ProcessingInstruction", e0);
  }

  function parse_SyntaxDefinition()
  {
    eventHandler.startNonterminal("SyntaxDefinition", e0);
    for (;;)
    {
      whitespace();
      parse_SyntaxProduction();
      if (l1 != 2)                  // Name
      {
        break;
      }
    }
    eventHandler.endNonterminal("SyntaxDefinition", e0);
  }

  function parse_SyntaxProduction()
  {
    eventHandler.startNonterminal("SyntaxProduction", e0);
    consume(2);                     // Name
    lookahead1W(4);                 // Whitespace | '::='
    consume(25);                    // '::='
    lookahead1W(34);                // Whitespace | Name | StringLiteral | EOF | '(' | '/' | '/*' | '<?' |
                                    // '<?ENCORE?>' | '<?TOKENS?>' | '|'
    whitespace();
    parse_SyntaxChoice();
    for (;;)
    {
      lookahead1W(21);              // Whitespace | Name | EOF | '/*' | '<?ENCORE?>' | '<?TOKENS?>'
      if (l1 != 23)                 // '/*'
      {
        break;
      }
      whitespace();
      parse_Option();
    }
    eventHandler.endNonterminal("SyntaxProduction", e0);
  }

  function parse_SyntaxChoice()
  {
    eventHandler.startNonterminal("SyntaxChoice", e0);
    parse_SyntaxSequence();
    if (l1 == 22                    // '/'
     || l1 == 41)                   // '|'
    {
      switch (l1)
      {
      case 41:                      // '|'
        for (;;)
        {
          consume(41);              // '|'
          lookahead1W(33);          // Whitespace | Name | StringLiteral | EOF | '(' | ')' | '/*' | '<?' |
                                    // '<?ENCORE?>' | '<?TOKENS?>' | '|'
          whitespace();
          parse_SyntaxSequence();
          if (l1 != 41)             // '|'
          {
            break;
          }
        }
        break;
      default:
        for (;;)
        {
          consume(22);              // '/'
          lookahead1W(32);          // Whitespace | Name | StringLiteral | EOF | '(' | ')' | '/' | '/*' | '<?' |
                                    // '<?ENCORE?>' | '<?TOKENS?>'
          whitespace();
          parse_SyntaxSequence();
          if (l1 != 22)             // '/'
          {
            break;
          }
        }
      }
    }
    eventHandler.endNonterminal("SyntaxChoice", e0);
  }

  function parse_SyntaxSequence()
  {
    eventHandler.startNonterminal("SyntaxSequence", e0);
    for (;;)
    {
      lookahead1W(35);              // Whitespace | Name | StringLiteral | EOF | '(' | ')' | '/' | '/*' | '<?' |
                                    // '<?ENCORE?>' | '<?TOKENS?>' | '|'
      switch (l1)
      {
      case 2:                       // Name
        lookahead2W(40);            // Whitespace | Name | StringLiteral | CaretName | EOF | '(' | ')' | '*' | '+' |
                                    // '/' | '/*' | '::=' | '<?' | '<?ENCORE?>' | '<?TOKENS?>' | '?' | '|'
        break;
      default:
        lk = l1;
      }
      if (lk == 11                  // EOF
       || lk == 16                  // ')'
       || lk == 22                  // '/'
       || lk == 23                  // '/*'
       || lk == 28                  // '<?ENCORE?>'
       || lk == 29                  // '<?TOKENS?>'
       || lk == 41                  // '|'
       || lk == 1602)               // Name '::='
      {
        break;
      }
      whitespace();
      parse_SyntaxItem();
    }
    eventHandler.endNonterminal("SyntaxSequence", e0);
  }

  function parse_SyntaxItem()
  {
    eventHandler.startNonterminal("SyntaxItem", e0);
    parse_SyntaxPrimary();
    lookahead1W(38);                // Whitespace | Name | StringLiteral | EOF | '(' | ')' | '*' | '+' | '/' | '/*' |
                                    // '<?' | '<?ENCORE?>' | '<?TOKENS?>' | '?' | '|'
    if (l1 == 17                    // '*'
     || l1 == 19                    // '+'
     || l1 == 32)                   // '?'
    {
      switch (l1)
      {
      case 32:                      // '?'
        consume(32);                // '?'
        break;
      case 17:                      // '*'
        consume(17);                // '*'
        break;
      default:
        consume(19);                // '+'
      }
    }
    eventHandler.endNonterminal("SyntaxItem", e0);
  }

  function parse_SyntaxPrimary()
  {
    eventHandler.startNonterminal("SyntaxPrimary", e0);
    switch (l1)
    {
    case 15:                        // '('
      consume(15);                  // '('
      lookahead1W(25);              // Whitespace | Name | StringLiteral | '(' | ')' | '/' | '<?' | '|'
      whitespace();
      parse_SyntaxChoice();
      consume(16);                  // ')'
      break;
    case 27:                        // '<?'
      parse_ProcessingInstruction();
      break;
    default:
      parse_NameOrString();
    }
    eventHandler.endNonterminal("SyntaxPrimary", e0);
  }

  function parse_LexicalDefinition()
  {
    eventHandler.startNonterminal("LexicalDefinition", e0);
    consume(29);                    // '<?TOKENS?>'
    for (;;)
    {
      lookahead1W(22);              // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' |
                                    // '<?ENCORE?>'
      if (l1 == 11                  // EOF
       || l1 == 28)                 // '<?ENCORE?>'
      {
        break;
      }
      switch (l1)
      {
      case 2:                       // Name
        lookahead2W(23);            // Whitespace | CaretName | '::=' | '<<' | '>>' | '?' | '\\'
        break;
      default:
        lk = l1;
      }
      switch (lk)
      {
      case 21:                      // '.'
      case 1602:                    // Name '::='
      case 2050:                    // Name '?'
        whitespace();
        parse_LexicalProduction();
        break;
      case 2306:                    // Name '\\'
        whitespace();
        parse_Delimiter();
        break;
      case 12:                      // EquivalenceLookAhead
        whitespace();
        parse_Equivalence();
        break;
      default:
        whitespace();
        parse_Preference();
      }
    }
    eventHandler.endNonterminal("LexicalDefinition", e0);
  }

  function parse_LexicalProduction()
  {
    eventHandler.startNonterminal("LexicalProduction", e0);
    switch (l1)
    {
    case 2:                         // Name
      consume(2);                   // Name
      break;
    default:
      consume(21);                  // '.'
    }
    lookahead1W(15);                // Whitespace | '::=' | '?'
    if (l1 == 32)                   // '?'
    {
      consume(32);                  // '?'
    }
    lookahead1W(4);                 // Whitespace | '::='
    consume(25);                    // '::='
    lookahead1W(37);                // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | '.' | '/*' | '<?ENCORE?>' | '[' | '[^' | '|'
    whitespace();
    parse_ContextChoice();
    for (;;)
    {
      lookahead1W(24);              // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '/*' |
                                    // '<?ENCORE?>'
      if (l1 != 23)                 // '/*'
      {
        break;
      }
      whitespace();
      parse_Option();
    }
    eventHandler.endNonterminal("LexicalProduction", e0);
  }

  function parse_ContextChoice()
  {
    eventHandler.startNonterminal("ContextChoice", e0);
    parse_ContextExpression();
    for (;;)
    {
      lookahead1W(27);              // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '/*' |
                                    // '<?ENCORE?>' | '|'
      if (l1 != 41)                 // '|'
      {
        break;
      }
      consume(41);                  // '|'
      lookahead1W(37);              // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | '.' | '/*' | '<?ENCORE?>' | '[' | '[^' | '|'
      whitespace();
      parse_ContextExpression();
    }
    eventHandler.endNonterminal("ContextChoice", e0);
  }

  function parse_LexicalChoice()
  {
    eventHandler.startNonterminal("LexicalChoice", e0);
    parse_LexicalSequence();
    for (;;)
    {
      lookahead1W(14);              // Whitespace | ')' | '|'
      if (l1 != 41)                 // '|'
      {
        break;
      }
      consume(41);                  // '|'
      lookahead1W(31);              // Whitespace | Name | StringLiteral | CharCode | '$' | '(' | ')' | '.' | '[' |
                                    // '[^' | '|'
      whitespace();
      parse_LexicalSequence();
    }
    eventHandler.endNonterminal("LexicalChoice", e0);
  }

  function parse_ContextExpression()
  {
    eventHandler.startNonterminal("ContextExpression", e0);
    parse_LexicalSequence();
    lookahead1W(30);                // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '&' | '.' |
                                    // '/*' | '<?ENCORE?>' | '|'
    if (l1 == 14)                   // '&'
    {
      consume(14);                  // '&'
      lookahead1W(26);              // Whitespace | Name | StringLiteral | CharCode | '$' | '(' | '.' | '[' | '[^'
      whitespace();
      parse_LexicalItem();
    }
    eventHandler.endNonterminal("ContextExpression", e0);
  }

  function parse_LexicalSequence()
  {
    eventHandler.startNonterminal("LexicalSequence", e0);
    switch (l1)
    {
    case 2:                         // Name
      lookahead2W(51);              // Whitespace | Name | StringLiteral | CaretName | CharCode | EOF |
                                    // EquivalenceLookAhead | '$' | '&' | '(' | ')' | '*' | '+' | '-' | '.' | '/*' |
                                    // '::=' | '<<' | '<?ENCORE?>' | '>>' | '?' | '[' | '[^' | '\\' | '|'
      switch (lk)
      {
      case 2050:                    // Name '?'
        lookahead3W(43);            // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '-' | '.' | '/*' | '::=' | '<?ENCORE?>' | '[' | '[^' | '|'
        break;
      }
      break;
    case 5:                         // StringLiteral
      lookahead2W(49);              // Whitespace | Name | StringLiteral | CaretName | CharCode | EOF |
                                    // EquivalenceLookAhead | '$' | '&' | '(' | ')' | '*' | '+' | '-' | '.' | '/*' |
                                    // '<<' | '<?ENCORE?>' | '>>' | '?' | '[' | '[^' | '|'
      break;
    case 21:                        // '.'
      lookahead2W(47);              // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '*' | '+' | '-' | '.' | '/*' | '::=' | '<?ENCORE?>' | '?' |
                                    // '[' | '[^' | '|'
      switch (lk)
      {
      case 2069:                    // '.' '?'
        lookahead3W(43);            // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '-' | '.' | '/*' | '::=' | '<?ENCORE?>' | '[' | '[^' | '|'
        break;
      }
      break;
    default:
      lk = l1;
    }
    switch (lk)
    {
    case 11:                        // EOF
    case 12:                        // EquivalenceLookAhead
    case 14:                        // '&'
    case 16:                        // ')'
    case 23:                        // '/*'
    case 28:                        // '<?ENCORE?>'
    case 41:                        // '|'
    case 386:                       // Name CaretName
    case 389:                       // StringLiteral CaretName
    case 1602:                      // Name '::='
    case 1621:                      // '.' '::='
    case 1666:                      // Name '<<'
    case 1669:                      // StringLiteral '<<'
    case 1986:                      // Name '>>'
    case 1989:                      // StringLiteral '>>'
    case 2306:                      // Name '\\'
    case 104450:                    // Name '?' '::='
    case 104469:                    // '.' '?' '::='
      break;
    default:
      parse_LexicalItem();
      lookahead1W(41);              // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '-' | '.' | '/*' | '<?ENCORE?>' | '[' | '[^' | '|'
      switch (l1)
      {
      case 20:                      // '-'
        consume(20);                // '-'
        lookahead1W(26);            // Whitespace | Name | StringLiteral | CharCode | '$' | '(' | '.' | '[' | '[^'
        whitespace();
        parse_LexicalItem();
        break;
      default:
        for (;;)
        {
          lookahead1W(39);          // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '.' | '/*' | '<?ENCORE?>' | '[' | '[^' | '|'
          switch (l1)
          {
          case 2:                   // Name
            lookahead2W(50);        // Whitespace | Name | StringLiteral | CaretName | CharCode | EOF |
                                    // EquivalenceLookAhead | '$' | '&' | '(' | ')' | '*' | '+' | '.' | '/*' | '::=' |
                                    // '<<' | '<?ENCORE?>' | '>>' | '?' | '[' | '[^' | '\\' | '|'
            switch (lk)
            {
            case 2050:              // Name '?'
              lookahead3W(42);      // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '.' | '/*' | '::=' | '<?ENCORE?>' | '[' | '[^' | '|'
              break;
            }
            break;
          case 5:                   // StringLiteral
            lookahead2W(48);        // Whitespace | Name | StringLiteral | CaretName | CharCode | EOF |
                                    // EquivalenceLookAhead | '$' | '&' | '(' | ')' | '*' | '+' | '.' | '/*' | '<<' |
                                    // '<?ENCORE?>' | '>>' | '?' | '[' | '[^' | '|'
            break;
          case 21:                  // '.'
            lookahead2W(46);        // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '*' | '+' | '.' | '/*' | '::=' | '<?ENCORE?>' | '?' | '[' |
                                    // '[^' | '|'
            switch (lk)
            {
            case 2069:              // '.' '?'
              lookahead3W(42);      // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '.' | '/*' | '::=' | '<?ENCORE?>' | '[' | '[^' | '|'
              break;
            }
            break;
          default:
            lk = l1;
          }
          if (lk == 11              // EOF
           || lk == 12              // EquivalenceLookAhead
           || lk == 14              // '&'
           || lk == 16              // ')'
           || lk == 23              // '/*'
           || lk == 28              // '<?ENCORE?>'
           || lk == 41              // '|'
           || lk == 386             // Name CaretName
           || lk == 389             // StringLiteral CaretName
           || lk == 1602            // Name '::='
           || lk == 1621            // '.' '::='
           || lk == 1666            // Name '<<'
           || lk == 1669            // StringLiteral '<<'
           || lk == 1986            // Name '>>'
           || lk == 1989            // StringLiteral '>>'
           || lk == 2306            // Name '\\'
           || lk == 104450          // Name '?' '::='
           || lk == 104469)         // '.' '?' '::='
          {
            break;
          }
          whitespace();
          parse_LexicalItem();
        }
      }
    }
    eventHandler.endNonterminal("LexicalSequence", e0);
  }

  function parse_LexicalItem()
  {
    eventHandler.startNonterminal("LexicalItem", e0);
    parse_LexicalPrimary();
    lookahead1W(45);                // Whitespace | Name | StringLiteral | CharCode | EOF | EquivalenceLookAhead | '$' |
                                    // '&' | '(' | ')' | '*' | '+' | '-' | '.' | '/*' | '<?ENCORE?>' | '?' | '[' |
                                    // '[^' | '|'
    if (l1 == 17                    // '*'
     || l1 == 19                    // '+'
     || l1 == 32)                   // '?'
    {
      switch (l1)
      {
      case 32:                      // '?'
        consume(32);                // '?'
        break;
      case 17:                      // '*'
        consume(17);                // '*'
        break;
      default:
        consume(19);                // '+'
      }
    }
    eventHandler.endNonterminal("LexicalItem", e0);
  }

  function parse_LexicalPrimary()
  {
    eventHandler.startNonterminal("LexicalPrimary", e0);
    switch (l1)
    {
    case 2:                         // Name
    case 21:                        // '.'
      switch (l1)
      {
      case 2:                       // Name
        consume(2);                 // Name
        break;
      default:
        consume(21);                // '.'
      }
      break;
    case 5:                         // StringLiteral
      consume(5);                   // StringLiteral
      break;
    case 15:                        // '('
      consume(15);                  // '('
      lookahead1W(31);              // Whitespace | Name | StringLiteral | CharCode | '$' | '(' | ')' | '.' | '[' |
                                    // '[^' | '|'
      whitespace();
      parse_LexicalChoice();
      consume(16);                  // ')'
      break;
    case 13:                        // '$'
      consume(13);                  // '$'
      break;
    case 7:                         // CharCode
      consume(7);                   // CharCode
      break;
    default:
      parse_CharClass();
    }
    eventHandler.endNonterminal("LexicalPrimary", e0);
  }

  function parse_NameOrString()
  {
    eventHandler.startNonterminal("NameOrString", e0);
    switch (l1)
    {
    case 2:                         // Name
      consume(2);                   // Name
      lookahead1W(44);              // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '(' | ')' | '*' | '+' | '.' | '/' | '/*' | '<<' | '<?' | '<?ENCORE?>' |
                                    // '<?TOKENS?>' | '>>' | '?' | '|'
      if (l1 == 6)                  // CaretName
      {
        whitespace();
        parse_Context();
      }
      break;
    default:
      consume(5);                   // StringLiteral
      lookahead1W(44);              // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '(' | ')' | '*' | '+' | '.' | '/' | '/*' | '<<' | '<?' | '<?ENCORE?>' |
                                    // '<?TOKENS?>' | '>>' | '?' | '|'
      if (l1 == 6)                  // CaretName
      {
        whitespace();
        parse_Context();
      }
    }
    eventHandler.endNonterminal("NameOrString", e0);
  }

  function parse_Context()
  {
    eventHandler.startNonterminal("Context", e0);
    consume(6);                     // CaretName
    eventHandler.endNonterminal("Context", e0);
  }

  function parse_CharClass()
  {
    eventHandler.startNonterminal("CharClass", e0);
    switch (l1)
    {
    case 34:                        // '['
      consume(34);                  // '['
      break;
    default:
      consume(35);                  // '[^'
    }
    for (;;)
    {
      lookahead1(19);               // CharCode | Char | CharRange | CharCodeRange
      switch (l1)
      {
      case 8:                       // Char
        consume(8);                 // Char
        break;
      case 7:                       // CharCode
        consume(7);                 // CharCode
        break;
      case 9:                       // CharRange
        consume(9);                 // CharRange
        break;
      default:
        consume(10);                // CharCodeRange
      }
      lookahead1(20);               // CharCode | Char | CharRange | CharCodeRange | ']'
      if (l1 == 37)                 // ']'
      {
        break;
      }
    }
    consume(37);                    // ']'
    eventHandler.endNonterminal("CharClass", e0);
  }

  function parse_Option()
  {
    eventHandler.startNonterminal("Option", e0);
    consume(23);                    // '/*'
    for (;;)
    {
      lookahead1(9);                // Space | 'ws'
      if (l1 != 3)                  // Space
      {
        break;
      }
      consume(3);                   // Space
    }
    consume(40);                    // 'ws'
    lookahead1(1);                  // ':'
    consume(24);                    // ':'
    for (;;)
    {
      lookahead1(18);               // Space | 'definition' | 'explicit'
      if (l1 != 3)                  // Space
      {
        break;
      }
      consume(3);                   // Space
    }
    switch (l1)
    {
    case 39:                        // 'explicit'
      consume(39);                  // 'explicit'
      break;
    default:
      consume(38);                  // 'definition'
    }
    for (;;)
    {
      lookahead1(7);                // Space | '*/'
      if (l1 != 3)                  // Space
      {
        break;
      }
      consume(3);                   // Space
    }
    consume(18);                    // '*/'
    eventHandler.endNonterminal("Option", e0);
  }

  function parse_Preference()
  {
    eventHandler.startNonterminal("Preference", e0);
    parse_NameOrString();
    lookahead1W(16);                // Whitespace | '<<' | '>>'
    switch (l1)
    {
    case 31:                        // '>>'
      consume(31);                  // '>>'
      for (;;)
      {
        lookahead1W(10);            // Whitespace | Name | StringLiteral
        whitespace();
        parse_NameOrString();
        lookahead1W(22);            // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' |
                                    // '<?ENCORE?>'
        switch (l1)
        {
        case 2:                     // Name
          lookahead2W(36);          // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '::=' | '<<' | '<?ENCORE?>' | '>>' | '?' | '\\'
          switch (lk)
          {
          case 386:                 // Name CaretName
            lookahead3W(28);        // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
            break;
          }
          break;
        case 5:                     // StringLiteral
          lookahead2W(29);          // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '<<' | '<?ENCORE?>' | '>>'
          switch (lk)
          {
          case 389:                 // StringLiteral CaretName
            lookahead3W(28);        // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
            break;
          }
          break;
        default:
          lk = l1;
        }
        if (lk == 11                // EOF
         || lk == 12                // EquivalenceLookAhead
         || lk == 21                // '.'
         || lk == 28                // '<?ENCORE?>'
         || lk == 1602              // Name '::='
         || lk == 1666              // Name '<<'
         || lk == 1669              // StringLiteral '<<'
         || lk == 1986              // Name '>>'
         || lk == 1989              // StringLiteral '>>'
         || lk == 2050              // Name '?'
         || lk == 2306              // Name '\\'
         || lk == 106882            // Name CaretName '<<'
         || lk == 106885            // StringLiteral CaretName '<<'
         || lk == 127362            // Name CaretName '>>'
         || lk == 127365)           // StringLiteral CaretName '>>'
        {
          break;
        }
      }
      break;
    default:
      consume(26);                  // '<<'
      for (;;)
      {
        lookahead1W(10);            // Whitespace | Name | StringLiteral
        whitespace();
        parse_NameOrString();
        lookahead1W(22);            // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' |
                                    // '<?ENCORE?>'
        switch (l1)
        {
        case 2:                     // Name
          lookahead2W(36);          // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '::=' | '<<' | '<?ENCORE?>' | '>>' | '?' | '\\'
          switch (lk)
          {
          case 386:                 // Name CaretName
            lookahead3W(28);        // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
            break;
          }
          break;
        case 5:                     // StringLiteral
          lookahead2W(29);          // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '<<' | '<?ENCORE?>' | '>>'
          switch (lk)
          {
          case 389:                 // StringLiteral CaretName
            lookahead3W(28);        // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
            break;
          }
          break;
        default:
          lk = l1;
        }
        if (lk == 11                // EOF
         || lk == 12                // EquivalenceLookAhead
         || lk == 21                // '.'
         || lk == 28                // '<?ENCORE?>'
         || lk == 1602              // Name '::='
         || lk == 1666              // Name '<<'
         || lk == 1669              // StringLiteral '<<'
         || lk == 1986              // Name '>>'
         || lk == 1989              // StringLiteral '>>'
         || lk == 2050              // Name '?'
         || lk == 2306              // Name '\\'
         || lk == 106882            // Name CaretName '<<'
         || lk == 106885            // StringLiteral CaretName '<<'
         || lk == 127362            // Name CaretName '>>'
         || lk == 127365)           // StringLiteral CaretName '>>'
        {
          break;
        }
      }
    }
    eventHandler.endNonterminal("Preference", e0);
  }

  function parse_Delimiter()
  {
    eventHandler.startNonterminal("Delimiter", e0);
    consume(2);                     // Name
    lookahead1W(6);                 // Whitespace | '\\'
    consume(36);                    // '\\'
    for (;;)
    {
      lookahead1W(10);              // Whitespace | Name | StringLiteral
      whitespace();
      parse_NameOrString();
      lookahead1W(22);              // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' |
                                    // '<?ENCORE?>'
      switch (l1)
      {
      case 2:                       // Name
        lookahead2W(36);            // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '::=' | '<<' | '<?ENCORE?>' | '>>' | '?' | '\\'
        switch (lk)
        {
        case 386:                   // Name CaretName
          lookahead3W(28);          // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
          break;
        }
        break;
      case 5:                       // StringLiteral
        lookahead2W(29);            // Whitespace | Name | StringLiteral | CaretName | EOF | EquivalenceLookAhead |
                                    // '.' | '<<' | '<?ENCORE?>' | '>>'
        switch (lk)
        {
        case 389:                   // StringLiteral CaretName
          lookahead3W(28);          // Whitespace | Name | StringLiteral | EOF | EquivalenceLookAhead | '.' | '<<' |
                                    // '<?ENCORE?>' | '>>'
          break;
        }
        break;
      default:
        lk = l1;
      }
      if (lk == 11                  // EOF
       || lk == 12                  // EquivalenceLookAhead
       || lk == 21                  // '.'
       || lk == 28                  // '<?ENCORE?>'
       || lk == 1602                // Name '::='
       || lk == 1666                // Name '<<'
       || lk == 1669                // StringLiteral '<<'
       || lk == 1986                // Name '>>'
       || lk == 1989                // StringLiteral '>>'
       || lk == 2050                // Name '?'
       || lk == 2306                // Name '\\'
       || lk == 106882              // Name CaretName '<<'
       || lk == 106885              // StringLiteral CaretName '<<'
       || lk == 127362              // Name CaretName '>>'
       || lk == 127365)             // StringLiteral CaretName '>>'
      {
        break;
      }
    }
    eventHandler.endNonterminal("Delimiter", e0);
  }

  function parse_Equivalence()
  {
    eventHandler.startNonterminal("Equivalence", e0);
    consume(12);                    // EquivalenceLookAhead
    lookahead1W(12);                // Whitespace | StringLiteral | '['
    whitespace();
    parse_EquivalenceCharRange();
    lookahead1W(5);                 // Whitespace | '=='
    consume(30);                    // '=='
    lookahead1W(12);                // Whitespace | StringLiteral | '['
    whitespace();
    parse_EquivalenceCharRange();
    eventHandler.endNonterminal("Equivalence", e0);
  }

  function parse_EquivalenceCharRange()
  {
    eventHandler.startNonterminal("EquivalenceCharRange", e0);
    switch (l1)
    {
    case 5:                         // StringLiteral
      consume(5);                   // StringLiteral
      break;
    default:
      consume(34);                  // '['
      lookahead1(19);               // CharCode | Char | CharRange | CharCodeRange
      switch (l1)
      {
      case 8:                       // Char
        consume(8);                 // Char
        break;
      case 7:                       // CharCode
        consume(7);                 // CharCode
        break;
      case 9:                       // CharRange
        consume(9);                 // CharRange
        break;
      default:
        consume(10);                // CharCodeRange
      }
      lookahead1(3);                // ']'
      consume(37);                  // ']'
    }
    eventHandler.endNonterminal("EquivalenceCharRange", e0);
  }

  function parse_Encore()
  {
    eventHandler.startNonterminal("Encore", e0);
    consume(28);                    // '<?ENCORE?>'
    for (;;)
    {
      lookahead1W(13);              // Whitespace | EOF | '<?'
      if (l1 != 27)                 // '<?'
      {
        break;
      }
      whitespace();
      parse_ProcessingInstruction();
    }
    eventHandler.endNonterminal("Encore", e0);
  }

  function consume(t)
  {
    if (l1 == t)
    {
      whitespace();
      eventHandler.terminal(REx.TOKEN[l1], b1, e1);
      b0 = b1; e0 = e1; l1 = l2; if (l1 != 0) {
      b1 = b2; e1 = e2; l2 = l3; if (l2 != 0) {
      b2 = b3; e2 = e3; l3 = 0; }}
    }
    else
    {
      error(b1, e1, 0, l1, t);
    }
  }

  function whitespace()
  {
    if (e0 != b1)
    {
      eventHandler.whitespace(e0, b1);
      e0 = b1;
    }
  }

  function matchW(tokenSetId)
  {
    var code;
    for (;;)
    {
      code = match(tokenSetId);
      if (code != 1)                // Whitespace
      {
        break;
      }
    }
    return code;
  }

  function lookahead1W(tokenSetId)
  {
    if (l1 == 0)
    {
      l1 = matchW(tokenSetId);
      b1 = begin;
      e1 = end;
    }
  }

  function lookahead2W(tokenSetId)
  {
    if (l2 == 0)
    {
      l2 = matchW(tokenSetId);
      b2 = begin;
      e2 = end;
    }
    lk = (l2 << 6) | l1;
  }

  function lookahead3W(tokenSetId)
  {
    if (l3 == 0)
    {
      l3 = matchW(tokenSetId);
      b3 = begin;
      e3 = end;
    }
    lk |= l3 << 12;
  }

  function lookahead1(tokenSetId)
  {
    if (l1 == 0)
    {
      l1 = match(tokenSetId);
      b1 = begin;
      e1 = end;
    }
  }

  function error(b, e, s, l, t)
  {
    throw new thisParser.ParseException(b, e, s, l, t);
  }

  var lk, b0, e0;
  var l1, b1, e1;
  var l2, b2, e2;
  var l3, b3, e3;
  var eventHandler;

  var input;
  var size;

  var begin;
  var end;

  function match(tokenSetId)
  {
    var nonbmp = false;
    begin = end;
    var current = end;
    var result = REx.INITIAL[tokenSetId];
    var state = 0;

    for (var code = result & 255; code != 0; )
    {
      var charclass;
      var c0 = current < size ? input.charCodeAt(current) : 0;
      ++current;
      if (c0 < 0x80)
      {
        charclass = REx.MAP0[c0];
      }
      else if (c0 < 0xd800)
      {
        var c1 = c0 >> 4;
        charclass = REx.MAP1[(c0 & 15) + REx.MAP1[(c1 & 31) + REx.MAP1[c1 >> 5]]];
      }
      else
      {
        if (c0 < 0xdc00)
        {
          var c1 = current < size ? input.charCodeAt(current) : 0;
          if (c1 >= 0xdc00 && c1 < 0xe000)
          {
            ++current;
            c0 = ((c0 & 0x3ff) << 10) + (c1 & 0x3ff) + 0x10000;
            nonbmp = true;
          }
        }

        var lo = 0, hi = 5;
        for (var m = 3; ; m = (hi + lo) >> 1)
        {
          if (REx.MAP2[m] > c0) hi = m - 1;
          else if (REx.MAP2[6 + m] < c0) lo = m + 1;
          else {charclass = REx.MAP2[12 + m]; break;}
          if (lo > hi) {charclass = 0; break;}
        }
      }

      state = code;
      var i0 = (charclass << 8) + code - 1;
      code = REx.TRANSITION[(i0 & 7) + REx.TRANSITION[i0 >> 3]];

      if (code > 255)
      {
        result = code;
        code &= 255;
        end = current;
      }
    }

    result >>= 8;
    if (result == 0)
    {
      end = current - 1;
      var c1 = end < size ? input.charCodeAt(end) : 0;
      if (c1 >= 0xdc00 && c1 < 0xe000) --end;
      return error(begin, end, state, -1, -1);
    }

    if ((result & 64) != 0)
    {
      end = begin;
      if (nonbmp)
      {
        for (var i = result >> 7; i > 0; --i)
        {
          var c1 = end < size ? input.charCodeAt(end++) : 0;
          if (c1 >= 0xd800 && c1 < 0xdc00) ++end;
        }
      }
      else
      {
        end += (result >> 7);
      }
    }
    else
    {
      if (nonbmp)
      {
        for (var i = result >> 7; i > 0; --i)
        {
          --end;
          var c1 = end < size ? input.charCodeAt(end) : 0;
          if (c1 >= 0xdc00 && c1 < 0xe000) --end;
        }
      }
      else
      {
        end -= result >> 7;
      }
    }

    if (end > size) end = size;
    return (result & 63) - 1;
  }

}

REx.XmlSerializer = function(log, indent)
{
  var input = null;
  var delayedTag = null;
  var hasChildElement = false;
  var depth = 0;

  this.reset = function(string)
  {
    log("<?xml version=\"1.0\" encoding=\"UTF-8\"?" + ">");
    input = string;
    delayedTag = null;
    hasChildElement = false;
    depth = 0;
  };

  this.startNonterminal = function(tag, begin)
  {
    if (delayedTag != null)
    {
      log("<");
      log(delayedTag);
      log(">");
    }
    delayedTag = tag;
    if (indent)
    {
      log("\n");
      for (var i = 0; i < depth; ++i)
      {
        log("  ");
      }
    }
    hasChildElement = false;
    ++depth;
  };

  this.endNonterminal = function(tag, end)
  {
    --depth;
    if (delayedTag != null)
    {
      delayedTag = null;
      log("<");
      log(tag);
      log("/>");
    }
    else
    {
      if (indent)
      {
        if (hasChildElement)
        {
          log("\n");
          for (var i = 0; i < depth; ++i)
          {
            log("  ");
          }
        }
      }
      log("</");
      log(tag);
      log(">");
    }
    hasChildElement = true;
  };

  this.terminal = function(tag, begin, end)
  {
    if (tag.charAt(0) == '\'') tag = "TOKEN";
    this.startNonterminal(tag, begin);
    characters(begin, end);
    this.endNonterminal(tag, end);
  };

  this.whitespace = function(begin, end)
  {
    characters(begin, end);
  };

  function characters(begin, end)
  {
    if (begin < end)
    {
      if (delayedTag != null)
      {
        log("<");
        log(delayedTag);
        log(">");
        delayedTag = null;
      }
      log(input.substring(begin, end)
               .replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;"));
    }
  }
};

REx.getTokenSet = function(tokenSetId)
{
  var set = [];
  var s = tokenSetId < 0 ? - tokenSetId : REx.INITIAL[tokenSetId] & 255;
  for (var i = 0; i < 42; i += 32)
  {
    var j = i;
    var i0 = (i >> 5) * 177 + s - 1;
    var f = REx.EXPECTED[(i0 & 3) + REx.EXPECTED[i0 >> 2]];
    for ( ; f != 0; f >>>= 1, ++j)
    {
      if ((f & 1) != 0)
      {
        set.push(REx.TOKEN[j]);
      }
    }
  }
  return set;
};

REx.TopDownTreeBuilder = function()
{
  var input = null;
  var stack = null;

  this.reset = function(i)
  {
    input = i;
    stack = [];
  };

  this.startNonterminal = function(name, begin)
  {
    var nonterminal = new REx.Nonterminal(name, begin, begin, []);
    if (stack.length > 0) addChild(nonterminal);
    stack.push(nonterminal);
  };

  this.endNonterminal = function(name, end)
  {
    stack[stack.length - 1].end = end;
    if (stack.length > 1) stack.pop();
  };

  this.terminal = function(name, begin, end)
  {
    addChild(new REx.Terminal(name, begin, end));
  };

  this.whitespace = function(begin, end)
  {
  };

  function addChild(s)
  {
    var current = stack[stack.length - 1];
    current.children.push(s);
  }

  this.serialize = function(e)
  {
    e.reset(input);
    stack[0].send(e);
  };
};

REx.Terminal = function(name, begin, end)
{
  this.begin = begin;
  this.end = end;

  this.send = function(e)
  {
    e.terminal(name, begin, end);
  };
};

REx.Nonterminal = function(name, begin, end, children)
{
  this.begin = begin;
  this.end = end;

  this.send = function(e)
  {
    e.startNonterminal(name, begin);
    var pos = begin;
    children.forEach
    (
      function(c)
      {
        if (pos < c.begin) e.whitespace(pos, c.begin);
        c.send(e);
        pos = c.end;
      }
    );
    if (pos < end) e.whitespace(pos, end);
    e.endNonterminal(name, end);
  };
};

REx.MAP0 =
[
  /*   0 */ 52, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6,
  /*  36 */ 7, 4, 8, 9, 10, 11, 12, 13, 4, 14, 15, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 4, 19, 20, 21, 22, 4,
  /*  65 */ 23, 23, 24, 23, 25, 23, 26, 26, 26, 26, 27, 26, 26, 28, 29, 26, 26, 30, 31, 32, 26, 26, 26, 26, 26, 26, 33,
  /*  92 */ 34, 35, 36, 26, 4, 23, 23, 37, 38, 39, 40, 26, 26, 41, 26, 26, 42, 26, 43, 44, 45, 26, 26, 46, 47, 26, 26,
  /* 119 */ 48, 49, 26, 26, 4, 50, 4, 4, 4
];

REx.MAP1 =
[
  /*   0 */ 108, 124, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 156, 181, 181, 181, 181,
  /*  21 */ 181, 214, 215, 213, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
  /*  42 */ 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
  /*  63 */ 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
  /*  84 */ 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
  /* 105 */ 214, 214, 214, 247, 261, 277, 293, 309, 325, 371, 387, 424, 424, 424, 416, 355, 347, 355, 347, 355, 355,
  /* 126 */ 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 441, 441, 441, 441, 441, 441, 441,
  /* 147 */ 340, 355, 355, 355, 355, 355, 355, 355, 355, 400, 424, 424, 425, 423, 424, 424, 355, 355, 355, 355, 355,
  /* 168 */ 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 424, 424, 424, 424, 424, 424, 424, 424,
  /* 189 */ 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424, 424,
  /* 210 */ 424, 424, 424, 354, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355,
  /* 231 */ 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 355, 424, 52, 0, 0, 0, 0, 0, 0, 0, 0,
  /* 256 */ 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 7, 4, 8, 9, 10, 11, 12, 13, 4,
  /* 290 */ 14, 15, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 4, 19, 20, 21, 22, 4, 23, 23, 24, 23, 25, 23, 26,
  /* 317 */ 26, 26, 26, 27, 26, 26, 28, 29, 26, 26, 30, 31, 32, 26, 26, 26, 26, 26, 26, 33, 34, 35, 36, 26, 26, 26, 26,
  /* 344 */ 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 4, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
  /* 371 */ 4, 23, 23, 37, 38, 39, 40, 26, 26, 41, 26, 26, 42, 26, 43, 44, 45, 26, 26, 46, 47, 26, 26, 48, 49, 26, 26,
  /* 398 */ 4, 50, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 26, 26, 4, 4, 4, 4, 4, 4, 4, 4, 4, 51, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  /* 433 */ 4, 4, 4, 4, 4, 4, 4, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51
];

REx.MAP2 =
[
  /*  0 */ 57344, 63744, 64976, 65008, 65536, 983040, 63743, 64975, 65007, 65533, 983039, 1114111, 4, 26, 4, 26, 26, 4
];

REx.INITIAL =
[
  /*  0 */ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  /* 29 */ 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52
];

REx.TRANSITION =
[
  /*    0 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*   18 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3275, 1696, 1706, 1698,
  /*   36 */ 1698, 1698, 1813, 2663, 2078, 1728, 2455, 2082, 2150, 2220, 1738, 2805, 3305, 1747, 1758, 3076, 1775, 3257,
  /*   54 */ 1797, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3086, 1809, 1713, 1698, 1698, 1698, 1813, 1729,
  /*   72 */ 2078, 1728, 2125, 2082, 2959, 2220, 1821, 2895, 2405, 1831, 3001, 3270, 1842, 2439, 1797, 1729, 1729, 1729,
  /*   90 */ 1729, 1729, 1729, 1729, 1729, 1729, 3275, 1696, 1720, 1698, 1698, 1698, 1813, 2827, 2078, 1872, 1897, 2188,
  /*  108 */ 2150, 2863, 1738, 2805, 3305, 1747, 1758, 3076, 1775, 3257, 1797, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  126 */ 1729, 1729, 1729, 1729, 2347, 1729, 1729, 1729, 1729, 1823, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205,
  /*  144 */ 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2902,
  /*  162 */ 3230, 1921, 1921, 1921, 1925, 2685, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416,
  /*  180 */ 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2073, 1849, 3286, 1855,
  /*  198 */ 1860, 1823, 2078, 1937, 2341, 2188, 2150, 2880, 2507, 2205, 1834, 2776, 1890, 3416, 3384, 3117, 2683, 1729,
  /*  216 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2347, 3048, 1864, 3054, 3059, 1823, 2078, 1872,
  /*  234 */ 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729,
  /*  252 */ 1729, 1729, 1729, 1729, 1729, 1729, 2347, 2108, 2109, 1950, 1955, 1823, 2078, 1872, 2067, 2188, 2150, 2880,
  /*  270 */ 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  288 */ 1729, 3008, 2326, 2470, 2470, 2470, 2474, 2813, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776,
  /*  306 */ 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2347, 1967,
  /*  324 */ 1974, 1979, 1983, 1823, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117,
  /*  342 */ 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2368, 2347, 1995, 2002, 2008, 2012, 1823,
  /*  360 */ 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729,
  /*  378 */ 1729, 1729, 1729, 1729, 1729, 1729, 2083, 1729, 2347, 1729, 2642, 2024, 2028, 1823, 2078, 2036, 2248, 2188,
  /*  396 */ 2294, 3363, 2402, 2396, 2052, 2049, 2060, 2954, 2091, 2591, 2106, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  414 */ 1729, 1729, 1729, 1729, 2347, 1729, 3033, 2117, 2121, 1823, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205,
  /*  432 */ 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  450 */ 2347, 1729, 1729, 2133, 2137, 1823, 1942, 2145, 2067, 2167, 2174, 2200, 2811, 2213, 1750, 2776, 1890, 3416,
  /*  468 */ 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3341, 2357, 2352, 2358,
  /*  486 */ 2228, 1823, 2078, 1872, 2067, 2188, 2241, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729,
  /*  504 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3063, 1782, 1789, 2262, 2270, 2276, 2281, 1882, 2078, 2289,
  /*  522 */ 3348, 2188, 2233, 2971, 2632, 2626, 2779, 2302, 2313, 2931, 2334, 3177, 2366, 1729, 1729, 1729, 1729, 1729,
  /*  540 */ 1729, 1729, 1729, 1729, 1729, 1729, 2347, 1729, 1729, 1729, 1877, 1823, 2078, 2537, 2067, 2376, 2389, 2413,
  /*  558 */ 2811, 2418, 1750, 3378, 1890, 2734, 2426, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  576 */ 2434, 1730, 2254, 1729, 1959, 2447, 2451, 2463, 2078, 1872, 2067, 2188, 2150, 2754, 2811, 2205, 1750, 2155,
  /*  594 */ 3171, 3081, 3384, 2159, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2912, 2486, 2494,
  /*  612 */ 2519, 2525, 2533, 1823, 2545, 1872, 2557, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117,
  /*  630 */ 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3105, 1729, 2347, 1729, 1729, 1729, 1729, 2571,
  /*  648 */ 2078, 1872, 2181, 2188, 2150, 3189, 2811, 2579, 2305, 2776, 2599, 3411, 2619, 1913, 2640, 1729, 1729, 1729,
  /*  666 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2650, 1987, 2478, 2478, 2657, 1823, 3204, 1872, 2098, 2841,
  /*  684 */ 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 2676, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  702 */ 1729, 1729, 1765, 1767, 2693, 1729, 3421, 2700, 2704, 1823, 2716, 2729, 2742, 2750, 2150, 2880, 2811, 2205,
  /*  720 */ 1750, 2776, 1890, 3209, 2762, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028,
  /*  738 */ 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2845, 2067, 2376, 2389, 2413, 2811, 2418, 1750, 3378, 1890, 2734,
  /*  756 */ 2426, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787,
  /*  774 */ 2790, 1823, 2078, 2845, 2067, 2376, 2389, 2413, 2926, 2418, 1750, 3378, 1890, 2734, 2426, 3117, 2683, 1729,
  /*  792 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2845,
  /*  810 */ 2067, 2798, 2389, 2413, 2811, 2418, 2381, 3378, 1890, 2821, 2426, 3117, 2683, 1729, 1729, 1729, 1729, 1729,
  /*  828 */ 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 2241, 2880,
  /*  846 */ 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  864 */ 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 2241, 2880, 2585, 2205, 1750, 2776,
  /*  882 */ 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787,
  /*  900 */ 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 2241, 2606, 2811, 2205, 1750, 2994, 1890, 3416, 3384, 3117,
  /*  918 */ 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823,
  /*  936 */ 2078, 2835, 2067, 2188, 2241, 2936, 2811, 2205, 2769, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729,
  /*  954 */ 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188,
  /*  972 */ 2241, 2880, 2811, 2205, 1750, 3140, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /*  990 */ 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 2241, 2880, 2811, 2205,
  /* 1008 */ 1750, 2776, 1890, 3406, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028,
  /* 1026 */ 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2853, 2241, 2880, 2811, 2205, 1750, 2776, 1890, 3416,
  /* 1044 */ 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2907, 3320, 3326, 2016, 2871,
  /* 1062 */ 2876, 1823, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729,
  /* 1080 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1799, 1729, 3354, 1729, 1801, 1729, 3359, 3245, 2078, 1872,
  /* 1098 */ 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729,
  /* 1116 */ 1729, 1729, 1729, 1729, 2859, 1729, 1903, 1729, 1729, 1729, 1729, 1823, 2078, 1728, 2708, 2549, 2888, 1739,
  /* 1134 */ 2219, 2920, 1750, 2776, 1890, 3416, 3146, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /* 1152 */ 1729, 1729, 2563, 2667, 2668, 2949, 2967, 1823, 2078, 2979, 3224, 2188, 2150, 2880, 2811, 2205, 1750, 2776,
  /* 1170 */ 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787,
  /* 1188 */ 2787, 2787, 2790, 1823, 2078, 2845, 2067, 2376, 2389, 2413, 2811, 2418, 2987, 3378, 1890, 2734, 2426, 3117,
  /* 1206 */ 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3021, 2787, 2787, 2787, 2790, 1823,
  /* 1224 */ 2078, 2845, 2067, 2376, 2389, 2413, 2811, 2418, 1750, 3378, 1890, 2734, 2426, 3117, 2683, 1729, 1729, 1729,
  /* 1242 */ 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3041, 2787, 2787, 2787, 2790, 1823, 2041, 2845, 2067, 2376,
  /* 1260 */ 2389, 2413, 2811, 2418, 1750, 3378, 1890, 2734, 2426, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /* 1278 */ 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2845, 2067, 3071, 2389, 2413, 2811, 2418,
  /* 1296 */ 1750, 3378, 1890, 2734, 2426, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028,
  /* 1314 */ 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 3094, 2880, 3102, 2941, 1750, 3113, 3125, 3416,
  /* 1332 */ 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787,
  /* 1350 */ 2790, 1823, 2078, 2835, 2067, 2188, 2241, 3133, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729,
  /* 1368 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835,
  /* 1386 */ 2067, 2188, 2241, 2880, 3154, 2205, 1750, 2776, 1890, 3416, 3384, 3164, 2683, 1729, 1729, 1729, 1729, 1729,
  /* 1404 */ 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 2188, 2241, 2880,
  /* 1422 */ 2811, 2205, 1750, 2776, 1890, 2721, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /* 1440 */ 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2067, 3185, 2241, 2880, 2811, 2205, 1750, 2776,
  /* 1458 */ 1890, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787,
  /* 1476 */ 2787, 2787, 2790, 2511, 2078, 2835, 2067, 2188, 3197, 2880, 2811, 2611, 1750, 2776, 3217, 3416, 3238, 3117,
  /* 1494 */ 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823,
  /* 1512 */ 2078, 2835, 2067, 2188, 2241, 2880, 2811, 2205, 1750, 3253, 1890, 3265, 3384, 3117, 2683, 1729, 1729, 1729,
  /* 1530 */ 1729, 1729, 1729, 1729, 1729, 1729, 3031, 3301, 3399, 2787, 2787, 2787, 2790, 1823, 2078, 2835, 2320, 2188,
  /* 1548 */ 2241, 2880, 3283, 2501, 3447, 2776, 1890, 1908, 3294, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /* 1566 */ 1729, 1729, 3031, 3028, 3399, 2787, 2787, 2787, 2790, 1823, 3013, 3313, 2067, 2188, 3334, 2880, 2811, 2205,
  /* 1584 */ 3371, 2776, 3392, 3416, 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 3156,
  /* 1602 */ 2347, 3429, 3434, 3439, 3443, 1823, 2078, 1872, 2067, 2188, 2150, 2880, 2811, 2205, 1750, 2776, 1890, 3416,
  /* 1620 */ 3384, 3117, 2683, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2347, 1729, 1729, 1729,
  /* 1638 */ 1877, 1823, 2078, 1872, 2067, 2188, 2241, 2880, 2811, 2205, 1750, 2776, 1890, 3416, 3384, 3117, 2683, 1729,
  /* 1656 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 2192, 1929, 3462, 3455, 3455, 3465, 1729, 1729, 1729,
  /* 1674 */ 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729, 1729,
  /* 1692 */ 1729, 1729, 1729, 1729, 1084, 1084, 567, 567, 567, 567, 567, 567, 567, 567, 567, 1084, 1084, 0, 0, 567,
  /* 1712 */ 567, 567, 1024, 1024, 0, 0, 567, 567, 567, 1084, 1084, 2376, 2376, 567, 567, 567, 35072, 0, 0, 0, 0, 0, 0,
  /* 1735 */ 0, 0, 57, 625, 0, 0, 0, 0, 0, 0, 0, 100, 649, 650, 0, 0, 0, 0, 0, 144, 134, 0, 100, 144, 144, 134, 134, 0,
  /* 1763 */ 100, 663, 0, 0, 54, 0, 0, 0, 0, 0, 0, 8448, 0, 162, 163, 163, 163, 163, 163, 0, 0, 56, 56, 56, 56, 56, 56,
  /* 1790 */ 68, 0, 2376, 2376, 74, 56, 56, 177, 0, 0, 0, 0, 0, 0, 0, 59, 0, 0, 0, 1024, 1024, 567, 567, 567, 567, 567,
  /* 1816 */ 567, 0, 0, 567, 0, 635, 0, 0, 0, 0, 0, 0, 0, 63, 64, 649, 663, 0, 0, 0, 0, 0, 144, 134, 149, 100, 0, 162,
  /* 1844 */ 174, 174, 174, 174, 174, 0, 0, 79, 0, 0, 0, 0, 79, 79, 79, 0, 79, 79, 79, 79, 0, 0, 0, 0, 0, 3584, 0, 3584,
  /* 1872 */ 35072, 0, 0, 0, 96, 0, 0, 0, 0, 821, 0, 0, 0, 0, 4864, 0, 63, 64, 144, 144, 134, 134, 0, 100, 100, 0, 0,
  /* 1899 */ 96, 0, 85, 598, 0, 68, 0, 0, 9728, 0, 0, 0, 144, 167, 0, 0, 0, 144, 19856, 173, 166, 144, 63, 63, 63, 63,
  /* 1925 */ 63, 63, 63, 63, 0, 0, 0, 0, 0, 3072, 3072, 0, 35072, 0, 0, 0, 97, 0, 0, 0, 68, 68, 0, 0, 92, 0, 3840, 3840,
  /* 1953 */ 3840, 0, 3840, 3840, 3840, 3840, 0, 0, 0, 0, 57, 0, 0, 0, 0, 4096, 4096, 0, 0, 0, 0, 4096, 4096, 4096,
  /* 1977 */ 4096, 0, 4096, 4096, 4096, 4096, 4096, 4096, 4096, 4096, 0, 0, 0, 0, 67, 67, 0, 0, 0, 4352, 0, 0, 0, 0, 0,
  /* 2002 */ 4352, 4352, 0, 4352, 0, 0, 4352, 4352, 4352, 4352, 4352, 4352, 4352, 4352, 0, 0, 0, 0, 77, 9043, 0, 9043,
  /* 2024 */ 4608, 0, 0, 0, 4608, 4608, 4608, 4608, 0, 0, 0, 85, 35072, 6229, 0, 0, 96, 0, 0, 0, 68, 68, 90, 0, 0, 101,
  /* 2050 */ 637, 0, 0, 0, 0, 0, 145, 134, 0, 150, 145, 145, 157, 134, 0, 101, 101, 0, 0, 96, 0, 100, 598, 0, 68, 0, 73,
  /* 2077 */ 73, 0, 0, 0, 68, 68, 0, 0, 0, 0, 0, 0, 0, 61, 0, 145, 164, 164, 163, 164, 164, 0, 0, 96, 0, 100, 598, 0,
  /* 2105 */ 66816, 145, 0, 0, 0, 0, 0, 0, 0, 3840, 0, 3840, 5120, 0, 0, 0, 5120, 5120, 5120, 5120, 0, 0, 0, 0, 85, 567,
  /* 2131 */ 0, 68, 0, 5376, 0, 5376, 0, 5376, 0, 5376, 821, 0, 0, 0, 35164, 0, 0, 0, 96, 0, 0, 0, 100, 100, 100, 598,
  /* 2157 */ 0, 0, 0, 0, 0, 144, 144, 144, 134, 144, 68, 0, 0, 2560, 0, 0, 0, 109, 1890, 0, 100, 100, 100, 598, 0, 0,
  /* 2183 */ 96, 0, 100, 598, 6656, 68, 0, 0, 2560, 0, 0, 0, 0, 0, 3072, 0, 0, 0, 116, 0, 0, 119, 0, 0, 100, 636, 636,
  /* 2210 */ 636, 636, 0, 0, 135, 100, 636, 636, 636, 636, 0, 0, 0, 0, 0, 110, 0, 112, 5632, 5632, 5632, 5632, 821, 0,
  /* 2234 */ 0, 0, 100, 567, 100, 615, 0, 0, 1890, 0, 100, 100, 100, 598, 0, 0, 96, 0, 101, 598, 0, 68, 0, 2376, 2376,
  /* 2259 */ 0, 0, 57, 74, 5944, 56, 74, 56, 56, 74, 56, 5962, 74, 5962, 5962, 56, 74, 5962, 74, 74, 74, 5962, 74, 74,
  /* 2283 */ 74, 74, 0, 0, 56, 598, 35072, 598, 0, 0, 96, 0, 0, 0, 101, 101, 101, 625, 0, 136, 638, 0, 0, 0, 0, 0, 144,
  /* 2310 */ 148, 0, 100, 110, 144, 147, 147, 0, 649, 136, 0, 0, 96, 0, 102, 598, 0, 68, 0, 2376, 2376, 0, 64, 0, 0,
  /* 2335 */ 172, 165, 147, 165, 165, 165, 0, 0, 97, 0, 100, 598, 0, 68, 0, 2376, 2376, 0, 0, 0, 0, 5632, 5632, 0, 5632,
  /* 2360 */ 5632, 5632, 5632, 5632, 5632, 5632, 172, 0, 0, 0, 0, 0, 0, 0, 4352, 0, 68, 0, 0, 2560, 2154, 0, 0, 0, 143,
  /* 2385 */ 144, 134, 0, 100, 0, 1890, 2147, 100, 100, 100, 598, 0, 0, 101, 637, 637, 636, 637, 0, 0, 0, 0, 0, 0, 133,
  /* 2410 */ 110, 0, 100, 0, 2154, 0, 0, 119, 0, 122, 100, 636, 636, 636, 636, 0, 0, 144, 163, 163, 163, 163, 163, 168,
  /* 2434 */ 0, 6400, 0, 0, 57, 0, 0, 0, 144, 144, 174, 177, 144, 57, 0, 57, 57, 0, 0, 57, 57, 0, 0, 0, 0, 85, 598, 0,
  /* 2462 */ 68, 87, 0, 0, 0, 0, 0, 63, 64, 64, 64, 64, 64, 64, 64, 64, 0, 0, 0, 0, 67, 0, 0, 0, 66, 68, 0, 2376, 2376,
  /* 2491 */ 75, 76, 66, 76, 65, 0, 76, 81, 81, 76, 0, 0, 102, 636, 636, 636, 636, 0, 0, 130, 0, 0, 0, 0, 0, 10496, 63,
  /* 2518 */ 64, 82, 82, 82, 82, 81, 76, 82, 76, 76, 76, 84, 76, 76, 76, 81, 81, 81, 81, 0, 0, 0, 0, 96, 0, 0, 0, 0,
  /* 2546 */ 6912, 0, 68, 68, 0, 0, 0, 0, 0, 0, 110, 6912, 0, 96, 6912, 100, 598, 0, 68, 0, 2376, 2376, 0, 0, 1870, 0,
  /* 2572 */ 7936, 0, 0, 0, 0, 63, 64, 19712, 0, 100, 636, 636, 636, 636, 0, 0, 0, 0, 132, 0, 0, 0, 176, 145, 145, 164,
  /* 2598 */ 145, 144, 144, 148, 19860, 0, 100, 100, 0, 0, 117, 0, 119, 0, 0, 100, 636, 636, 636, 650, 0, 0, 173, 166,
  /* 2622 */ 166, 166, 19878, 166, 0, 0, 136, 638, 615, 638, 638, 0, 0, 0, 0, 0, 0, 134, 173, 0, 0, 0, 0, 0, 0, 0, 4608,
  /* 2649 */ 0, 67, 68, 0, 2376, 2376, 0, 0, 67, 67, 67, 67, 0, 8704, 0, 0, 0, 1084, 0, 0, 0, 0, 0, 1870, 0, 0, 0, 0,
  /* 2677 */ 7424, 7680, 144, 144, 144, 163, 144, 0, 0, 0, 0, 0, 0, 0, 1536, 64, 0, 69, 0, 2376, 2376, 0, 0, 8448, 0, 0,
  /* 2703 */ 0, 8448, 8448, 8448, 8448, 0, 0, 0, 0, 100, 598, 0, 68, 7168, 0, 0, 88, 89, 0, 0, 0, 144, 163, 0, 169, 0,
  /* 2729 */ 35072, 0, 94, 95, 96, 0, 0, 0, 144, 163, 168, 0, 0, 95, 7262, 96, 7262, 100, 598, 0, 88, 89, 0, 0, 2560, 0,
  /* 2755 */ 0, 0, 0, 119, 0, 0, 0, 171, 144, 163, 163, 163, 163, 163, 0, 0, 142, 0, 144, 134, 0, 100, 636, 0, 0, 0, 0,
  /* 2782 */ 0, 144, 147, 0, 636, 821, 821, 821, 821, 821, 821, 821, 821, 0, 0, 0, 68, 0, 0, 2560, 2154, 107, 107, 0, 0,
  /* 2807 */ 635, 636, 636, 636, 636, 0, 0, 0, 0, 0, 0, 0, 63, 1536, 0, 160, 0, 144, 163, 168, 0, 0, 0, 1084, 0, 0, 63,
  /* 2834 */ 64, 35072, 0, 0, 0, 96, 1890, 0, 0, 0, 2560, 0, 0, 0, 0, 96, 1890, 0, 0, 68, 0, 0, 2560, 0, 108, 0, 0, 0,
  /* 2862 */ 9728, 0, 0, 0, 0, 119, 110, 0, 112, 0, 9043, 9043, 9043, 77, 9043, 9043, 9043, 9043, 0, 0, 0, 0, 119, 0, 0,
  /* 2887 */ 100, 110, 0, 0, 100, 100, 100, 598, 0, 0, 635, 649, 649, 649, 649, 0, 0, 63, 0, 63, 0, 0, 0, 0, 8960, 0, 0,
  /* 2914 */ 0, 65, 0, 65, 0, 0, 0, 110, 100, 636, 636, 636, 636, 0, 0, 0, 131, 0, 0, 0, 144, 165, 0, 0, 0, 118, 119, 0,
  /* 2942 */ 0, 100, 636, 636, 636, 636, 139, 1870, 0, 0, 0, 1870, 0, 0, 0, 145, 164, 0, 0, 0, 100, 100, 100, 567, 0,
  /* 2967 */ 1870, 1870, 1870, 1870, 0, 0, 0, 0, 119, 120, 0, 100, 35072, 0, 0, 0, 96, 0, 0, 9216, 140, 0, 0, 0, 144,
  /* 2992 */ 134, 0, 100, 636, 0, 0, 0, 0, 155, 144, 144, 110, 110, 0, 100, 663, 0, 0, 64, 0, 64, 0, 0, 0, 68, 68, 0,
  /* 3019 */ 91, 0, 0, 68, 70, 2376, 2376, 821, 821, 0, 0, 821, 821, 0, 0, 0, 0, 0, 0, 0, 5120, 0, 0, 68, 71, 2376,
  /* 3045 */ 2376, 821, 821, 0, 0, 3584, 0, 0, 0, 0, 3584, 3584, 3584, 0, 3584, 3584, 3584, 3584, 0, 0, 0, 0, 56, 56,
  /* 3069 */ 56, 0, 68, 104, 0, 2560, 2154, 0, 0, 0, 156, 157, 0, 0, 0, 0, 163, 0, 0, 0, 0, 567, 567, 567, 1024, 0,
  /* 3095 */ 1890, 0, 100, 100, 100, 598, 114, 636, 0, 129, 0, 0, 0, 0, 0, 58, 0, 0, 100, 636, 0, 153, 0, 0, 0, 144,
  /* 3121 */ 144, 144, 163, 144, 144, 144, 134, 134, 0, 100, 100, 159, 115, 0, 0, 0, 119, 0, 0, 100, 636, 0, 0, 0, 154,
  /* 3146 */ 0, 144, 163, 163, 163, 163, 163, 110, 636, 128, 0, 0, 0, 0, 0, 0, 10752, 0, 9984, 0, 0, 144, 144, 144, 163,
  /* 3171 */ 144, 144, 134, 134, 0, 100, 0, 0, 0, 163, 144, 172, 165, 174, 68, 0, 105, 2560, 0, 0, 0, 0, 119, 121, 0,
  /* 3196 */ 100, 0, 1890, 0, 100, 100, 112, 598, 0, 0, 8192, 68, 8704, 0, 0, 0, 144, 163, 0, 0, 170, 144, 156, 134,
  /* 3220 */ 134, 0, 100, 100, 0, 0, 9312, 0, 100, 598, 0, 68, 0, 2376, 2376, 0, 63, 0, 0, 144, 163, 163, 163, 163, 175,
  /* 3245 */ 0, 0, 9472, 0, 0, 0, 63, 64, 100, 636, 152, 0, 0, 0, 0, 144, 144, 174, 175, 144, 10240, 0, 0, 144, 163, 0,
  /* 3271 */ 0, 0, 156, 162, 0, 0, 0, 0, 567, 567, 567, 1084, 639, 0, 0, 0, 0, 0, 0, 0, 79, 0, 79, 0, 146, 163, 163,
  /* 3298 */ 163, 163, 163, 0, 62, 821, 821, 0, 0, 0, 0, 133, 134, 0, 100, 35165, 0, 0, 0, 96, 1890, 99, 0, 68, 0, 2376,
  /* 3324 */ 2376, 0, 77, 0, 9040, 77, 77, 77, 77, 9040, 111, 1890, 0, 100, 100, 100, 598, 0, 68, 0, 2376, 2376, 0,
  /* 3347 */ 5632, 0, 0, 96, 0, 100, 615, 0, 68, 0, 2376, 2376, 0, 0, 59, 59, 0, 0, 0, 0, 119, 0, 0, 101, 0, 141, 0, 0,
  /* 3375 */ 144, 134, 0, 100, 636, 0, 0, 2957, 0, 0, 144, 163, 163, 163, 163, 163, 0, 144, 144, 134, 134, 158, 100,
  /* 3398 */ 100, 0, 68, 0, 2376, 2376, 821, 821, 0, 0, 161, 144, 163, 0, 0, 0, 144, 166, 0, 0, 0, 144, 163, 0, 0, 0, 0,
  /* 3425 */ 8448, 0, 8448, 0, 0, 10752, 0, 10752, 0, 0, 10752, 10752, 10752, 0, 10752, 10752, 10752, 10752, 10752,
  /* 3444 */ 10752, 10752, 10752, 0, 0, 0, 0, 146, 134, 0, 100, 3072, 3072, 3072, 3072, 3072, 3072, 3072, 3072, 0, 0,
  /* 3465 */ 3072, 3072, 3072, 3072, 0, 0, 0, 0
];

REx.EXPECTED =
[
  /*   0 */ 89, 99, 156, 96, 103, 110, 114, 118, 122, 126, 130, 134, 138, 142, 150, 160, 164, 167, 106, 179, 187, 203,
  /*  22 */ 167, 191, 200, 144, 207, 215, 146, 213, 216, 144, 211, 215, 145, 212, 221, 217, 225, 223, 214, 221, 225,
  /*  43 */ 221, 194, 234, 255, 258, 229, 233, 238, 170, 242, 173, 175, 246, 248, 252, 183, 264, 182, 196, 182, 182,
  /*  64 */ 153, 182, 92, 182, 182, 182, 180, 182, 92, 182, 182, 182, 180, 182, 91, 181, 182, 182, 180, 91, 182, 182,
  /*  86 */ 262, 182, 182, 4, 16777216, 0, 0, 0, 64, 128, 34, 134219778, 65538, 33554434, 1073741826, 2, 262152,
  /* 103 */ -2080374782, 24, 8, 1920, 8388610, 805306368, 268435456, 1920, 813697030, 270538790, -2046820286, 278927398,
  /* 115 */ 138510374, 2138278, 278927398, -1809835994, -1809835930, 278943782, 2203814, 952207398, 948013094,
  /* 124 */ 952141862, 952207398, -1776281498, 278984870, 952862758, 279050406, 986417254, 280098982, 312604838,
  /* 133 */ 313653414, -1125410714, 280754342, 313260198, 314308774, -1800668954, -1799620378, -1767114522, -1766065946,
  /* 142 */ 4, 0, 2, 2, 2, 0, 0, 1024, 33554432, 1073741824, 0, 8, 0, 0, 8, 8, 38, 134217734, 262144, 0, 32, 32,
  /* 164 */ 134217728, 67108864, 0x80000000, 16, 0, 0, 512, 0, 0, 512, 17, 524, 513, 524, 524, 4096, 64, 128, 0, 0, 0,
  /* 185 */ 0, 16, 335544320, 939524096, 4096, 1006632960, 1152, 805306368, 268435456, 4096, 0, 0, 2, 64, 128, 4096, 64,
  /* 202 */ 128, 2, 2, 33554432, 16, 0, 1152, 268435456, 536870912, 0, 1024, 268435456, 536870912, 4096, 4096, 4096, 2,
  /* 219 */ 2, 0, 4096, 4096, 4096, 4096, 0, 268435456, 536870912, 4096, 1, 0, 2, 192, 0, 32, 0, 0, 16, 17, 0, 512, 12,
  /* 242 */ 524, 0, 512, 512, 524, 513, 525, 525, 525, 541, 541, 0, 2, 0, 2, 256, 0, 4, 0, 512, 0, 64, 0, 0, 256, 0
];

REx.TOKEN =
[
  "%ERROR",
  "Whitespace",
  "Name",
  "Space",
  "DirPIContents",
  "StringLiteral",
  "CaretName",
  "CharCode",
  "Char",
  "CharRange",
  "CharCodeRange",
  "EOF",
  "EquivalenceLookAhead",
  "'$'",
  "'&'",
  "'('",
  "')'",
  "'*'",
  "'*/'",
  "'+'",
  "'-'",
  "'.'",
  "'/'",
  "'/*'",
  "':'",
  "'::='",
  "'<<'",
  "'<?'",
  "'<?ENCORE?>'",
  "'<?TOKENS?>'",
  "'=='",
  "'>>'",
  "'?'",
  "'?>'",
  "'['",
  "'[^'",
  "'\\\\'",
  "']'",
  "'definition'",
  "'explicit'",
  "'ws'",
  "'|'"
];

// End
