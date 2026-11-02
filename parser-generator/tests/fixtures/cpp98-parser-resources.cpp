#include <stdlib.h>
#include <stdio.h>
static int deny=0;
static void* test_calloc(size_t count,size_t bytes){return deny?0:calloc(count,bytes);}
#define calloc test_calloc
#include "parser.hpp"
#undef calloc
struct Trace{unsigned int count;};
static unsigned int checkpoint(void* p){return ((Trace*)p)->count;}
static void restore(void* p,unsigned int n){((Trace*)p)->count=n;}
static void start(void* p,const char*,unsigned int){++((Trace*)p)->count;}
static void end(void*,const char*,unsigned int){}
static int checks=0;
#define VERIFY(x) do{++checks;if(!(x))return checks;}while(0)
extern "C" int maiaCCResourceProbe(){
 MaiaCCLexerState lexer;MaiaCCParserToken tokens[4];MaiaCCParserState parser;
 Trace trace;trace.count=0;MaiaCCParseEvents events={&trace,checkpoint,restore,start,0,end,end,0};
 maiaCCLexerStateInit(&lexer,"a",1);VERIFY(maiaCCLexerTokenize(&lexer,tokens,4));
 maiaCCParserStateInit(&parser,tokens,lexer.tokenCount,&events);
 VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NONE);deny=1;
 VERIFY(!maiaCC_parse(&parser));VERIFY(parser.failed==1);VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NOMEM);
 VERIFY(parser.errorCount==0);VERIFY(parser.failureMemo==0);VERIFY(trace.count==0);
 deny=0;VERIFY(maiaCC_parse(&parser));VERIFY(!parser.failed);VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NONE);VERIFY(!parser.failureMemo);VERIFY(trace.count==1);
 maiaCCLexerStateInit(&lexer,"b",1);VERIFY(maiaCCLexerTokenize(&lexer,tokens,4));
 maiaCCParserStateInit(&parser,tokens,lexer.tokenCount,&events);trace.count=0;
 VERIFY(!maiaCC_parse(&parser));VERIFY(parser.failed==1);VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NONE);VERIFY(parser.errorCount>0);VERIFY(trace.count==0);VERIFY(!parser.failureMemo);
 deny=1;VERIFY(!maiaCC_parse(&parser));VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NOMEM);VERIFY(parser.errorCount==0);
 maiaCCParserStateInit(&parser,tokens,0,&events);VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NONE);
 maiaCCParserStateInit(&parser,tokens,~0U,&events);deny=1;
 VERIFY(!maiaCC_parse(&parser));VERIFY(parser.failed==1);
 VERIFY(parser.resourceError==(sizeof(size_t)==4?MAIACC_PARSE_RESOURCE_LIMIT:MAIACC_PARSE_RESOURCE_NOMEM));
 VERIFY(!parser.failureMemo);VERIFY(parser.errorCount==0);
 deny=0;maiaCCLexerStateInit(&lexer,"a",1);VERIFY(maiaCCLexerTokenize(&lexer,tokens,4));
 maiaCCParserStateInit(&parser,tokens,lexer.tokenCount,&events);VERIFY(maiaCC_parse(&parser));VERIFY(parser.resourceError==MAIACC_PARSE_RESOURCE_NONE);
 return 0;
}

extern "C" int maiaCCResourceChecks(){return checks;}
#ifdef MAIACC_RESOURCE_NATIVE
int main(){const int result=maiaCCResourceProbe();printf("generated resource API: %d checks\n",checks);return result;}
#endif
