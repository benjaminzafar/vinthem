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

  // Fix pattern: const navigate = useRouter() followed by router.push
  // The old code uses `navigate` as variable name but code calls `router.push` (from our conversion)
  // We need to make them consistent - change `router.push` to `navigate.push` where variable is navigate
  
  // Find if the file declares `const navigate = useRouter()`
  const hasNavigateVar = /const navigate\s*=\s*useRouter\(\)/.test(content);
  
  if (hasNavigateVar) {
    // Replace router.push/replace/back calls with navigate.push/replace/back
    content = content.replace(/\brouter\.push\(/g, 'navigate.push(');
    content = content.replace(/\brouter\.replace\(/g, 'navigate.replace(');
    content = content.replace(/\brouter\.back\(/g, 'navigate.back(');
  }

  // Also fix: const navigate = useNavigate() that we missed (if any remain)
  content = content.replace(/const navigate\s*=\s*useNavigate\(\)/g, 'const navigate = useRouter()');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed router/navigate mismatch: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
