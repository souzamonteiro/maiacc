/* Bootstrap frontend. rex-parser.cpp is generated from grammar/REx.ebnf into
 * the build directory; never edit or version that generated seed here. */
#include "rex-parser.cpp"
#include "parse-tree-collector.hpp"

static char* maiaCCRExToXml(const char* source, unsigned int length, int* status)
{
    *status = 1;
    if (length > UINT_MAX - 2 || (size_t)length + 2 > ((size_t)-1) / sizeof(MaiaCCParserToken)) return 0;
    MaiaCCParserToken* tokens = (MaiaCCParserToken*)malloc(((size_t)length + 2) * sizeof(MaiaCCParserToken));
    if (!tokens) return 0;
    MaiaCCLexerState lexer;
    maiaCCLexerStateInit(&lexer, source, length);
    if (!maiaCCLexerTokenize(&lexer, tokens, length + 2)) {
        *status = 2;
        free(tokens);
        return 0;
    }
    MaiaCCParseTreeCollector tree;
    MaiaCCParseEvents events;
    MaiaCCParserState parser;
    maiaCCParseTreeInit(&tree);
    maiaCCParseTreeEvents(&tree, &events);
    maiaCCParserStateInit(&parser, tokens, lexer.tokenCount, &events);
    int accepted = maiaCC_parse(&parser);
    char* xml = accepted ? maiaCCParseTreeToXml(&tree) : 0;
    *status = xml ? 0 : (tree.failed || accepted ? 1 : 3);
    maiaCCParseTreeDestroy(&tree);
    free(tokens);
    return xml;
}
