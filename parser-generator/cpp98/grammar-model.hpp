#ifndef MAIACC_CPP98_GRAMMAR_MODEL_HPP
#define MAIACC_CPP98_GRAMMAR_MODEL_HPP
#include "model.hpp"

static MaiaCCText maiaCCUnquote(MaiaCCText text)
{
    if (text.length >= 2 && (text.data[0] == '\'' || text.data[0] == '"') && text.data[0] == text.data[text.length - 1]) { ++text.data; text.length -= 2; }
    return text;
}
static int maiaCCQuantifier(MaiaCCNode* node)
{
    int quantifier = 0;
    for (MaiaCCNode* child = node ? node->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, "TOKEN")) {
        if (maiaCCTextIs(child->value, "?") && !quantifier) quantifier = 1;
        if (maiaCCTextIs(child->value, "*")) quantifier = 2;
        if (maiaCCTextIs(child->value, "+")) quantifier = 3;
    }
    return quantifier;
}
static int maiaCCOptions(MaiaCCNode* node)
{
    int options = 0;
    for (MaiaCCNode* child = node ? node->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, "Option")) {
        if (maiaCCTextIs(child->value, "definition")) options |= 1;
        if (maiaCCTextIs(child->value, "explicit")) options |= 2;
        for (MaiaCCNode* token = child->first; token; token = token->next) {
            if (maiaCCTextIs(token->name, "TOKEN") && maiaCCTextIs(token->value, "definition")) options |= 1;
            if (maiaCCTextIs(token->name, "TOKEN") && maiaCCTextIs(token->value, "explicit")) options |= 2;
        }
    }
    return options;
}
static unsigned int maiaCCParseHex(MaiaCCText text, size_t* cursor)
{
    unsigned int value = 0;
    while (*cursor < text.length) {
        int digit = maiaCCHexDigit((unsigned char)text.data[*cursor]);
        if (digit < 0) break;
        if (value > (UINT_MAX - (unsigned int)digit) / 16) value = UINT_MAX;
        else value = value * 16 + (unsigned int)digit;
        ++*cursor;
    }
    return value;
}
static MaiaCCText maiaCCCharCode(MaiaCCArena* arena, MaiaCCText text)
{
    size_t cursor = 0;
    while (cursor + 2 < text.length && !(text.data[cursor] == '#' && text.data[cursor + 1] == 'x')) ++cursor;
    if (cursor + 2 >= text.length) return text;
    cursor += 2;
    unsigned int value = maiaCCParseHex(text, &cursor);
    MaiaCCBuffer buffer; maiaCCBufferInit(&buffer);
    if (value <= 65535) maiaCCWriteCodePoint(&buffer, value);
    return maiaCCFinish(arena, &buffer);
}
static void maiaCCUnicodeEscape(MaiaCCBuffer* buffer, unsigned int value)
{
    const char* digits = "0123456789abcdef";
    char text[6]; text[0] = '\\'; text[1] = 'u';
    for (unsigned int index = 0; index < 4; ++index) text[index + 2] = digits[(value >> ((3 - index) * 4)) & 15];
    maiaCCAppend(buffer, text, 6);
}
static void maiaCCCharCodeRange(MaiaCCBuffer* buffer, MaiaCCText text)
{
    if (text.length < 7 || text.data[0] != '#' || text.data[1] != 'x') return;
    size_t cursor = 2;
    unsigned int first = maiaCCParseHex(text, &cursor);
    if (cursor + 3 >= text.length || text.data[cursor] != '-' || text.data[cursor + 1] != '#' || text.data[cursor + 2] != 'x') return;
    cursor += 3;
    unsigned int last = maiaCCParseHex(text, &cursor);
    if (cursor != text.length || first > 65535 || last > 65535) return;
    maiaCCUnicodeEscape(buffer, first); maiaCCWrite(buffer, "-"); maiaCCUnicodeEscape(buffer, last);
}

