#include "xml-input.cpp"
#include "source-emitter.hpp"

/* Buffer API shared by native transport and the WebAssembly integration.
 * The caller owns the returned bytes and releases them with free(). */
static char* maiaCCGenerateXml(const char* input, unsigned int length, int cpp,
    unsigned int* outputLength, int* status)
{
    *status = 1; *outputLength = 0;
    MaiaCCArena arena; maiaCCArenaInit(&arena);
    MaiaCCNode* xml = maiaCCReadXml(&arena, input, length);
    MaiaCCGrammar* grammar = 0;
    if (!arena.failed) grammar = maiaCCBuildGrammar(&arena, xml);
    char* result = 0;
    if (!arena.failed && grammar) {
        MaiaCCGenerator generator; maiaCCGeneratorInit(&generator, &arena, grammar, cpp);
        if (!arena.failed && !generator.failed) {
            MaiaCCText code = maiaCCGenerate(&generator);
            if (!arena.failed && !generator.failed && code.length <= UINT_MAX && code.length < (size_t)-1) {
                result = (char*)malloc(code.length + 1);
                if (result) { memcpy(result, code.data, code.length); result[code.length] = 0; *outputLength = (unsigned int)code.length; *status = 0; }
            }
        }
    }
    maiaCCArenaDestroy(&arena);
    return result;
}
