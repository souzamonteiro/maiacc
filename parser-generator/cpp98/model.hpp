#ifndef MAIACC_CPP98_MODEL_HPP
#define MAIACC_CPP98_MODEL_HPP

#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* One arena owns a complete invocation. No borrowed strings survive parsing. */
struct MaiaCCAllocation { MaiaCCAllocation* next; };
struct MaiaCCArena { MaiaCCAllocation* first; int failed; };
struct MaiaCCText { const char* data; size_t length; };
struct MaiaCCBuffer { char* data; size_t length; size_t capacity; int failed; };

static void maiaCCArenaInit(MaiaCCArena* arena) { arena->first = 0; arena->failed = 0; }
static void* maiaCCAllocate(MaiaCCArena* arena, size_t size)
{
    if (arena->failed || size > ((size_t)-1) - sizeof(MaiaCCAllocation)) { arena->failed = 1; return 0; }
    MaiaCCAllocation* block = (MaiaCCAllocation*)calloc(1, sizeof(MaiaCCAllocation) + size);
    if (!block) { arena->failed = 1; return 0; }
    block->next = arena->first;
    arena->first = block;
    return block + 1;
}
static void maiaCCArenaDestroy(MaiaCCArena* arena)
{
    while (arena->first) {
        MaiaCCAllocation* block = arena->first;
        arena->first = block->next;
        free(block);
    }
    maiaCCArenaInit(arena);
}
static MaiaCCText maiaCCText(const char* data) { MaiaCCText text; text.data = data; text.length = strlen(data); return text; }
static int maiaCCTextEqual(MaiaCCText a, MaiaCCText b) { return a.length == b.length && (!a.length || memcmp(a.data, b.data, a.length) == 0); }
static int maiaCCTextIs(MaiaCCText a, const char* b) { return maiaCCTextEqual(a, maiaCCText(b)); }
static int maiaCCHexDigit(unsigned int ch)
{
    if (ch >= '0' && ch <= '9') return (int)(ch - '0');
    if (ch >= 'a' && ch <= 'f') return (int)(ch - 'a' + 10);
    if (ch >= 'A' && ch <= 'F') return (int)(ch - 'A' + 10);
    return -1;
}
static MaiaCCText maiaCCCopy(MaiaCCArena* arena, const char* data, size_t length)
{
    MaiaCCText text;
    text.data = ""; text.length = 0;
    if (length == (size_t)-1) { arena->failed = 1; return text; }
    char* owned = (char*)maiaCCAllocate(arena, length + 1);
    if (!owned) return text;
    memcpy(owned, data, length);
    owned[length] = 0;
    text.data = owned; text.length = length;
    return text;
}
static void maiaCCBufferInit(MaiaCCBuffer* buffer) { buffer->data = 0; buffer->length = 0; buffer->capacity = 0; buffer->failed = 0; }
static void maiaCCAppend(MaiaCCBuffer* buffer, const char* data, size_t length)
{
    if (buffer->failed) return;
    if (buffer->length == (size_t)-1 || length > (size_t)-1 - buffer->length - 1) { buffer->failed = 1; return; }
    size_t needed = buffer->length + length + 1;
    if (needed > buffer->capacity) {
        size_t capacity = buffer->capacity ? buffer->capacity : 128;
        while (capacity < needed) {
            if (capacity > ((size_t)-1) / 2) { capacity = needed; break; }
            capacity *= 2;
        }
        char* grown = (char*)realloc(buffer->data, capacity);
        if (!grown) { buffer->failed = 1; return; }
        buffer->data = grown; buffer->capacity = capacity;
    }
    memcpy(buffer->data + buffer->length, data, length);
    buffer->length += length;
    buffer->data[buffer->length] = 0;
}
static void maiaCCWrite(MaiaCCBuffer* buffer, const char* data) { maiaCCAppend(buffer, data, strlen(data)); }
static void maiaCCWriteText(MaiaCCBuffer* buffer, MaiaCCText text) { maiaCCAppend(buffer, text.data, text.length); }
static MaiaCCText maiaCCFinish(MaiaCCArena* arena, MaiaCCBuffer* buffer)
{
    MaiaCCText text = maiaCCCopy(arena, buffer->data ? buffer->data : "", buffer->length);
    if (buffer->failed) arena->failed = 1;
    free(buffer->data); maiaCCBufferInit(buffer);
    return text;
}
static void maiaCCWriteCodePoint(MaiaCCBuffer* buffer, unsigned int value)
{
    char bytes[4]; size_t count = 0;
    if (value < 128) { bytes[0] = (char)value; count = 1; }
    else if (value < 2048) { bytes[0] = (char)(192 | (value >> 6)); bytes[1] = (char)(128 | (value & 63)); count = 2; }
    else if (value < 65536) { bytes[0] = (char)(224 | (value >> 12)); bytes[1] = (char)(128 | ((value >> 6) & 63)); bytes[2] = (char)(128 | (value & 63)); count = 3; }
    else if (value <= 1114111) { bytes[0] = (char)(240 | (value >> 18)); bytes[1] = (char)(128 | ((value >> 12) & 63)); bytes[2] = (char)(128 | ((value >> 6) & 63)); bytes[3] = (char)(128 | (value & 63)); count = 4; }
    else { buffer->failed = 1; return; }
    maiaCCAppend(buffer, bytes, count);
}

