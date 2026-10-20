#ifndef MAIACC_CPP98_PARSE_TREE_COLLECTOR_HPP
#define MAIACC_CPP98_PARSE_TREE_COLLECTOR_HPP

/* Include a MaiaCC-generated parser first. The journal is an ordered tree
 * traversal; checkpoints truncate speculative events without copying trees. */
#include <limits.h>
#include <string.h>

struct MaiaCCTreeEvent {
    int kind;
    const char* name;
    const char* value;
    unsigned int length;
    unsigned int position;
};

struct MaiaCCParseTreeCollector {
    MaiaCCTreeEvent* entries;
    unsigned int count;
    unsigned int capacity;
    int failed;
};

static void maiaCCParseTreeInit(MaiaCCParseTreeCollector* tree)
{
    tree->entries = 0;
    tree->count = 0;
    tree->capacity = 0;
    tree->failed = 0;
}

static void maiaCCParseTreeDestroy(MaiaCCParseTreeCollector* tree)
{
    free(tree->entries);
    maiaCCParseTreeInit(tree);
}

static void maiaCCParseTreeAppend(MaiaCCParseTreeCollector* tree, int kind,
    const char* name, const char* value, unsigned int length, unsigned int position)
{
    if (tree->failed) return;
    if (tree->count == tree->capacity) {
        unsigned int capacity = tree->capacity ? tree->capacity * 2 : 128;
        size_t allocationCount = capacity;
        if (capacity <= tree->capacity || allocationCount > ((size_t)-1) / sizeof(MaiaCCTreeEvent)) {
            tree->failed = 1;
            return;
        }
        MaiaCCTreeEvent* entries = (MaiaCCTreeEvent*)realloc(tree->entries, capacity * sizeof(MaiaCCTreeEvent));
        if (!entries) { tree->failed = 1; return; }
        tree->entries = entries;
        tree->capacity = capacity;
    }
    MaiaCCTreeEvent* entry = tree->entries + tree->count++;
    entry->kind = kind;
    entry->name = name;
    entry->value = value;
    entry->length = length;
    entry->position = position;
}

static unsigned int maiaCCTreeCheckpoint(void* context)
{
    return ((MaiaCCParseTreeCollector*)context)->count;
}

static void maiaCCTreeRestore(void* context, unsigned int mark)
{
    MaiaCCParseTreeCollector* tree = (MaiaCCParseTreeCollector*)context;
    if (mark > tree->count) { tree->failed = 1; return; }
    tree->count = mark;
    /* Allocation failure is sticky, even when a parser branch is rolled back. */
}

static void maiaCCTreeStart(void* context, const char* name, unsigned int position)
{
    maiaCCParseTreeAppend((MaiaCCParseTreeCollector*)context, 1, name, 0, 0, position);
}

static void maiaCCTreeTerminal(void* context, unsigned int type, const char* value,
    unsigned int length, unsigned int position)
{
    maiaCCParseTreeAppend((MaiaCCParseTreeCollector*)context, 2,
        maiaCCParserTokenName(type), value, length, position);
}

static void maiaCCTreeEnd(void* context, const char* name, unsigned int position)
{
    maiaCCParseTreeAppend((MaiaCCParseTreeCollector*)context, 3, name, 0, 0, position);
}

static void maiaCCTreeAbort(void*, const char*, unsigned int)
{
    /* Generated rules restore their pre-start checkpoint before aborting. */
}

static void maiaCCParseTreeEvents(MaiaCCParseTreeCollector* tree, MaiaCCParseEvents* events)
{
    events->context = tree;
    events->checkpoint = maiaCCTreeCheckpoint;
    events->restore = maiaCCTreeRestore;
    events->startNonterminal = maiaCCTreeStart;
    events->terminal = maiaCCTreeTerminal;
    events->endNonterminal = maiaCCTreeEnd;
    events->abortNonterminal = maiaCCTreeAbort;
    events->matchesContextual = 0;
}

struct MaiaCCXmlBuffer {
    char* data;
    size_t length;
    size_t capacity;
    int failed;
};

static void maiaCCXmlAppend(MaiaCCXmlBuffer* output, const char* text, size_t length)
{
    if (output->failed) return;
    if (output->length == (size_t)-1 || length > (size_t)-1 - output->length - 1) {
        output->failed = 1;
        return;
    }
    size_t needed = output->length + length + 1;
    if (needed > output->capacity) {
        size_t capacity = output->capacity ? output->capacity : 256;
        while (capacity < needed) {
            if (capacity > ((size_t)-1) / 2) { capacity = needed; break; }
            capacity *= 2;
        }
        char* data = (char*)realloc(output->data, capacity);
        if (!data) { output->failed = 1; return; }
        output->data = data;
        output->capacity = capacity;
    }
    memcpy(output->data + output->length, text, length);
    output->length += length;
    output->data[output->length] = 0;
}

static void maiaCCXmlText(MaiaCCXmlBuffer* output, const char* text)
{
    maiaCCXmlAppend(output, text, strlen(text));
}

static void maiaCCXmlEscape(MaiaCCXmlBuffer* output, const char* text, unsigned int length)
{
    for (unsigned int index = 0; index < length; ++index) {
        if (text[index] == '&') maiaCCXmlText(output, "&amp;");
        else if (text[index] == '<') maiaCCXmlText(output, "&lt;");
        else if (text[index] == '>') maiaCCXmlText(output, "&gt;");
        else maiaCCXmlAppend(output, text + index, 1);
    }
}

/* Caller owns the result and releases it with free(). Source token values must
 * remain alive through serialization. There is no parser or matching in a host. */
static char* maiaCCParseTreeToXml(const MaiaCCParseTreeCollector* tree)
{
    if (tree->failed || !tree->count) return 0;
    MaiaCCXmlBuffer output;
    output.data = 0;
    output.length = 0;
    output.capacity = 0;
    output.failed = 0;
    maiaCCXmlText(&output, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    for (unsigned int index = 0; index < tree->count; ++index) {
        const MaiaCCTreeEvent* entry = tree->entries + index;
        const char* name = entry->name;
        if (entry->kind == 2 && strncmp(name, "TOKEN_", 6) == 0) name = "TOKEN";
        if (entry->kind == 3) {
            maiaCCXmlText(&output, "</");
            maiaCCXmlText(&output, name);
            maiaCCXmlText(&output, ">");
        } else {
            maiaCCXmlText(&output, "<");
            maiaCCXmlText(&output, name);
            if ((entry->kind == 1 && index + 1 < tree->count && tree->entries[index + 1].kind == 3)
                || (entry->kind == 2 && strcmp(name, "EOF") == 0)) {
                maiaCCXmlText(&output, "/>");
                if (entry->kind == 1) ++index;
            } else {
                maiaCCXmlText(&output, ">");
                if (entry->kind == 2) {
                    maiaCCXmlEscape(&output, entry->value, entry->length);
                    maiaCCXmlText(&output, "</");
                    maiaCCXmlText(&output, name);
                    maiaCCXmlText(&output, ">");
                }
            }
        }
    }
    if (output.failed) { free(output.data); return 0; }
    return output.data;
}

#endif
