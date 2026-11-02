'use strict';
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const test=require('node:test');
const GrammarParser=require('../../grammar-parser'),CodeGenerator=require('../../code-generator');
const root=path.resolve(__dirname,'../../..');
test('generated C++98 parser separates allocation failure from syntax and resets on reuse',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'maiacc-parser-resources-'));
 try{
  const grammar=path.join(directory,'input.ebnf'),xml=path.join(directory,'input.xml');
  fs.writeFileSync(grammar,'Input ::= ("a" "b" | "a") EOF\n<?TOKENS?>\nEOF ::= $\n');
  execFileSync('bash',[path.join(root,'bin/tREx.sh'),'--ebnf','--only-xml','--to-xml',xml,grammar],{cwd:root});
  const model=await new GrammarParser(fs.readFileSync(xml,'utf8')).parse();
  fs.writeFileSync(path.join(directory,'parser.hpp'),new CodeGenerator(model,{language:'cpp98'}).generate());
  fs.writeFileSync(path.join(directory,'driver.cpp'),fs.readFileSync(path.join(root,'parser-generator/tests/fixtures/cpp98-parser-resources.cpp'),'utf8'));
  execFileSync('clang',['-std=c89','-pedantic-errors','-c',path.join(root,'maiaregex/maia_regex.c'),'-o',path.join(directory,'ordered.o')]);
  execFileSync('clang++',['-std=c++98','-pedantic-errors','-O1','-DMAIACC_RESOURCE_NATIVE','-fsanitize=address,undefined','-I',path.join(root,'maiaregex'),path.join(directory,'driver.cpp'),path.join(directory,'ordered.o'),'-o',path.join(directory,'test')]);
  const output=execFileSync(path.join(directory,'test'),[],{encoding:'utf8'});assert.match(output,/generated resource API: 32 checks/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
