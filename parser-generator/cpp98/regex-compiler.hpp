#ifndef MAIACC_CPP98_REGEX_COMPILER_HPP
#define MAIACC_CPP98_REGEX_COMPILER_HPP
#include "model.hpp"
#include "maia_regex.h"

/* Port of the existing backend's ordered instruction compiler. This is the
 * MaiaCC-owned regex-to-program stage; matching remains in MaiaRegex. */
struct MaiaCCRegexRange { unsigned int first; unsigned int last; MaiaCCRegexRange* next; };
struct MaiaCCRegexNode {
    int kind; /* sequence=1 choice=2 char=3 class=4 end=5 repeat=6 negative=7 positive=8 */
    unsigned int value;
    int negated;
    int lazy;
    MaiaCCRegexNode* first;
    MaiaCCRegexNode* last;
    MaiaCCRegexNode* previous;
    MaiaCCRegexRange* ranges;
    MaiaCCRegexRange* rangeTail;
};
struct MaiaCCRegexCompiler {
    MaiaCCArena* arena;
    unsigned int* units;
    size_t length;
    size_t position;
    MaiaRegexInstruction* code;
    unsigned int count;
    unsigned int capacity;
    MaiaRegexRange* ranges;
    unsigned int rangeCount;
    unsigned int rangeCapacity;
    unsigned int entry;
    int failed;
};
static unsigned int maiaCCReadCodePoint(MaiaCCText text, size_t* cursor)
{
    unsigned int value = (unsigned char)text.data[(*cursor)++];
    unsigned int extra = 0;
    if (value >= 192 && value < 224) { value &= 31; extra = 1; }
    else if (value >= 224 && value < 240) { value &= 15; extra = 2; }
    else if (value >= 240) { value &= 7; extra = 3; }
    while (extra && *cursor < text.length) { value = (value << 6) | ((unsigned char)text.data[(*cursor)++] & 63); --extra; }
    return value;
}
static MaiaCCRegexNode* maiaCCRegexNode(MaiaCCRegexCompiler* compiler, int kind)
{
    MaiaCCRegexNode* node = (MaiaCCRegexNode*)maiaCCAllocate(compiler->arena, sizeof(MaiaCCRegexNode));
    if (node) node->kind = kind; else compiler->failed = 1;
    return node;
}
static void maiaCCRegexChild(MaiaCCRegexNode* parent, MaiaCCRegexNode* child)
{
    if (!parent || !child) return;
    child->previous = parent->last;
    if (!parent->first) parent->first = child;
    parent->last = child;
}
static unsigned int maiaCCRegexPeek(MaiaCCRegexCompiler* compiler) { return compiler->position < compiler->length ? compiler->units[compiler->position] : 0; }
static unsigned int maiaCCRegexTake(MaiaCCRegexCompiler* compiler)
{
    if (compiler->position >= compiler->length) { compiler->failed = 1; return 0; }
    return compiler->units[compiler->position++];
}
static int maiaCCRegexShorthand(unsigned int character) { return character && (character == 's' || character == 'S' || character == 'd' || character == 'D' || character == 'w' || character == 'W'); }
static void maiaCCRegexRange(MaiaCCRegexCompiler* compiler, MaiaCCRegexNode* node, unsigned int first, unsigned int last)
{
    if (!node) return;
    if (last < first) { compiler->failed = 1; return; }
    MaiaCCRegexRange* range = (MaiaCCRegexRange*)maiaCCAllocate(compiler->arena, sizeof(MaiaCCRegexRange));
    if (!range) { compiler->failed = 1; return; }
    range->first = first; range->last = last;
    if (node->rangeTail) node->rangeTail->next = range; else node->ranges = range;
    node->rangeTail = range;
}
static void maiaCCRegexShorthandRanges(MaiaCCRegexCompiler* compiler, MaiaCCRegexNode* node, unsigned int ch)
{
    unsigned int pairs[20]; unsigned int count = 0;
    unsigned int lower = ch >= 'A' && ch <= 'Z' ? ch + 32 : ch;
    if (lower == 's') {
        const unsigned int spaces[20] = {9,13,32,32,160,160,5760,5760,8192,8202,8232,8233,8239,8239,8287,8287,12288,12288,65279,65279};
        memcpy(pairs, spaces, sizeof(spaces)); count = 10;
    } else if (lower == 'd') { pairs[0] = 48; pairs[1] = 57; count = 1; }
    else { pairs[0] = 48; pairs[1] = 57; pairs[2] = 65; pairs[3] = 90; pairs[4] = 95; pairs[5] = 95; pairs[6] = 97; pairs[7] = 122; count = 4; }
    unsigned int start = 0;
    for (unsigned int index = 0; index < count; ++index) {
        unsigned int first = pairs[index * 2]; unsigned int last = pairs[index * 2 + 1];
        if (ch == lower) maiaCCRegexRange(compiler, node, first, last);
        else if (first > start) maiaCCRegexRange(compiler, node, start, first - 1);
        start = last + 1;
    }
    if (ch != lower && start <= 65535) maiaCCRegexRange(compiler, node, start, 65535);
}
static unsigned int maiaCCRegexEscaped(MaiaCCRegexCompiler* compiler)
{
    unsigned int ch = maiaCCRegexTake(compiler);
    if (ch == 'n') return 10;
    if (ch == 'r') return 13;
    if (ch == 't') return 9;
    if (ch == 'v') return 11;
    if (ch == 'f') return 12;
    if (ch == 'b') return 8;
    if (ch == '0') return 0;
    if (ch >= '1' && ch <= '9') compiler->failed = 1;
    if (ch == 'u' || ch == 'x') {
        unsigned int count = ch == 'u' ? 4 : 2; unsigned int value = 0;
        for (unsigned int index = 0; index < count; ++index) {
            int digit = maiaCCHexDigit(maiaCCRegexTake(compiler));
            if (digit < 0) { compiler->failed = 1; return 0; }
            value = value * 16 + (unsigned int)digit;
        }
        return value;
    }
    return ch;
}
static MaiaCCRegexNode* maiaCCRegexChoice(MaiaCCRegexCompiler* compiler);
static MaiaCCRegexNode* maiaCCRegexAtom(MaiaCCRegexCompiler* compiler)
{
    unsigned int character = maiaCCRegexTake(compiler);
    if (character == '(') {
        int kind = 0;
        if (maiaCCRegexPeek(compiler) == '?') {
            ++compiler->position; unsigned int modifier = maiaCCRegexTake(compiler);
            if (modifier == '!') kind = 7;
            else if (modifier == '=') kind = 8;
            else if (modifier != ':') compiler->failed = 1;
        }
        MaiaCCRegexNode* child = maiaCCRegexChoice(compiler);
        if (maiaCCRegexTake(compiler) != ')') compiler->failed = 1;
        if (!kind) return child;
        MaiaCCRegexNode* node = maiaCCRegexNode(compiler, kind); maiaCCRegexChild(node, child); return node;
    }
    if (character == '[') {
        MaiaCCRegexNode* node = maiaCCRegexNode(compiler, 4);
        if (!node) return 0;
        node->negated = maiaCCRegexPeek(compiler) == '^';
        if (node->negated) ++compiler->position;
        while (!compiler->failed && compiler->position < compiler->length && maiaCCRegexPeek(compiler) != ']') {
            if (maiaCCRegexPeek(compiler) == '\\' && compiler->position + 1 < compiler->length && maiaCCRegexShorthand(compiler->units[compiler->position + 1])) {
                ++compiler->position; maiaCCRegexShorthandRanges(compiler, node, maiaCCRegexTake(compiler)); continue;
            }
            unsigned int first = maiaCCRegexTake(compiler);
            if (first == '\\') first = maiaCCRegexEscaped(compiler);
            unsigned int last = first;
            if (maiaCCRegexPeek(compiler) == '-' && compiler->position + 1 < compiler->length && compiler->units[compiler->position + 1] != ']') {
                ++compiler->position; last = maiaCCRegexTake(compiler);
                if (last == '\\') last = maiaCCRegexEscaped(compiler);
            }
            maiaCCRegexRange(compiler, node, first, last);
        }
        if (maiaCCRegexTake(compiler) != ']') compiler->failed = 1;
        return node;
    }
    if (character == '\\' && maiaCCRegexShorthand(maiaCCRegexPeek(compiler))) {
        MaiaCCRegexNode* node = maiaCCRegexNode(compiler, 4);
        maiaCCRegexShorthandRanges(compiler, node, maiaCCRegexTake(compiler)); return node;
    }
    if (character == '$') return maiaCCRegexNode(compiler, 5);
    if (character == '.') {
        MaiaCCRegexNode* node = maiaCCRegexNode(compiler, 4);
        if (!node) return 0;
        node->negated = 1;
        maiaCCRegexRange(compiler, node, 10, 10); maiaCCRegexRange(compiler, node, 13, 13); maiaCCRegexRange(compiler, node, 8232, 8233); return node;
    }
    if (character == '*' || character == '+' || character == '?' || character == '{' || character == '}' || character == '^') compiler->failed = 1;
    MaiaCCRegexNode* node = maiaCCRegexNode(compiler, 3);
    if (node) node->value = character == '\\' ? maiaCCRegexEscaped(compiler) : character;
    return node;
}
static MaiaCCRegexNode* maiaCCRegexSequence(MaiaCCRegexCompiler* compiler)
{
    MaiaCCRegexNode* sequence = maiaCCRegexNode(compiler, 1);
    while (!compiler->failed && compiler->position < compiler->length && maiaCCRegexPeek(compiler) != ')' && maiaCCRegexPeek(compiler) != '|') {
        MaiaCCRegexNode* child = maiaCCRegexAtom(compiler);
        unsigned int quantifier = maiaCCRegexPeek(compiler);
        if (quantifier == '*' || quantifier == '+' || quantifier == '?') {
            ++compiler->position; MaiaCCRegexNode* repeat = maiaCCRegexNode(compiler, 6);
            if (!repeat) break;
            repeat->value = quantifier; repeat->lazy = maiaCCRegexPeek(compiler) == '?';
            if (repeat->lazy) ++compiler->position;
            maiaCCRegexChild(repeat, child); child = repeat;
        }
        maiaCCRegexChild(sequence, child);
    }
    return sequence;
}
static MaiaCCRegexNode* maiaCCRegexChoice(MaiaCCRegexCompiler* compiler)
{
    MaiaCCRegexNode* choice = maiaCCRegexNode(compiler, 2);
    maiaCCRegexChild(choice, maiaCCRegexSequence(compiler));
    while (!compiler->failed && maiaCCRegexPeek(compiler) == '|') { ++compiler->position; maiaCCRegexChild(choice, maiaCCRegexSequence(compiler)); }
    return choice;
}
static unsigned int maiaCCRegexEmit(MaiaCCRegexCompiler* compiler, unsigned int op, unsigned int first, unsigned int second, unsigned int next)
{
    if (compiler->count == compiler->capacity) {
        unsigned int capacity = compiler->capacity ? compiler->capacity * 2 : 32;
        if (capacity <= compiler->capacity || (size_t)capacity > ((size_t)-1) / sizeof(MaiaRegexInstruction)) { compiler->failed = 1; return 0; }
        MaiaRegexInstruction* code = (MaiaRegexInstruction*)realloc(compiler->code, capacity * sizeof(MaiaRegexInstruction));
        if (!code) { compiler->failed = 1; return 0; }
        compiler->code = code; compiler->capacity = capacity;
    }
    unsigned int index = compiler->count++;
    MaiaRegexInstruction* instruction = compiler->code + index;
    instruction->op = op; instruction->first = first; instruction->second = second; instruction->next = next;
    return index;
}
static unsigned int maiaCCRegexCompileNode(MaiaCCRegexCompiler* compiler, MaiaCCRegexNode* node, unsigned int next)
{
    if (!node || compiler->failed) return 0;
    if (node->kind == 1) {
        for (MaiaCCRegexNode* child = node->last; child; child = child->previous) next = maiaCCRegexCompileNode(compiler, child, next);
        return next;
    }
    if (node->kind == 2) {
        unsigned int entry = maiaCCRegexCompileNode(compiler, node->last, next);
        for (MaiaCCRegexNode* child = node->last ? node->last->previous : 0; child; child = child->previous) {
            unsigned int first = maiaCCRegexCompileNode(compiler, child, next);
            entry = maiaCCRegexEmit(compiler, 2, first, entry, 0);
        }
        return entry;
    }
    if (node->kind == 6) {
        if (node->value == '?') {
            unsigned int entry = maiaCCRegexCompileNode(compiler, node->first, next);
            return maiaCCRegexEmit(compiler, 2, node->lazy ? next : entry, node->lazy ? entry : next, 0);
        }
        unsigned int split = maiaCCRegexEmit(compiler, 2, 0, 0, 0);
        unsigned int entry = maiaCCRegexCompileNode(compiler, node->first, split);
        compiler->code[split].first = node->lazy ? next : entry;
        compiler->code[split].second = node->lazy ? entry : next;
        return node->value == '+' ? entry : split;
    }
    if (node->kind == 3) return maiaCCRegexEmit(compiler, 1, node->value, 0, next);
    if (node->kind == 4) {
        unsigned int start = compiler->rangeCount;
        for (MaiaCCRegexRange* range = node->ranges; range; range = range->next) {
            if (compiler->rangeCount == compiler->rangeCapacity) {
                unsigned int capacity = compiler->rangeCapacity ? compiler->rangeCapacity * 2 : 16;
                if (capacity <= compiler->rangeCapacity || (size_t)capacity > ((size_t)-1) / sizeof(MaiaRegexRange)) { compiler->failed = 1; return 0; }
                MaiaRegexRange* ranges = (MaiaRegexRange*)realloc(compiler->ranges, capacity * sizeof(MaiaRegexRange));
                if (!ranges) { compiler->failed = 1; return 0; }
                compiler->ranges = ranges; compiler->rangeCapacity = capacity;
            }
            compiler->ranges[compiler->rangeCount].first = range->first;
            compiler->ranges[compiler->rangeCount++].last = range->last;
        }
        return maiaCCRegexEmit(compiler, node->negated ? 4 : 3, start, compiler->rangeCount - start, next);
    }
    if (node->kind == 5) return maiaCCRegexEmit(compiler, 5, 0, 0, next);
    if (node->kind == 7 || node->kind == 8) {
        unsigned int end = maiaCCRegexEmit(compiler, 0, 0, 0, 0);
        unsigned int entry = maiaCCRegexCompileNode(compiler, node->first, end);
        return maiaCCRegexEmit(compiler, node->kind == 7 ? 6 : 7, entry, 0, next);
    }
    compiler->failed = 1; return 0;
}
static void maiaCCRegexInit(MaiaCCRegexCompiler* compiler, MaiaCCArena* arena, MaiaCCText pattern)
{
    memset(compiler, 0, sizeof(MaiaCCRegexCompiler)); compiler->arena = arena;
    if (pattern.length >= ((size_t)-1) / sizeof(unsigned int)) { compiler->failed = 1; return; }
    compiler->units = (unsigned int*)maiaCCAllocate(arena, (pattern.length + 1) * sizeof(unsigned int));
    if (!compiler->units) { compiler->failed = 1; return; }
    size_t cursor = 0;
    while (cursor < pattern.length) {
        unsigned int value = maiaCCReadCodePoint(pattern, &cursor);
        if (value > 65535) { value -= 65536; compiler->units[compiler->length++] = 55296 + (value >> 10); value = 56320 + (value & 1023); }
        compiler->units[compiler->length++] = value;
    }
    MaiaCCRegexNode* tree = maiaCCRegexChoice(compiler);
    if (compiler->position != compiler->length) compiler->failed = 1;
    if (!compiler->failed) { unsigned int end = maiaCCRegexEmit(compiler, 0, 0, 0, 0); compiler->entry = maiaCCRegexCompileNode(compiler, tree, end); }
}
static void maiaCCRegexDestroy(MaiaCCRegexCompiler* compiler) { free(compiler->code); free(compiler->ranges); }
#endif
