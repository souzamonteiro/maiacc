// test.js
const Parser = require('./arithmetic-parser');
const { ParseTreeCollector, printTree } = require('../parse-tree-collector');

function assertNonterminal(node, name) {
  if (!node || node.kind !== 'nonterminal' || node.name !== name) {
    throw new Error(`Expected nonterminal '${name}'`);
  }
}

function assertTerminal(node) {
  if (!node || node.kind !== 'terminal') {
    throw new Error('Expected terminal node');
  }
}

function evaluateExpression(node) {
  assertNonterminal(node, 'Expression');
  const children = node.children || [];
  let value = evaluateTerm(children[0]);

  for (let i = 1; i < children.length; i += 2) {
    assertTerminal(children[i]);
    const operator = children[i].value;
    const rhs = evaluateTerm(children[i + 1]);
    if (operator === '+') value += rhs;
    else if (operator === '-') value -= rhs;
    else throw new Error(`Unexpected operator in Expression: ${operator}`);
  }

  return value;
}

function evaluateTerm(node) {
  assertNonterminal(node, 'Term');
  const children = node.children || [];
  let value = evaluatePower(children[0]);

  for (let i = 1; i < children.length; i += 2) {
    assertTerminal(children[i]);
    const operator = children[i].value;
    const rhs = evaluatePower(children[i + 1]);
    if (operator === '*') value *= rhs;
    else if (operator === '/') value /= rhs;
    else throw new Error(`Unexpected operator in Term: ${operator}`);
  }

  return value;
}

function evaluatePower(node) {
  assertNonterminal(node, 'Power');
  const children = node.children || [];
  const left = evaluateUnary(children[0]);

  if (children.length === 1) {
    return left;
  }

  assertTerminal(children[1]);
  const operator = children[1].value;
  if (operator !== '^') {
    throw new Error(`Unexpected operator in Power: ${operator}`);
  }
  const right = evaluatePower(children[2]);
  return left ** right;
}

function evaluateUnary(node) {
  assertNonterminal(node, 'Unary');
  const children = node.children || [];

  if (children.length === 2) {
    assertTerminal(children[0]);
    if (children[0].value !== '-') {
      throw new Error(`Unexpected unary operator: ${children[0].value}`);
    }
    return -evaluateUnary(children[1]);
  }

  return evaluatePrimary(children[0]);
}

function evaluatePrimary(node) {
  assertNonterminal(node, 'Primary');
  const children = node.children || [];

  if (children.length === 1) {
    assertTerminal(children[0]);
    return Number(children[0].value);
  }

  if (children.length === 3) {
    return evaluateExpression(children[1]);
  }

  throw new Error('Unexpected Primary shape');
}

function evaluateParseTree(root) {
  return evaluateExpression(root);
}

function runCase(expression, expected, epsilon = 1e-12) {
  const collector = new ParseTreeCollector();
  const parser = new Parser(expression, collector);
  collector.parse(parser, expression);

  const actual = evaluateParseTree(collector.root);
  const ok = Math.abs(actual - expected) <= epsilon;

  if (!ok) {
    throw new Error(`Case failed: ${expression} -> expected ${expected}, got ${actual}`);
  }

  return { expression, expected, actual, collector };
}

const cases = [
  { expression: '3 + 5 * 2', expected: 13 },
  { expression: '(3 + 5) * 2', expected: 16 },
  { expression: '10 - 4 - 3', expected: 3 },
  { expression: '20 / 5 / 2', expected: 2 },
  { expression: '2 ^ 3 ^ 2', expected: 512 },
  { expression: '-2 + 10', expected: 8 },
  { expression: '-(2 + 3) * 4', expected: -20 },
  { expression: '3.5 * 2 + 1.25', expected: 8.25 },
  { expression: '2 * (3 + 4) ^ 2 - 5 / (1 + 1)', expected: 95.5 }
];

try {
  console.log('Running calculator demo cases...');
  const results = cases.map((testCase) => runCase(testCase.expression, testCase.expected));

  for (const result of results) {
    console.log(`✅ ${result.expression} = ${result.actual}`);
  }

  const demo = results[results.length - 1];
  console.log('');
  console.log(`Demo expression: ${demo.expression}`);
  console.log('🌳 Parse tree:');
  printTree(demo.collector.root);
  console.log('🧩 Parse tree (JSON):');
  console.log(demo.collector.toJSON());
  console.log('🧾 Parse tree (XML):');
  console.log(demo.collector.toXml());

  const invalidExpression = '1 +\n* 2';
  const invalidCollector = new ParseTreeCollector();
  const invalidParser = new Parser(invalidExpression, invalidCollector);
  try {
    invalidCollector.parse(invalidParser, 'invalid-expression-demo');
  } catch (error) {
    console.log('📍 Error location demo:');
    console.log(error.message);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}