static MaiaCCSequence* maiaCCModelChoices(MaiaCCArena* arena, MaiaCCNode* choice, int lexical, int context);
static MaiaCCItem* maiaCCModelItem(MaiaCCArena* arena, MaiaCCNode* node, int lexical)
{
    MaiaCCNode* primary = maiaCCChild(node, lexical ? "LexicalPrimary" : "SyntaxPrimary");
    if (!primary) return 0;
    MaiaCCItem* item = (MaiaCCItem*)maiaCCAllocate(arena, sizeof(MaiaCCItem));
    if (!item) return 0;
    item->value = maiaCCText(""); item->context = maiaCCText("");
    item->quantifier = maiaCCQuantifier(node);
    MaiaCCNode* nameOrString = maiaCCChild(primary, "NameOrString");
    MaiaCCNode* container = nameOrString ? nameOrString : primary;
    MaiaCCNode* name = maiaCCChild(container, "Name");
    MaiaCCNode* literal = maiaCCChild(container, "StringLiteral");
    if (name) { item->kind = lexical ? MAIACC_TOKEN_REF : MAIACC_NONTERMINAL; item->value = name->value; }
    else if (literal) { item->kind = lexical ? MAIACC_LITERAL : MAIACC_TERMINAL; item->value = maiaCCUnquote(literal->value); }
    else if (maiaCCChild(primary, lexical ? "LexicalChoice" : "SyntaxChoice")) {
        item->kind = MAIACC_GROUP;
        item->choices = maiaCCModelChoices(arena, maiaCCChild(primary, lexical ? "LexicalChoice" : "SyntaxChoice"), lexical, 0);
    } else if (lexical) {
        MaiaCCNode* charClass = maiaCCChild(primary, "CharClass");
        MaiaCCNode* code = maiaCCChild(primary, "CharCode");
        MaiaCCNode* character = maiaCCChild(primary, "Char");
        MaiaCCNode* token = maiaCCChild(primary, "TOKEN");
        if (charClass) {
            item->kind = MAIACC_CHARCLASS;
            MaiaCCBuffer buffer; maiaCCBufferInit(&buffer);
            for (MaiaCCNode* child = charClass->first; child; child = child->next) if (maiaCCTextIs(child->name, "TOKEN") && maiaCCTextIs(child->value, "[^")) item->negated = 1;
            /* xml2js groups equal child names; retain the reference's group order. */
            const char* kinds[4]; kinds[0] = "CharRange"; kinds[1] = "Char"; kinds[2] = "CharCode"; kinds[3] = "CharCodeRange";
            for (unsigned int kind = 0; kind < 4; ++kind) for (MaiaCCNode* child = charClass->first; child; child = child->next) if (maiaCCTextIs(child->name, kinds[kind])) {
                if (kind == 2) maiaCCWriteText(&buffer, maiaCCCharCode(arena, child->value));
                else if (kind == 3) maiaCCCharCodeRange(&buffer, child->value);
                else maiaCCWriteText(&buffer, child->value);
            }
            item->value = maiaCCFinish(arena, &buffer);
        } else if (code) { item->kind = MAIACC_LITERAL; item->value = maiaCCCharCode(arena, code->value); }
        else if (character) { item->kind = MAIACC_LITERAL; item->value = character->value; }
        else if (token) {
            if (maiaCCTextIs(token->value, ".")) item->kind = MAIACC_ANY;
            else if (maiaCCTextIs(token->value, "$")) { item->kind = MAIACC_TOKEN_REF; item->value = maiaCCText("EOF"); }
            else { item->kind = MAIACC_LITERAL; item->value = token->value; }
        }
    }
    if (nameOrString) {
        MaiaCCNode* ctx = maiaCCChild(nameOrString, "Context");
        item->context = maiaCCChildText(ctx, "CaretName");
        if (item->context.length && item->context.data[0] == '^') { ++item->context.data; --item->context.length; }
    }
    return item;
}
static MaiaCCSequence* maiaCCModelSequence(MaiaCCArena* arena, MaiaCCNode* node, int lexical)
{
    MaiaCCSequence* sequence = (MaiaCCSequence*)maiaCCAllocate(arena, sizeof(MaiaCCSequence));
    if (!sequence) return 0;
    unsigned int count = 0; int difference = 0;
    for (MaiaCCNode* child = node ? node->first : 0; child; child = child->next) {
        if (lexical && maiaCCTextIs(child->name, "TOKEN") && maiaCCTextIs(child->value, "-")) difference = 1;
        if (!maiaCCTextIs(child->name, lexical ? "LexicalItem" : "SyntaxItem")) continue;
        MaiaCCItem* item = maiaCCModelItem(arena, child, lexical);
        if (item) {
            if (sequence->last) sequence->last->next = item; else sequence->first = item;
            sequence->last = item; ++count;
        }
    }
    if (difference && count == 2) {
        MaiaCCItem* item = (MaiaCCItem*)maiaCCAllocate(arena, sizeof(MaiaCCItem));
        if (item) {
            item->kind = MAIACC_DIFFERENCE; item->left = sequence->first; item->right = sequence->last;
            item->left->next = 0; sequence->first = item; sequence->last = item;
        }
    }
    return sequence;
}
static MaiaCCSequence* maiaCCModelChoices(MaiaCCArena* arena, MaiaCCNode* choice, int lexical, int context)
{
    MaiaCCSequence* first = 0; MaiaCCSequence* last = 0;
    const char* sequenceName = context ? "ContextExpression" : (lexical ? "LexicalSequence" : "SyntaxSequence");
    for (MaiaCCNode* child = choice ? choice->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, sequenceName)) {
        MaiaCCSequence* sequence = maiaCCModelSequence(arena, context ? maiaCCChild(child, "LexicalSequence") : child, lexical);
        if (!sequence) break;
        if (last) last->next = sequence; else first = sequence;
        last = sequence;
    }
    return first;
}
static MaiaCCProduction* maiaCCModelProductions(MaiaCCArena* arena, MaiaCCNode* definition, int lexical)
{
    MaiaCCProduction* first = 0; MaiaCCProduction* last = 0;
    for (MaiaCCNode* child = definition ? definition->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, lexical ? "LexicalProduction" : "SyntaxProduction")) {
        MaiaCCProduction* production = (MaiaCCProduction*)maiaCCAllocate(arena, sizeof(MaiaCCProduction));
        if (!production) break;
        production->name = maiaCCChildText(child, "Name");
        production->choices = maiaCCModelChoices(arena, maiaCCChild(child, lexical ? "ContextChoice" : "SyntaxChoice"), lexical, lexical);
        production->options = maiaCCOptions(child); production->skip = lexical && (production->options & 1);
        MaiaCCProduction* previous = maiaCCFindProduction(first, production->name);
        if (previous) {
            previous->choices = production->choices; previous->options = production->options; previous->skip = production->skip;
        } else {
            if (last) last->next = production; else first = production;
            last = production;
        }
    }
    return first;
}
static MaiaCCGrammar* maiaCCBuildGrammar(MaiaCCArena* arena, MaiaCCNode* root)
{
    if (!root || !maiaCCTextIs(root->name, "Grammar")) { arena->failed = 1; return 0; }
    MaiaCCGrammar* grammar = (MaiaCCGrammar*)maiaCCAllocate(arena, sizeof(MaiaCCGrammar));
    if (!grammar) return 0;
    grammar->rules = maiaCCModelProductions(arena, maiaCCChild(root, "SyntaxDefinition"), 0);
    MaiaCCNode* lexical = maiaCCChild(root, "LexicalDefinition");
    grammar->tokens = maiaCCModelProductions(arena, lexical, 1);
    grammar->start = grammar->rules ? grammar->rules->name : maiaCCText("");
    MaiaCCPreference* last = 0;
    for (MaiaCCNode* child = lexical ? lexical->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, "Preference")) {
        MaiaCCNode* op = maiaCCChild(child, "TOKEN"); unsigned int ops = 0;
        for (MaiaCCNode* token = child->first; token; token = token->next) if (maiaCCTextIs(token->name, "TOKEN")) ++ops;
        if (!op || ops != 1 || (!maiaCCTextIs(op->value, "<<") && !maiaCCTextIs(op->value, ">>"))) continue;
        MaiaCCNode* left = maiaCCChild(child, "NameOrString");
        for (MaiaCCNode* right = left ? left->next : 0; right; right = right->next) if (maiaCCTextIs(right->name, "NameOrString")) {
            MaiaCCNode* low = maiaCCTextIs(op->value, "<<") ? right : left;
            MaiaCCNode* high = low == left ? right : left;
            MaiaCCPreference* preference = (MaiaCCPreference*)maiaCCAllocate(arena, sizeof(MaiaCCPreference));
            if (!preference) break;
            preference->lowerLiteral = !maiaCCChild(low, "Name"); preference->higherLiteral = !maiaCCChild(high, "Name");
            preference->lower = maiaCCUnquote(maiaCCChildText(low, preference->lowerLiteral ? "StringLiteral" : "Name"));
            preference->higher = maiaCCUnquote(maiaCCChildText(high, preference->higherLiteral ? "StringLiteral" : "Name"));
            if (last) last->next = preference; else grammar->preferences = preference;
            last = preference;
        }
    }
    for (MaiaCCProduction* rule = grammar->rules; rule; rule = rule->next) if (rule->options & 1) {
        for (MaiaCCSequence* sequence = rule->choices; sequence; sequence = sequence->next) for (MaiaCCItem* item = sequence->first; item; item = item->next) if (item->kind == MAIACC_NONTERMINAL) {
            MaiaCCProduction* token = maiaCCFindProduction(grammar->tokens, item->value);
            if (token) token->skip = 1;
        }
    }
    return grammar;
}
#endif
