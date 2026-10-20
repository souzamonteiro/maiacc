/* Native file transport only. Parsing, matching and XML generation live in C++. */
#include "REx.cpp"
#include <stdio.h>

int main(int argc, char** argv)
{
    if (argc < 2) { fprintf(stderr, "Usage: REx-cpp98 INPUT...\n"); return 1; }
    for (int argument = 1; argument < argc; ++argument) {
        const char* name = argv[argument];
        if (strcmp(name, "-i") == 0) continue;
        char* owned = 0;
        const char* source = name;
        size_t length = strlen(name);
        if (length >= 2 && name[0] == '{' && name[length - 1] == '}') {
            ++source;
            length -= 2;
        } else {
            FILE* file = fopen(name, "rb");
            if (!file) { fprintf(stderr, "Cannot read %s\n", name); return 1; }
            size_t capacity = 4096;
            owned = (char*)malloc(capacity);
            length = 0;
            if (!owned) { fclose(file); return 1; }
            int byte;
            while ((byte = fgetc(file)) != EOF) {
                if (length == capacity) {
                    if (capacity > ((size_t)-1) / 2) { free(owned); fclose(file); return 1; }
                    capacity *= 2;
                    char* grown = (char*)realloc(owned, capacity);
                    if (!grown) { free(owned); fclose(file); return 1; }
                    owned = grown;
                }
                owned[length++] = (char)byte;
            }
            int failed = ferror(file);
            fclose(file);
            if (failed) { free(owned); return 1; }
            source = owned;
            if (length >= 3 && (unsigned char)source[0] == 239
                && (unsigned char)source[1] == 187 && (unsigned char)source[2] == 191) {
                source += 3;
                length -= 3;
            }
        }
        if (length > UINT_MAX) { free(owned); return 1; }
        int status;
        char* xml = maiaCCRExToXml(source, (unsigned int)length, &status);
        if (!xml) {
            fprintf(stderr, "REx C++98 failed for %s (status %d)\n", name, status);
            free(owned);
            return 2;
        }
        int failed = fputs(xml, stdout) == EOF;
        free(xml);
        free(owned);
        if (failed) return 1;
    }
    return 0;
}
