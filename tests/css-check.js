const fs = require('node:fs');
const css = require('css-tree');
const source = fs.readFileSync('styles.css', 'utf8');
const errors = [];
const ast = css.parse(source, {
  positions: true,
  onParseError(error) { errors.push(error.formattedMessage); },
});
css.walk(ast, {
  visit: 'Declaration',
  enter(node) {
    if (node.property.startsWith('--')) return;
    const result = css.lexer.matchProperty(node.property, node.value);
    // CSS variables resolve at runtime; the parser still validates their syntax.
    if (result.error?.message.includes('Matching for a tree with var() is not supported')) return;
    if (result.error) errors.push(`Line ${node.loc.start.line}: ${result.error.message}`);
  },
});
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('CSS syntax and declaration values are valid.');
}
