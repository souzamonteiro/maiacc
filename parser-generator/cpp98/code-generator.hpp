#ifndef MAIACC_CPP98_CODE_GENERATOR_HPP
#define MAIACC_CPP98_CODE_GENERATOR_HPP
#include "grammar-model.hpp"
#include "regex-compiler.hpp"
#include "template-assets.hpp"

struct MaiaCCTokenDefinition {
    MaiaCCText key;
    MaiaCCText name;
    MaiaCCText pattern;
    unsigned int id;
    int literal;
    int skip;
    MaiaCCTokenDefinition* next;
};
struct MaiaCCLexerPattern { MaiaCCTokenDefinition* token; MaiaCCText pattern; int skip; MaiaCCLexerPattern* next; };
struct MaiaCCGenerator {
    MaiaCCArena* arena;
    MaiaCCGrammar* grammar;
    MaiaCCTokenDefinition* tokens;
    MaiaCCTokenDefinition* tokenTail;
    unsigned int tokenCount;
    MaiaCCLexerPattern* patterns;
    int cpp;
    int failed;
};
static void maiaCCNumber(MaiaCCBuffer* output, unsigned int number)
{
    char digits[10]; unsigned int count = 0;
    do { digits[count++] = (char)('0' + number % 10); number /= 10; } while (number);
    while (count) { --count; maiaCCAppend(output, digits + count, 1); }
}
static MaiaCCText maiaCCNumberText(MaiaCCArena* arena, unsigned int number)
{
    MaiaCCBuffer buffer; maiaCCBufferInit(&buffer); maiaCCNumber(&buffer, number); return maiaCCFinish(arena, &buffer);
}
static void maiaCCHex(MaiaCCBuffer* output, unsigned int value, int uppercase)
{
    const char* alphabet = uppercase ? "0123456789ABCDEF" : "0123456789abcdef";
    char digits[8]; unsigned int count = 0;
    do { digits[count++] = alphabet[value & 15]; value >>= 4; } while (value);
    while (count) { --count; maiaCCAppend(output, digits + count, 1); }
}
static int maiaCCAlphanumeric(unsigned int value) { return (value >= 'a' && value <= 'z') || (value >= 'A' && value <= 'Z') || (value >= '0' && value <= '9'); }
static MaiaCCText maiaCCIdentifier(MaiaCCGenerator* generator, MaiaCCText text, int token, int sanitize)
{
    if (!sanitize && !generator->cpp) return text;
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    if (!sanitize && generator->cpp) maiaCCWrite(&output, token ? "MAIACC_TOKEN_" : "maiaCC_parse_");
    for (size_t cursor = 0; cursor < text.length;) {
        unsigned int value = maiaCCReadCodePoint(text, &cursor);
        unsigned int units[2]; unsigned int count = 1;
        units[0] = value;
        if (value > 65535) { value -= 65536; units[0] = 55296 + (value >> 10); units[1] = 56320 + (value & 1023); count = 2; }
        for (unsigned int index = 0; index < count; ++index) {
            value = units[index];
            if (maiaCCAlphanumeric(value) || (!sanitize && (!generator->cpp || value == '_'))) maiaCCWriteCodePoint(&output, value);
            else { maiaCCWrite(&output, sanitize ? "_" : "_x"); maiaCCHex(&output, value, sanitize); maiaCCWrite(&output, "_"); }
        }
    }
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCLiteralName(MaiaCCGenerator* generator, MaiaCCText value)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output); maiaCCWrite(&output, "TOKEN_"); maiaCCWriteText(&output, maiaCCIdentifier(generator, value, 1, 1)); return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCQuote(MaiaCCGenerator* generator, MaiaCCText text)
{
    if (!generator->cpp) return text;
    MaiaCCBuffer output; maiaCCBufferInit(&output); maiaCCWrite(&output, "\"");
    for (size_t index = 0; index < text.length; ++index) {
        char ch = text.data[index];
        if (ch == '\\' || ch == '"') { maiaCCWrite(&output, "\\"); maiaCCAppend(&output, &ch, 1); }
        else if (ch == '\n') maiaCCWrite(&output, "\\n");
        else if (ch == '\r') maiaCCWrite(&output, "\\r");
        else if (ch == '\t') maiaCCWrite(&output, "\\t");
        else maiaCCAppend(&output, &ch, 1);
    }
    maiaCCWrite(&output, "\""); return maiaCCFinish(generator->arena, &output);
}
static const char* maiaCCTemplate(MaiaCCGenerator* generator, const char* name)
{
    for (size_t index = 0; index < sizeof(maiaCCTemplateAssets) / sizeof(MaiaCCTemplateAsset); ++index) if (strcmp(maiaCCTemplateAssets[index].name, name) == 0) return generator->cpp ? maiaCCTemplateAssets[index].cpp : maiaCCTemplateAssets[index].javascript;
    generator->failed = 1; return "";
}
static MaiaCCText maiaCCReplace(MaiaCCGenerator* generator, MaiaCCText text, const char* key, MaiaCCText value)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output); size_t size = strlen(key);
    for (size_t index = 0; index < text.length;) {
        if (size <= text.length - index && memcmp(text.data + index, key, size) == 0) { maiaCCWriteText(&output, value); index += size; }
        else { maiaCCAppend(&output, text.data + index, 1); ++index; }
    }
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCFragment(MaiaCCGenerator* generator, const char* name, const char* key, MaiaCCText value)
{
    return maiaCCReplace(generator, maiaCCText(maiaCCTemplate(generator, name)), key, value);
}
static int maiaCCLowerIs(MaiaCCText text, const char* other)
{
    if (text.length != strlen(other)) return 0;
    for (size_t index = 0; index < text.length; ++index) {
        char ch = text.data[index]; if (ch >= 'A' && ch <= 'Z') ch = (char)(ch + 32);
        if (ch != other[index]) return 0;
    }
    return 1;
}
static MaiaCCText maiaCCEscapePattern(MaiaCCGenerator* generator, MaiaCCText value, int charClass)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    for (size_t cursor = 0; cursor < value.length;) {
        size_t start = cursor;
        if (charClass && value.data[cursor] == '\\' && cursor + 5 < value.length && value.data[cursor + 1] == 'u') {
            int valid = 1;
            for (size_t index = cursor + 2; index < cursor + 6; ++index) if (maiaCCHexDigit((unsigned char)value.data[index]) < 0) valid = 0;
            if (valid) { maiaCCAppend(&output, value.data + cursor, 6); cursor += 6; continue; }
        }
        unsigned int ch = maiaCCReadCodePoint(value, &cursor);
        if (ch < 32 || ch == 127 || ch == 8232 || ch == 8233) maiaCCUnicodeEscape(&output, ch);
        else {
            if ((charClass && (ch == '\\' || ch == ']')) || (!charClass && ch < 128 && strchr(".*+?^${}()|[]\\/", (int)ch))) maiaCCWrite(&output, "\\");
            maiaCCAppend(&output, value.data + start, cursor - start);
        }
    }
    return maiaCCFinish(generator->arena, &output);
}
static void maiaCCEscapeExcluded(MaiaCCBuffer* output, MaiaCCText text)
{
    if (maiaCCTextIs(text, "\n")) maiaCCWrite(output, "\\n");
    else if (maiaCCTextIs(text, "\r")) maiaCCWrite(output, "\\r");
    else if (maiaCCTextIs(text, "\342\200\250")) maiaCCWrite(output, "\\u2028");
    else if (maiaCCTextIs(text, "\342\200\251")) maiaCCWrite(output, "\\u2029");
    else { if (text.length == 1 && strchr("]\\^-", (unsigned char)text.data[0])) maiaCCWrite(output, "\\"); maiaCCWriteText(output, text); }
}
static size_t maiaCCUtf16Length(MaiaCCText text)
{
    size_t length = 0;
    for (size_t cursor = 0; cursor < text.length;) { unsigned int ch = maiaCCReadCodePoint(text, &cursor); length += ch > 65535 ? 2 : 1; }
    return length;
}
struct MaiaCCVisiting { MaiaCCProduction* token; const MaiaCCVisiting* previous; };
static MaiaCCText maiaCCTokenPattern(MaiaCCGenerator* generator, MaiaCCProduction* token, const MaiaCCVisiting* visiting);
static MaiaCCText maiaCCLexicalItem(MaiaCCGenerator* generator, MaiaCCItem* item, const MaiaCCVisiting* visiting);
static MaiaCCText maiaCCLexicalChoices(MaiaCCGenerator* generator, MaiaCCSequence* choices, const MaiaCCVisiting* visiting, int group)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output); unsigned int count = 0;
    for (MaiaCCSequence* sequence = choices; sequence; sequence = sequence->next) {
        MaiaCCBuffer part; maiaCCBufferInit(&part);
        for (MaiaCCItem* item = sequence->first; item; item = item->next) maiaCCWriteText(&part, maiaCCLexicalItem(generator, item, visiting));
        MaiaCCText text = maiaCCFinish(generator->arena, &part);
        if (text.length) { if (count++) maiaCCWrite(&output, "|"); maiaCCWriteText(&output, text); }
    }
    MaiaCCText value = maiaCCFinish(generator->arena, &output);
    if (count && (group || count > 1)) {
        maiaCCWrite(&output, "(?:"); maiaCCWriteText(&output, value); maiaCCWrite(&output, ")"); value = maiaCCFinish(generator->arena, &output);
    }
    return value;
}
static MaiaCCText maiaCCTokenPattern(MaiaCCGenerator* generator, MaiaCCProduction* token, const MaiaCCVisiting* visiting)
{
    if (!token) return maiaCCText("");
    for (const MaiaCCVisiting* cursor = visiting; cursor; cursor = cursor->previous) if (cursor->token == token) return maiaCCText("");
    MaiaCCVisiting mark; mark.token = token; mark.previous = visiting;
    return maiaCCLexicalChoices(generator, token->choices, &mark, 0);
}
static MaiaCCText maiaCCLexicalItem(MaiaCCGenerator* generator, MaiaCCItem* item, const MaiaCCVisiting* visiting)
{
    MaiaCCText base = maiaCCText("");
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    if (item->kind == MAIACC_LITERAL) base = maiaCCEscapePattern(generator, item->value, 0);
    else if (item->kind == MAIACC_TOKEN_REF && !maiaCCTextIs(item->value, "EOF")) base = maiaCCTokenPattern(generator, maiaCCFindProduction(generator->grammar->tokens, item->value), visiting);
    else if (item->kind == MAIACC_CHARCLASS) {
        if (!item->value.length) base = maiaCCText(item->negated ? "[\\s\\S]" : "");
        else {
            maiaCCWrite(&output, item->negated ? "[^" : "["); maiaCCWriteText(&output, maiaCCEscapePattern(generator, item->value, 1)); maiaCCWrite(&output, "]"); base = maiaCCFinish(generator->arena, &output);
        }
    } else if (item->kind == MAIACC_GROUP) base = maiaCCLexicalChoices(generator, item->choices, visiting, 1);
    else if (item->kind == MAIACC_ANY) base = maiaCCText("[\\s\\S]");
    else if (item->kind == MAIACC_DIFFERENCE) {
        MaiaCCItem* left = item->left; MaiaCCItem* right = item->right;
        if (left->kind == MAIACC_ANY && !left->quantifier && right->kind == MAIACC_LITERAL && !right->quantifier && maiaCCUtf16Length(right->value) == 1) {
            maiaCCWrite(&output, "[^"); maiaCCEscapeExcluded(&output, right->value); maiaCCWrite(&output, "]"); base = maiaCCFinish(generator->arena, &output);
        } else if ((left->kind == MAIACC_ANY || (left->kind == MAIACC_TOKEN_REF && maiaCCLowerIs(left->value, "sourcecharacter"))) && !left->quantifier && right->kind == MAIACC_GROUP) {
            for (MaiaCCSequence* sequence = right->choices; sequence; sequence = sequence->next) if (sequence->first && !sequence->first->next) {
                MaiaCCItem* excluded = sequence->first;
                if (excluded->kind == MAIACC_LITERAL) {
                    if (maiaCCUtf16Length(excluded->value) == 1) maiaCCEscapeExcluded(&output, excluded->value);
                    else if (maiaCCTextIs(excluded->value, "\\\\")) maiaCCEscapeExcluded(&output, maiaCCText("\\"));
                } else if (excluded->kind == MAIACC_TOKEN_REF && maiaCCLowerIs(excluded->value, "lineterminator")) maiaCCWrite(&output, "\\n\\r\\u2028\\u2029");
            }
            MaiaCCText excluded = maiaCCFinish(generator->arena, &output);
            if (excluded.length) { maiaCCWrite(&output, "[^"); maiaCCWriteText(&output, excluded); maiaCCWrite(&output, "]"); base = maiaCCFinish(generator->arena, &output); }
            else base = maiaCCLexicalItem(generator, left, visiting);
        } else base = maiaCCLexicalItem(generator, left, visiting);
    }
    if (base.length && item->quantifier) {
        maiaCCWrite(&output, "(?:"); maiaCCWriteText(&output, base); maiaCCWrite(&output, ")"); maiaCCWrite(&output, item->quantifier == 1 ? "?" : (item->quantifier == 2 ? "*" : "+")); base = maiaCCFinish(generator->arena, &output);
    }
    return base;
}
static MaiaCCTokenDefinition* maiaCCFindToken(MaiaCCGenerator* generator, MaiaCCText key)
{
    for (MaiaCCTokenDefinition* token = generator->tokens; token; token = token->next) if (maiaCCTextEqual(token->key, key)) return token;
    return 0;
}
static MaiaCCTokenDefinition* maiaCCAddToken(MaiaCCGenerator* generator, MaiaCCText key, MaiaCCText name, MaiaCCText pattern, int literal, int skip)
{
    MaiaCCTokenDefinition* token = maiaCCFindToken(generator, key);
    if (token) return token;
    token = (MaiaCCTokenDefinition*)maiaCCAllocate(generator->arena, sizeof(MaiaCCTokenDefinition));
    if (!token) { generator->failed = 1; return 0; }
    token->key = key; token->name = name; token->pattern = pattern; token->literal = literal; token->skip = skip; token->id = ++generator->tokenCount;
    if (generator->tokenTail) generator->tokenTail->next = token; else generator->tokens = token;
    generator->tokenTail = token; return token;
}
static void maiaCCCollectTerminals(MaiaCCGenerator* generator, MaiaCCSequence* choices)
{
    for (MaiaCCSequence* sequence = choices; sequence; sequence = sequence->next) for (MaiaCCItem* item = sequence->first; item; item = item->next) {
        if (item->kind == MAIACC_TERMINAL && !maiaCCFindToken(generator, item->value)) maiaCCAddToken(generator, item->value, maiaCCLiteralName(generator, item->value), maiaCCEscapePattern(generator, item->value, 0), 1, 0);
        else if (item->kind == MAIACC_GROUP) maiaCCCollectTerminals(generator, item->choices);
    }
}
static int maiaCCReferences(MaiaCCSequence* choices, MaiaCCText name)
{
    for (MaiaCCSequence* sequence = choices; sequence; sequence = sequence->next) for (MaiaCCItem* item = sequence->first; item; item = item->next) {
        if (item->kind == MAIACC_NONTERMINAL && maiaCCTextEqual(item->value, name)) return 1;
        if (item->kind == MAIACC_GROUP && maiaCCReferences(item->choices, name)) return 1;
    }
    return 0;
}
static int maiaCCPatternNonempty(MaiaCCGenerator* generator, MaiaCCText pattern)
{
    if (!pattern.length) return 0;
    MaiaCCArena scratch; maiaCCArenaInit(&scratch);
    MaiaCCRegexCompiler compiler; maiaCCRegexInit(&compiler, &scratch, pattern);
    int result = 0;
    if (compiler.failed || scratch.failed) generator->failed = 1;
    else {
        MaiaRegexProgram program; program.code = compiler.code; program.ranges = compiler.ranges; program.instruction_count = compiler.count; program.range_count = compiler.rangeCount; program.entry = compiler.entry;
        unsigned int end = 0; unsigned int empty = 0;
        int status = maia_regex_exec(&program, &empty, 0, 0, 0, &end);
        if (status == MAIA_REGEX_NOMATCH) result = 1;
        else if (status != MAIA_REGEX_MATCH) generator->failed = 1;
    }
    maiaCCRegexDestroy(&compiler); maiaCCArenaDestroy(&scratch); return result;
}
static int maiaCCPatternAlready(MaiaCCGenerator* generator, MaiaCCText name)
{
    for (MaiaCCLexerPattern* pattern = generator->patterns; pattern; pattern = pattern->next) if (maiaCCTextEqual(pattern->token->name, name)) return 1;
    return 0;
}
static void maiaCCAddPattern(MaiaCCGenerator* generator, MaiaCCLexerPattern** last, MaiaCCTokenDefinition* token, MaiaCCText pattern, int skip)
{
    MaiaCCLexerPattern* entry = (MaiaCCLexerPattern*)maiaCCAllocate(generator->arena, sizeof(MaiaCCLexerPattern));
    if (!entry || !token) { generator->failed = 1; return; }
    entry->token = token; entry->pattern = pattern; entry->skip = skip;
    if (*last) (*last)->next = entry; else generator->patterns = entry;
    *last = entry;
}
static void maiaCCGeneratorInit(MaiaCCGenerator* generator, MaiaCCArena* arena, MaiaCCGrammar* grammar, int cpp)
{
    memset(generator, 0, sizeof(MaiaCCGenerator)); generator->arena = arena; generator->grammar = grammar; generator->cpp = cpp;
    if (!grammar || !grammar->rules || arena->failed) { generator->failed = 1; return; }
    for (MaiaCCProduction* rule = grammar->rules; rule; rule = rule->next) maiaCCCollectTerminals(generator, rule->choices);
    unsigned int count = 0;
    for (MaiaCCProduction* token = grammar->tokens; token; token = token->next) { if (!maiaCCFindToken(generator, token->name)) maiaCCAddToken(generator, token->name, token->name, maiaCCTokenPattern(generator, token, 0), 0, token->skip); ++count; }
    MaiaCCProduction** ordered = (MaiaCCProduction**)maiaCCAllocate(arena, (count ? count : 1) * sizeof(MaiaCCProduction*));
    unsigned int* indegree = (unsigned int*)maiaCCAllocate(arena, (count ? count : 1) * sizeof(unsigned int));
    unsigned char* adjacency = 0;
    if (count && (size_t)count > ((size_t)-1) / count) { generator->failed = 1; return; }
    adjacency = (unsigned char*)maiaCCAllocate(arena, count ? (size_t)count * count : 1);
    unsigned int* indices = (unsigned int*)maiaCCAllocate(arena, (count ? count : 1) * sizeof(unsigned int));
    unsigned char* used = (unsigned char*)maiaCCAllocate(arena, count ? count : 1);
    if (arena->failed) return;
    unsigned int index = 0;
    for (MaiaCCProduction* token = grammar->tokens; token; token = token->next) ordered[index++] = token;
    for (MaiaCCPreference* preference = grammar->preferences; preference; preference = preference->next) {
        unsigned int low = count; unsigned int high = count;
        for (index = 0; index < count; ++index) { if (maiaCCTextEqual(ordered[index]->name, preference->lower)) low = index; if (maiaCCTextEqual(ordered[index]->name, preference->higher)) high = index; }
        if (low < count && high < count && low != high && !adjacency[(size_t)high * count + low]) { adjacency[(size_t)high * count + low] = 1; ++indegree[low]; }
    }
    unsigned int completed = 0;
    while (completed < count) {
        unsigned int selected = count;
        for (index = 0; index < count; ++index) if (!used[index] && !indegree[index]) { selected = index; break; }
        if (selected == count) break;
        indices[completed++] = selected; used[selected] = 1;
        for (index = 0; index < count; ++index) if (adjacency[(size_t)selected * count + index]) --indegree[index];
    }
    if (completed != count) for (index = 0; index < count; ++index) indices[index] = index;
    MaiaCCLexerPattern* last = 0;
    for (MaiaCCTokenDefinition* token = generator->tokens; token; token = token->next) if (token->literal && !token->skip && !maiaCCPatternAlready(generator, token->name) && maiaCCPatternNonempty(generator, token->pattern)) maiaCCAddPattern(generator, &last, token, token->pattern, 0);
    for (index = 0; index < count; ++index) {
        MaiaCCProduction* token = ordered[indices[index]];
        if (maiaCCTextIs(token->name, "EOF") || maiaCCTextIs(token->name, "DirPIContents") || !token->choices || maiaCCPatternAlready(generator, token->name)) continue;
        int referenced = token->skip;
        for (MaiaCCProduction* rule = grammar->rules; rule && !referenced; rule = rule->next) referenced = maiaCCReferences(rule->choices, token->name);
        if (!referenced) continue;
        MaiaCCText pattern = maiaCCTokenPattern(generator, token, 0);
        if (token->skip && maiaCCLowerIs(token->name, "whitespace")) {
            if (strstr(pattern.data, ";;") || strstr(pattern.data, "\\(;")) pattern = maiaCCText("(?:[\\u0009\\u000A\\u000D\\u0020]+|;;[^\\n\\r\\u2028\\u2029]*(?:\\n|\\r|\\u2028|\\u2029|$)|\\(;[\\s\\S]*?;\\))+");
            else pattern = maiaCCText("(?:[\\u0009\\u000A\\u000D\\u0020]+|\\/\\/[^\\n]*\\n?|\\/\\*(?!\\s*ws\\s*:)[\\s\\S]*?\\*\\/)+");
        }
        if (maiaCCPatternNonempty(generator, pattern)) maiaCCAddPattern(generator, &last, maiaCCFindToken(generator, token->name), pattern, token->skip);
    }
}

#endif
