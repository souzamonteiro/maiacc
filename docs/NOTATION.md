# Notation Reference

This document describes the EBNF (Extended Backus-Naur Form) notation used for grammar specifications in this project. Two variants are documented:

1. **W3C EBNF** - Used in XML and other W3C specifications
2. **REx EBNF** - Used with the REx parser generator

---

## W3C EBNF Notation

The formal grammar in W3C specifications uses a simple Extended Backus-Naur Form (EBNF) notation.

### Basic Rules

Each grammar rule defines one symbol in the form:

```
symbol ::= expression
```

**Symbol naming conventions:**
- Start symbols of regular languages: initial capital letter
- Other symbols: initial lower case letter

### Terminals

| Notation | Description | Example |
|----------|-------------|---------|
| `"string"` | Literal string (double quotes) | `"<element>"` |
| `'string'` | Literal string (single quotes) | `'element'` |
| `#xN` | Character by hexadecimal code point | `#x0A` (line feed) |
| `[a-z]` | Character range | `[a-zA-Z]` |
| `[abc]` | Character enumeration | `[aeiou]` |
| `[#xN-#xM]` | Character range by code point | `[#x20-#x7E]` |
| `[^a-z]` | Complement of character range | `[^0-9]` |
| `[^abc]` | Complement of character enumeration | `[^aeiou]` |

### Combinators

| Operator | Description | Precedence | Example |
|----------|-------------|------------|---------|
| `(expr)` | Grouping | Highest | `(A B) \| C` |
| `A B` | Concatenation | Higher than `\|` | `A B \| C D` = `(A B) \| (C D)` |
| `A \| B` | Alternation (choice) | Lowest | `A \| B \| C` |
| `A - B` | Difference (matches A but not B) | - | `A - B` |
| `A?` | Optional (zero or one) | - | `A?` |
| `A*` | Zero or more | - | `A*` |
| `A+` | One or more | - | `A+` |

### Comments and Constraints

| Notation | Purpose |
|----------|---------|
| `/* ... */` | Comments |
| `[ wfc: ... ]` | Well-formedness constraint |
| `[ vc: ... ]` | Validity constraint |

### Example (from XML specification)

```
element ::= EmptyElemTag | STag content ETag
EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
STag ::= '<' Name (S Attribute)* S? '>'
ETag ::= '</' Name S? '>'
```

---

## REx EBNF Notation

REx (Regular Expression Parser) is a parser generator that uses a specific EBNF syntax with separate syntactic and lexical definitions.

### Grammar Structure

```
Grammar ::= Prolog SyntaxDefinition LexicalDefinition? Encore? EOF
```

- **Prolog**: Processing instructions
- **SyntaxDefinition**: Syntactic productions (non-terminal rules)
- **LexicalDefinition**: Lexical productions (terminal rules, delimited by `<?TOKENS?>`)
- **Encore**: Optional post-processing instructions

### Processing Instructions

Processing instructions allow embedding metadata in the grammar:

```
<?instruction-name instruction-parameters?>
```

### Syntactic Productions

Syntactic productions define the context-free grammar:

```
ProductionName ::= Expression Option*
```

**Naming:** Production names start with a lower case letter.

### Lexical Productions

Lexical productions define tokens and are enclosed in `<?TOKENS?>` section:

```
<?TOKENS?>
TokenName ::= Expression Option*
```

**Naming:** Token names typically start with an upper case letter.

### Operators

REx uses the same basic operators as W3C EBNF but with some additional capabilities:

| Operator | Description |
|----------|-------------|
| `A B` | Concatenation |
| `A | B` | Alternation |
| `A?` | Zero or one |
| `A*` | Zero or more |
| `A+` | One or more |
| `A - B` | Difference (matches A but not B) |
| `A & B` | Intersection (matches A and B) |
| `A` | Simple expression |

### Character Classes

| Notation | Description |
|----------|-------------|
| `[a-z]` | Character range |
| `[abc]` | Character enumeration |
| `[^a-z]` | Complement of range |
| `[^abc]` | Complement of enumeration |
| `#x20` | Character by hexadecimal code point |
| `#x20-#x7E` | Character range by code point |

### Options

Options control whitespace handling:

| Option | Description |
|--------|-------------|
| `/* ws: definition */` | Whitespace is significant in this production |
| `/* ws: explicit */` | Whitespace must be explicitly matched |

### Preferences

Preferences control token priority in the lexer:

```
Identifier << 'get' 'set'
```
This means `get` and `set` are treated as keywords (Identifier) but have higher priority than regular identifiers.

### Delimiters

```
Identifier \\ 'if' 'then' 'else'
```
Excludes the listed strings from matching the token.

### Equivalence Classes

