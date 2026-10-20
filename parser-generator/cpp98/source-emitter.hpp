#ifndef MAIACC_CPP98_SOURCE_EMITTER_HPP
#define MAIACC_CPP98_SOURCE_EMITTER_HPP
#include "code-generator.hpp"

static MaiaCCText maiaCCEmitSequence(MaiaCCGenerator* generator, MaiaCCSequence* sequence);
static MaiaCCText maiaCCTokenName(MaiaCCGenerator* generator, MaiaCCText value)
{
    MaiaCCTokenDefinition* token = maiaCCFindToken(generator, value);
    return maiaCCIdentifier(generator, token ? token->name : maiaCCLiteralName(generator, value), 1, 0);
}
static MaiaCCText maiaCCBoundary(MaiaCCGenerator* generator, MaiaCCText name)
{
    if (!maiaCCTextIs(name, "SyntaxItem") && !maiaCCTextIs(name, "LexicalItem") && !maiaCCTextIs(name, "NameOrString")) return maiaCCText("");
    if (!generator->cpp) return maiaCCText(maiaCCTemplate(generator, "nonterminalBoundaryCheck"));
    const char* literals[5]; literals[0] = "::="; literals[1] = "<<"; literals[2] = ">>"; literals[3] = "\\\\"; literals[4] = "==";
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    maiaCCWrite(&output, "        const MaiaCCParserToken* __next = maiaCC_peek(self);\n        if (__next && (");
    for (unsigned int index = 0; index < 5; ++index) {
        if (index) maiaCCWrite(&output, " ||\n            ");
        maiaCCWrite(&output, "__next->type == "); maiaCCWriteText(&output, maiaCCTokenName(generator, maiaCCText(literals[index])));
    }
    maiaCCWrite(&output, ")) {\n          self->position = _iterationStart;\n          maiaCC_restoreEvents(self, _eventMark);\n          break;\n        }\n");
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCEmitItem(MaiaCCGenerator* generator, MaiaCCItem* item)
{
    const char* suffix = item->quantifier == 1 ? "Optional" : (item->quantifier == 2 ? "ZeroOrMore" : (item->quantifier == 3 ? "OneOrMore" : "Default"));
    MaiaCCBuffer key; maiaCCBufferInit(&key);
    if (item->kind == MAIACC_TERMINAL) {
        maiaCCWrite(&key, "terminal"); maiaCCWrite(&key, suffix);
        MaiaCCText templateName = maiaCCFinish(generator->arena, &key);
        return maiaCCFragment(generator, templateName.data, "{{token}}", maiaCCTokenName(generator, item->value));
    }
    if (item->kind == MAIACC_NONTERMINAL) {
        if (maiaCCFindProduction(generator->grammar->tokens, item->value)) {
            maiaCCWrite(&key, maiaCCLowerIs(item->context, "token") ? "contextualLexical" : "lexical"); maiaCCWrite(&key, suffix);
            MaiaCCText templateName = maiaCCFinish(generator->arena, &key);
            return maiaCCFragment(generator, templateName.data, "{{token}}", maiaCCIdentifier(generator, item->value, 1, 0));
        }
        maiaCCWrite(&key, "nonterminal"); maiaCCWrite(&key, suffix);
        MaiaCCText templateName = maiaCCFinish(generator->arena, &key);
        MaiaCCText result = maiaCCFragment(generator, templateName.data, "{{name}}", maiaCCIdentifier(generator, item->value, 0, 0));
        return maiaCCReplace(generator, result, "{{boundaryCheck}}", maiaCCBoundary(generator, item->value));
    }
    if (item->kind == MAIACC_GROUP) {
        MaiaCCBuffer attempt; maiaCCBufferInit(&attempt);
        if (item->choices && !item->choices->next) maiaCCWriteText(&attempt, maiaCCEmitSequence(generator, item->choices));
        else {
            maiaCCWrite(&attempt, maiaCCTemplate(generator, "groupAlternativesHeader"));
            for (MaiaCCSequence* sequence = item->choices; sequence; sequence = sequence->next) maiaCCWriteText(&attempt, maiaCCFragment(generator, "groupAlternativeTryBlock", "{{sequence}}", maiaCCEmitSequence(generator, sequence)));
            maiaCCWrite(&attempt, maiaCCTemplate(generator, "groupAlternativesFailure"));
        }
        maiaCCWrite(&key, "group"); maiaCCWrite(&key, suffix);
        MaiaCCText templateName = maiaCCFinish(generator->arena, &key);
        return maiaCCFragment(generator, templateName.data, "{{attempt}}", maiaCCFinish(generator->arena, &attempt));
    }
    free(key.data); return maiaCCText("");
}
static MaiaCCText maiaCCEmitSequence(MaiaCCGenerator* generator, MaiaCCSequence* sequence)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    for (MaiaCCItem* item = sequence ? sequence->first : 0; item; item = item->next) maiaCCWriteText(&output, maiaCCEmitItem(generator, item));
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCEmitRuleBody(MaiaCCGenerator* generator, MaiaCCProduction* rule)
{
    if (!rule->choices) return maiaCCText(maiaCCTemplate(generator, "emptyRule"));
    if (!rule->choices->next) return maiaCCEmitSequence(generator, rule->choices);
    MaiaCCBuffer output; maiaCCBufferInit(&output); maiaCCWrite(&output, maiaCCTemplate(generator, "alternativesHeader"));
    unsigned int count = 0;
    for (unsigned int empty = 0; empty < 2; ++empty) for (MaiaCCSequence* sequence = rule->choices; sequence; sequence = sequence->next) if ((sequence->first ? 0U : 1U) == empty) {
        maiaCCWriteText(&output, maiaCCFragment(generator, "alternativeTryBlock", "{{sequence}}", maiaCCEmitSequence(generator, sequence))); ++count;
    }
    maiaCCWriteText(&output, maiaCCFragment(generator, "alternativesFailure", "{{count}}", maiaCCNumberText(generator->arena, count)));
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCEmitParser(MaiaCCGenerator* generator)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    maiaCCWrite(&output, maiaCCTemplate(generator, "parserHeader"));
    maiaCCWriteText(&output, maiaCCFragment(generator, "startRule", "{{startRule}}", maiaCCIdentifier(generator, generator->grammar->start, 0, 0)));
    unsigned int index = 0;
    for (MaiaCCProduction* rule = generator->grammar->rules; rule; rule = rule->next) {
        MaiaCCText code = maiaCCFragment(generator, "ruleFunction", "{{ruleName}}", maiaCCIdentifier(generator, rule->name, 0, 0));
        code = maiaCCReplace(generator, code, "{{ruleLabel}}", maiaCCQuote(generator, rule->name));
        code = maiaCCReplace(generator, code, "{{ruleId}}", maiaCCNumberText(generator->arena, index++));
        code = maiaCCReplace(generator, code, "{{ruleBody}}", maiaCCEmitRuleBody(generator, rule));
        maiaCCWriteText(&output, code);
    }
    maiaCCWrite(&output, maiaCCTemplate(generator, "parserFooter"));
    return maiaCCFinish(generator->arena, &output);
}
static int maiaCCLexerRole(MaiaCCText name)
{
    if (maiaCCTextIs(name, "TemplateMiddle")) return 1;
    if (maiaCCTextIs(name, "TemplateTail")) return 2;
    if (maiaCCTextIs(name, "TemplateHead")) return 3;
    if (maiaCCTextIs(name, "TOKEN__7B_")) return 4;
    if (maiaCCTextIs(name, "TOKEN__7D_")) return 5;
    if (maiaCCTextIs(name, "TOKEN__5B_") || maiaCCTextIs(name, "TOKEN__5B__5E_")) return 6;
    if (maiaCCTextIs(name, "TOKEN__5D_")) return 7;
    return 0;
}
static void maiaCCIndexedName(MaiaCCBuffer* output, const char* prefix, unsigned int index) { maiaCCWrite(output, prefix); maiaCCNumber(output, index); }
static MaiaCCText maiaCCEmitScanner(MaiaCCGenerator* generator)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output); maiaCCWrite(&output, maiaCCScannerTypes);
    MaiaCCBuffer records; maiaCCBufferInit(&records);
    unsigned int index = 0; unsigned int primaryCount = 0;
    for (unsigned int contextual = 0; contextual < 2; ++contextual) for (MaiaCCLexerPattern* pattern = generator->patterns; pattern; pattern = pattern->next) {
        if (contextual && pattern->skip) continue;
        MaiaCCArena scratch; maiaCCArenaInit(&scratch);
        MaiaCCRegexCompiler compiler; maiaCCRegexInit(&compiler, &scratch, pattern->pattern);
        if (compiler.failed || scratch.failed) { generator->failed = 1; maiaCCRegexDestroy(&compiler); maiaCCArenaDestroy(&scratch); continue; }
        maiaCCIndexedName(&output, "static const MaiaCCLexInstruction maiaCCLexCode", index); maiaCCWrite(&output, "[] = {\n");
        for (unsigned int row = 0; row < compiler.count; ++row) {
            if (row) maiaCCWrite(&output, ",\n");
            maiaCCWrite(&output, "  { "); maiaCCNumber(&output, (unsigned int)compiler.code[row].op); maiaCCWrite(&output, ", "); maiaCCNumber(&output, compiler.code[row].first); maiaCCWrite(&output, ", "); maiaCCNumber(&output, compiler.code[row].second); maiaCCWrite(&output, ", "); maiaCCNumber(&output, compiler.code[row].next); maiaCCWrite(&output, " }");
        }
        maiaCCWrite(&output, "\n};\n");
        maiaCCIndexedName(&output, "static const MaiaCCLexRange maiaCCLexRanges", index); maiaCCWrite(&output, "[] = {\n");
        if (!compiler.rangeCount) maiaCCWrite(&output, "  { 0, 0 }");
        for (unsigned int row = 0; row < compiler.rangeCount; ++row) {
            if (row) maiaCCWrite(&output, ",\n");
            maiaCCWrite(&output, "  { "); maiaCCNumber(&output, compiler.ranges[row].first); maiaCCWrite(&output, ", "); maiaCCNumber(&output, compiler.ranges[row].last); maiaCCWrite(&output, " }");
        }
        maiaCCWrite(&output, "\n};\n");
        MaiaCCText name = pattern->skip ? maiaCCText("skip") : pattern->token->name;
        int generic = maiaCCTextIs(name, "Name") || maiaCCTextIs(name, "NameChar") || maiaCCTextIs(name, "NameStartChar");
        int preferred = maiaCCTextIs(name, "CharCodeRange") || maiaCCTextIs(name, "CharRange") || maiaCCTextIs(name, "CharCode") || maiaCCTextIs(name, "Char") || maiaCCTextIs(name, "TOKEN__5D_");
        if (index) maiaCCWrite(&records, ",\n");
        maiaCCIndexedName(&records, "  { maiaCCLexCode", index); maiaCCIndexedName(&records, ", maiaCCLexRanges", index);
        maiaCCWrite(&records, ", "); maiaCCNumber(&records, compiler.count); maiaCCWrite(&records, ", "); maiaCCNumber(&records, compiler.entry); maiaCCWrite(&records, ", "); maiaCCWriteText(&records, maiaCCIdentifier(generator, pattern->token->name, 1, 0));
        maiaCCWrite(&records, ", "); maiaCCNumber(&records, pattern->skip ? 1 : 0); maiaCCWrite(&records, ", "); maiaCCNumber(&records, generic ? 1 : 0); maiaCCWrite(&records, ", "); maiaCCNumber(&records, preferred ? 1 : 0); maiaCCWrite(&records, ", "); maiaCCNumber(&records, (unsigned int)maiaCCLexerRole(name)); maiaCCWrite(&records, ", "); maiaCCNumber(&records, compiler.rangeCount); maiaCCWrite(&records, " }");
        ++index; if (!contextual) ++primaryCount;
        maiaCCRegexDestroy(&compiler); maiaCCArenaDestroy(&scratch);
    }
    maiaCCWrite(&output, "static const MaiaCCLexPattern maiaCCLexPatterns[] = {\n");
    if (index) maiaCCAppend(&output, records.data, records.length); else maiaCCWrite(&output, "  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }");
    free(records.data);
    maiaCCWrite(&output, "\n};\nstatic const unsigned int maiaCCLexPatternCount = "); maiaCCNumber(&output, primaryCount);
    maiaCCWrite(&output, ";\nstatic const unsigned int maiaCCLexContextCount = "); maiaCCNumber(&output, index); maiaCCWrite(&output, ";\n");
    MaiaCCTokenDefinition* eof = maiaCCFindToken(generator, maiaCCText("EOF"));
    maiaCCWriteText(&output, maiaCCReplace(generator, maiaCCText(maiaCCScannerRuntime), "MAIACC_LEX_EOF", maiaCCIdentifier(generator, eof ? eof->name : maiaCCText("EOF"), 1, 0)));
    return maiaCCFinish(generator->arena, &output);
}
static MaiaCCText maiaCCEmitLexer(MaiaCCGenerator* generator)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output); maiaCCWrite(&output, maiaCCTemplate(generator, "lexerHeader"));
    if (!generator->cpp) {
        for (MaiaCCLexerPattern* pattern = generator->patterns; pattern; pattern = pattern->next) {
            MaiaCCText code = maiaCCFragment(generator, pattern->skip ? "skipToken" : "token", "{{name}}", pattern->token->name);
            maiaCCWriteText(&output, maiaCCReplace(generator, code, "{{pattern}}", pattern->pattern));
        }
        maiaCCWrite(&output, maiaCCTemplate(generator, "lexerFooter"));
        return maiaCCFinish(generator->arena, &output);
    }
    MaiaCCTokenDefinition extra; memset(&extra, 0, sizeof(extra)); extra.name = maiaCCText("EOF"); extra.id = generator->tokenCount + 1;
    unsigned int tokenCount = generator->tokenCount + (maiaCCFindToken(generator, extra.name) ? 0 : 1);
    MaiaCCBuffer cases; maiaCCBufferInit(&cases); unsigned int emitted = 0;
    for (MaiaCCTokenDefinition* token = generator->tokens ? generator->tokens : &extra; token; token = token->next ? token->next : (token != &extra && tokenCount > generator->tokenCount ? &extra : 0)) {
        MaiaCCText name = maiaCCIdentifier(generator, token->name, 1, 0);
        MaiaCCText code = maiaCCFragment(generator, "token", "{{tokenName}}", name);
        maiaCCWriteText(&output, maiaCCReplace(generator, code, "{{id}}", maiaCCNumberText(generator->arena, token->id)));
        if (emitted++) maiaCCWrite(&cases, "\n");
        maiaCCWrite(&cases, "    case "); maiaCCWriteText(&cases, name); maiaCCWrite(&cases, ": return "); maiaCCWriteText(&cases, maiaCCQuote(generator, token->name)); maiaCCWrite(&cases, ";");
    }
    MaiaCCBuffer prototypes; maiaCCBufferInit(&prototypes); unsigned int ruleCount = 0;
    for (MaiaCCProduction* rule = generator->grammar->rules; rule; rule = rule->next) {
        if (ruleCount++) maiaCCWrite(&prototypes, "\n");
        maiaCCWrite(&prototypes, "static int "); maiaCCWriteText(&prototypes, maiaCCIdentifier(generator, rule->name, 0, 0)); maiaCCWrite(&prototypes, "(MaiaCCParserState* self);");
    }
    MaiaCCText footer = maiaCCFragment(generator, "lexerFooter", "{{tokenCount}}", maiaCCNumberText(generator->arena, tokenCount + 1));
    footer = maiaCCReplace(generator, footer, "{{ruleCount}}", maiaCCNumberText(generator->arena, ruleCount));
    footer = maiaCCReplace(generator, footer, "{{tokenCases}}", maiaCCFinish(generator->arena, &cases));
    footer = maiaCCReplace(generator, footer, "{{rulePrototypes}}", maiaCCFinish(generator->arena, &prototypes));
    maiaCCWriteText(&output, footer);
    return maiaCCReplace(generator, maiaCCFinish(generator->arena, &output), "/* MAIACC_SCANNER */", maiaCCEmitScanner(generator));
}
static MaiaCCText maiaCCGenerate(MaiaCCGenerator* generator)
{
    MaiaCCBuffer output; maiaCCBufferInit(&output);
    maiaCCWriteText(&output, maiaCCEmitLexer(generator)); maiaCCWrite(&output, "\n\n"); maiaCCWriteText(&output, maiaCCEmitParser(generator));
    return maiaCCFinish(generator->arena, &output);
}
#endif
