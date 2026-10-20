/* XML syntax is generated from xml.ebnf. This adapter constructs the element
 * tree and applies XML entity/name semantics; it does not recognize markup. */
#include "xml-parser.cpp"
#include "parse-tree-collector.hpp"
#include "model.hpp"

static MaiaCCNode* maiaCCJournalNode(MaiaCCArena* arena, const MaiaCCParseTreeCollector* tree, unsigned int* index)
{
    if (*index >= tree->count) { arena->failed = 1; return 0; }
    const MaiaCCTreeEvent* event = tree->entries + (*index)++;
    MaiaCCNode* node = maiaCCNewNode(arena, maiaCCText(event->name));
    if (!node) return 0;
    if (event->kind == 2) node->value = maiaCCCopy(arena, event->value, event->length);
    else if (event->kind == 1) {
        while (*index < tree->count && tree->entries[*index].kind != 3 && !arena->failed) maiaCCAddChild(node, maiaCCJournalNode(arena, tree, index));
        if (*index >= tree->count) arena->failed = 1;
        else ++*index;
    } else arena->failed = 1;
    return node;
}

static void maiaCCNodeText(MaiaCCBuffer* buffer, MaiaCCNode* node)
{
    if (!node) return;
    if (!node->first) maiaCCWriteText(buffer, node->value);
    for (MaiaCCNode* child = node->first; child; child = child->next) maiaCCNodeText(buffer, child);
}

static MaiaCCText maiaCCDecodeXml(MaiaCCArena* arena, MaiaCCText text)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    for (size_t index = 0; index < text.length; ++index) {
        if (text.data[index] != '&') { maiaCCAppend(&output, text.data + index, 1); continue; }
        size_t end = index + 1;
        while (end < text.length && text.data[end] != ';') ++end;
        if (end == text.length) { arena->failed = 1; break; }
        MaiaCCText entity; entity.data = text.data + index + 1; entity.length = end - index - 1;
        if (maiaCCTextIs(entity, "amp")) maiaCCWrite(&output, "&");
        else if (maiaCCTextIs(entity, "lt")) maiaCCWrite(&output, "<");
        else if (maiaCCTextIs(entity, "gt")) maiaCCWrite(&output, ">");
        else if (maiaCCTextIs(entity, "quot")) maiaCCWrite(&output, "\"");
        else if (maiaCCTextIs(entity, "apos")) maiaCCWrite(&output, "'");
        else if (entity.length > 1 && entity.data[0] == '#') {
            unsigned int base = 10; size_t cursor = 1; unsigned int value = 0;
            if (entity.data[cursor] == 'x') { base = 16; ++cursor; }
            if (cursor == entity.length) arena->failed = 1;
            for (; cursor < entity.length; ++cursor) {
                int digit = maiaCCHexDigit((unsigned char)entity.data[cursor]);
                if (digit < 0 || (unsigned int)digit >= base || value > (1114111U - (unsigned int)digit) / base) { arena->failed = 1; break; }
                value = value * base + (unsigned int)digit;
            }
            if (value == 0 || (value >= 55296 && value <= 57343)) arena->failed = 1;
            if (!arena->failed) maiaCCWriteCodePoint(&output, value);
        } else arena->failed = 1;
        index = end;
    }
    return maiaCCFinish(arena, &output);
}

static MaiaCCNode* maiaCCXmlElement(MaiaCCArena* arena, MaiaCCNode* syntax)
{
    MaiaCCNode* open = maiaCCChild(syntax, "OpenTag");
    MaiaCCNode* empty = maiaCCChild(syntax, "EmptyTag");
    MaiaCCText name = maiaCCChildText(open ? open : empty, "XmlName");
    if (!name.length) { arena->failed = 1; return 0; }
    MaiaCCNode* element = maiaCCNewNode(arena, name);
    if (!element || empty) return element;
    MaiaCCNode* close = maiaCCChild(syntax, "CloseTag");
    if (!maiaCCTextEqual(name, maiaCCChildText(close, "XmlName"))) { arena->failed = 1; return element; }
    MaiaCCNode* content = maiaCCChild(syntax, "Content");
    MaiaCCBuffer value; maiaCCBufferInit(&value);
    for (MaiaCCNode* child = content ? content->first : 0; child && !arena->failed; child = child->next) {
        if (maiaCCTextIs(child->name, "Element")) maiaCCAddChild(element, maiaCCXmlElement(arena, child));
        else maiaCCNodeText(&value, child);
    }
    element->value = maiaCCDecodeXml(arena, maiaCCFinish(arena, &value));
    return element;
}

static MaiaCCNode* maiaCCReadXml(MaiaCCArena* arena, const char* input, unsigned int length)
{
    if (length > UINT_MAX - 2 || (size_t)length + 2 > ((size_t)-1) / sizeof(MaiaCCParserToken)) { arena->failed = 1; return 0; }
    MaiaCCParserToken* tokens = (MaiaCCParserToken*)malloc(((size_t)length + 2) * sizeof(MaiaCCParserToken));
    if (!tokens) { arena->failed = 1; return 0; }
    MaiaCCLexerState lexer; maiaCCLexerStateInit(&lexer, input, length);
    MaiaCCParseTreeCollector tree; maiaCCParseTreeInit(&tree);
    MaiaCCNode* root = 0;
    if (maiaCCLexerTokenize(&lexer, tokens, length + 2)) {
        MaiaCCParseEvents events; maiaCCParseTreeEvents(&tree, &events);
        MaiaCCParserState parser; maiaCCParserStateInit(&parser, tokens, lexer.tokenCount, &events);
        if (maiaCC_parse(&parser) && !tree.failed) {
            unsigned int cursor = 0;
            MaiaCCNode* syntax = maiaCCJournalNode(arena, &tree, &cursor);
            if (!arena->failed) root = maiaCCXmlElement(arena, maiaCCChild(syntax, "Element"));
        }
    }
    if (!root || tree.failed) arena->failed = 1;
    maiaCCParseTreeDestroy(&tree); free(tokens);
    return root;
}