Equivalence classes group characters that are treated identically:

```
[abc] == [ABC]
```

### Character Classes

#### Unicode Categories

REx supports Unicode categories:

| Notation | Description |
|----------|-------------|
| `Lu` | Letter, uppercase |
| `Ll` | Letter, lowercase |
| `Lt` | Letter, titlecase |
| `Lm` | Letter, modifier |
| `Lo` | Letter, other |
| `Mn` | Mark, nonspacing |
| `Mc` | Mark, spacing combining |
| `Me` | Mark, enclosing |
| `Nd` | Number, decimal digit |
| `Nl` | Number, letter |
| `No` | Number, other |
| `Pc` | Punctuation, connector |
| `Pd` | Punctuation, dash |
| `Ps` | Punctuation, open |
| `Pe` | Punctuation, close |
| `Pi` | Punctuation, initial quote |
| `Pf` | Punctuation, final quote |
| `Po` | Punctuation, other |
| `Sc` | Symbol, currency |
| `Sk` | Symbol, modifier |
| `Sm` | Symbol, math |
| `So` | Symbol, other |
| `Zs` | Separator, space |
| `Zl` | Separator, line |
| `Zp` | Separator, paragraph |
| `Cc` | Other, control |
| `Cf` | Other, format |
| `Co` | Other, private use |
| `Cn` | Other, not assigned |

### Reserved Names

| Name | Purpose |
|------|---------|
| `Space` | Whitespace (space, tab, newline) |
| `EOF` | End of file |
| `Ignore` | Ignored tokens (whitespace, comments) |

### Example (JavaScript grammar)

```
Program ::= Shebang? SourceElement* EOF

SourceElement ::= Statement

Statement ::= FunctionDeclaration
            | Block
            | VariableStatement
            | ...

Block ::= '{' Statement* '}'

<?TOKENS?>

Identifier ::= IdentifierStart IdentifierPart* - ReservedWord

Keyword ::= 'break' | 'do' | 'instanceof' | ...

WhiteSpace ::= ( #x0009 | #x000A | #x000D | #x0020 )+

MultiLineComment ::= '/*' ( .* - ( .* '*/' .* ) ) '*/'
```

---

## Comparison: W3C EBNF vs REx EBNF

| Feature | W3C EBNF | REx EBNF |
|---------|----------|----------|
| **Separate lexical definitions** | Not separated | Required (`<?TOKENS?>` section) |
| **Whitespace control** | Not specified | `/* ws: definition/explicit */` |
| **Intersection operator** | Not available | `A & B` |
| **Preferences** | Not available | `<<` operator |
| **Delimiters** | Not available | `\\` operator |
| **Equivalence classes** | Not available | `==` operator |
| **Unicode categories** | Not available | `Lu`, `Ll`, etc. |
| **Processing instructions** | Not available | `<? ... ?>` |
| **Start symbol convention** | Capitalized | Not enforced |

---

## Quick Reference

### W3C EBNF

```
# Basic rule
symbol ::= expression

# Terminals
"literal string"
'literal string'
#x0A
[a-zA-Z]
[abc]
[#x20-#x7E]
[^0-9]
[^abc]

# Operators
(expression)    # grouping
A B             # concatenation
A | B           # alternation
A - B           # difference
A?              # optional
A*              # zero or more
A+              # one or more

# Comments
/* comment */
```

### REx EBNF

```
# Grammar structure
Grammar ::= Prolog SyntaxDefinition LexicalDefinition? Encore? EOF

# Syntactic production
name ::= expression /* ws: explicit */

# Lexical section
<?TOKENS?>
TOKEN ::= expression /* ws: definition */

# Preferences
Token << 'keyword1' 'keyword2'

# Delimiters
Token \\ 'excluded'

# Equivalence
[abc] == [ABC]

# Unicode categories
[Lu]    # uppercase letters
[Ll]    # lowercase letters
[Nd]    # decimal digits

# Processing instruction
<?instruction content?>
```

---

## References

1. **W3C EBNF Specification**: [Extensible Markup Language (XML) 1.0 - Notation](https://www.w3.org/TR/xml/#sec-notation)
2. **REx Parser Generator**: [REx Documentation](https://www.bottlecaps.de/rex/)
3. **ISO/IEC 14977**: Extended BNF standard

---

## Notes for Contributors

- Use **W3C EBNF** for documentation and specifications that follow W3C style
- Use **REx EBNF** for grammar files intended for the REx parser generator
- Always include whitespace handling options in REx productions (`/* ws: explicit */` or `/* ws: definition */`)
- Separate syntactic and lexical productions clearly using the `<?TOKENS?>` delimiter
- Document any custom preferences or delimiters used in the grammar
