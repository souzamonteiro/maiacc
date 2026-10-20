/* Native file transport. All XML/model/emission work executes in C++98. */
#include "generator.cpp"
#include <stdio.h>

int main(int argc, char** argv)
{
    int cpp = 0; const char* inputPath = 0; const char* outputPath = 0;
    for (int index = 1; index < argc; ++index) {
        const char* argument = argv[index]; const char* language = 0;
        if (strcmp(argument, "--language") == 0) { if (++index >= argc) return 1; language = argv[index]; }
        else if (strncmp(argument, "--language=", 11) == 0) language = argument + 11;
        else if (!inputPath) inputPath = argument;
        else if (!outputPath) outputPath = argument;
        else return 1;
        if (language) {
            if (strcmp(language, "cpp98") == 0) cpp = 1;
            else if (strcmp(language, "javascript") == 0) cpp = 0;
            else { fprintf(stderr, "Unsupported output language: %s\n", language); return 1; }
        }
    }
    if (!inputPath) { fprintf(stderr, "Usage: MaiaCC-cpp98 [--language javascript|cpp98] GRAMMAR.xml [OUTPUT]\n"); return 1; }
    if (!outputPath) outputPath = cpp ? "parser.cpp" : "parser.js";
    FILE* input = fopen(inputPath, "rb");
    if (!input) { fprintf(stderr, "Cannot read %s\n", inputPath); return 1; }
    MaiaCCBuffer buffer; maiaCCBufferInit(&buffer);
    char bytes[4096]; size_t count;
    while ((count = fread(bytes, 1, sizeof(bytes), input)) != 0) maiaCCAppend(&buffer, bytes, count);
    int failed = ferror(input); fclose(input);
    if (failed || buffer.failed || buffer.length > UINT_MAX) { free(buffer.data); return 1; }
    unsigned int length = 0; int status = 1;
    char* code = maiaCCGenerateXml(buffer.data, (unsigned int)buffer.length, cpp, &length, &status);
    free(buffer.data);
    if (!code) { fprintf(stderr, "MaiaCC C++98 generation failed (status %d): %s\n", status, inputPath); return 2; }
    FILE* output = fopen(outputPath, "wb");
    if (!output) { free(code); return 1; }
    failed = fwrite(code, 1, length, output) != length;
    if (fclose(output) != 0) failed = 1;
    free(code); return failed ? 1 : 0;
}
