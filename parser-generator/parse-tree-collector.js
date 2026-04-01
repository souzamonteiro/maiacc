class ParseTreeCollector {
  constructor() {
    this.stack = [];
    this.root = null;
  }

  checkpoint() {
    return {
      stack: structuredClone(this.stack),
      root: structuredClone(this.root)
    };
  }

  restore(mark) {
    if (!mark) return;
    this.stack = mark.stack;
    this.root = mark.root;
  }

  startNonterminal(name) {
    this.stack.push({ kind: 'nonterminal', name, children: [] });
  }

  terminal(expectedType, tokenValue) {
    if (this.stack.length === 0) return;
    const parent = this.stack[this.stack.length - 1];
    parent.children.push({
      kind: 'terminal',
      token: expectedType,
      value: tokenValue
    });
  }

  endNonterminal() {
    const node = this.stack.pop();
    if (!node) return;

    if (this.stack.length === 0) {
      this.root = node;
    } else {
      this.stack[this.stack.length - 1].children.push(node);
    }
  }

  abortNonterminal() {
    this.stack.pop();
  }

  toJSON(space = 2) {
    return JSON.stringify(this.root, null, space);
  }

  toXml(options = {}) {
    if (!this.root) {
      throw new Error('No parse tree was collected from parser events');
    }

    const includeDeclaration = options.includeDeclaration !== false;
    const xmlBody = serializeNodeAsXml(this.root);
    return includeDeclaration
      ? `<?xml version="1.0" encoding="UTF-8"?>${xmlBody}`
      : xmlBody;
  }
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function terminalElementName(tokenType) {
  if (tokenType === 'EOF') return 'EOF';
  return tokenType.startsWith('TOKEN_') ? 'TOKEN' : tokenType;
}

function serializeNodeAsXml(node) {
  if (!node) return '';

  if (node.kind === 'terminal') {
    const elementName = terminalElementName(node.token);
    if (node.token === 'EOF') {
      return `<${elementName}/>`;
    }
    return `<${elementName}>${xmlEscape(node.value)}</${elementName}>`;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  if (children.length === 0) {
    return `<${node.name}/>`;
  }

  const inner = children.map((child) => serializeNodeAsXml(child)).join('');
  return `<${node.name}>${inner}</${node.name}>`;
}

function getNodeLabel(node) {
  if (!node) return '(null)';
  if (node.kind === 'terminal') {
    return `${node.token}: ${JSON.stringify(node.value)}`;
  }
  return node.name;
}

function printTree(node, prefix = '', isLast = true, isRoot = true) {
  if (!node) return;

  const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';
  console.log(prefix + branch + getNodeLabel(node));

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return;
  }

  const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    const childIsLast = index === node.children.length - 1;
    printTree(child, childPrefix, childIsLast, false);
  }
}

module.exports = {
  ParseTreeCollector,
  printTree,
  getNodeLabel
};
