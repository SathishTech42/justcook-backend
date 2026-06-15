const fs = require('fs');

let jsContent = fs.readFileSync('js/pages-integration.js', 'utf8');

const cartEmptyRegex = /if\s*\(cart\.length === 0\)\s*\{[\s\S]*?return;\s*\}/;
jsContent = jsContent.replace(cartEmptyRegex, '// empty cart check removed');

const checkoutEmptyRegex = /if\s*\(safeCart\.length === 0\)\s*\{[\s\S]*?return;\s*\}/;
jsContent = jsContent.replace(checkoutEmptyRegex, '// empty checkout check removed');

fs.writeFileSync('js/pages-integration.js', jsContent);
console.log('Empty state checks removed.');
