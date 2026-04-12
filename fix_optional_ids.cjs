const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(full);
  }
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);

let totalFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix: doc(db, 'collection', maybeUndefined.id) -> doc(db, 'collection', maybeUndefined.id!)
  // Pattern: doc(db, 'anything', something.id) -> doc(db, 'anything', something.id!)
  content = content.replace(
    /doc\(db,\s*'([^']*)'\s*,\s*([^)]+?)\.id\)/g,
    (match, collection, varName) => {
      // Only add ! if not already there
      if (match.includes('.id!')) return match;
      return `doc(db, '${collection}', ${varName}.id!)`;
    }
  );

  // Also handle: doc(db, `template${variable.id}`) patterns
  // Fix generic optional chaining issues in common Id patterns
  content = content.replace(
    /doc\(db,\s*`([^`]*)\$\{([^}]+)\.id\}([^`]*)`\)/g,
    (match, pre, varName, post) => {
      return `doc(db, \`${pre}\${${varName}.id!}${post}\`)`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed optional id in: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