struct MaiaCCNode {
    MaiaCCText name;
    MaiaCCText value;
    MaiaCCNode* first;
    MaiaCCNode* last;
    MaiaCCNode* next;
};
static MaiaCCNode* maiaCCNewNode(MaiaCCArena* arena, MaiaCCText name)
{
    MaiaCCNode* node = (MaiaCCNode*)maiaCCAllocate(arena, sizeof(MaiaCCNode));
    if (node) node->name = name;
    return node;
}
static void maiaCCAddChild(MaiaCCNode* node, MaiaCCNode* child)
{
    if (!node || !child) return;
    if (node->last) node->last->next = child;
    else node->first = child;
    node->last = child;
}
static MaiaCCNode* maiaCCChild(MaiaCCNode* node, const char* name)
{
    for (MaiaCCNode* child = node ? node->first : 0; child; child = child->next) if (maiaCCTextIs(child->name, name)) return child;
    return 0;
}
static MaiaCCText maiaCCChildText(MaiaCCNode* node, const char* name)
{
    MaiaCCNode* child = maiaCCChild(node, name);
    return child ? child->value : maiaCCText("");
}

enum MaiaCCItemKind { MAIACC_TERMINAL = 1, MAIACC_NONTERMINAL, MAIACC_GROUP, MAIACC_LITERAL, MAIACC_TOKEN_REF, MAIACC_CHARCLASS, MAIACC_ANY, MAIACC_DIFFERENCE };
struct MaiaCCSequence;
struct MaiaCCItem {
    int kind;
    int quantifier; /* 0 exactly one, 1 optional, 2 zero or more, 3 one or more */
    int negated;
    MaiaCCText value;
    MaiaCCText context;
    MaiaCCSequence* choices;
    MaiaCCItem* left;
    MaiaCCItem* right;
    MaiaCCItem* next;
};
struct MaiaCCSequence { MaiaCCItem* first; MaiaCCItem* last; MaiaCCSequence* next; };
struct MaiaCCProduction {
    MaiaCCText name;
    MaiaCCSequence* choices;
    int options; /* bit 0 definition, bit 1 explicit */
    int skip;
    MaiaCCProduction* next;
};
struct MaiaCCPreference { MaiaCCText lower; MaiaCCText higher; int lowerLiteral; int higherLiteral; MaiaCCPreference* next; };
struct MaiaCCGrammar {
    MaiaCCProduction* rules;
    MaiaCCProduction* tokens;
    MaiaCCPreference* preferences;
    MaiaCCText start;
};
static MaiaCCProduction* maiaCCFindProduction(MaiaCCProduction* list, MaiaCCText name)
{
    while (list) { if (maiaCCTextEqual(list->name, name)) return list; list = list->next; }
    return 0;
}

#endif
