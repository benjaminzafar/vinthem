const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const targetDirs = [path.join(__dirname, 'src')];

targetDirs.forEach(td => {
  if(!fs.existsSync(td)) return;
  const files = walk(td);
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/['"]@\/val['"]/g, "'@/lib/val'"); // ignore, just for structure
    content = content.replace(/['"]@\/firebase['"]/g, "'@/lib/firebase'");
    
    // Also change relative firebase imports that were missed
    content = content.replace(/from\s+['"]\.\.\/firebase['"]/g, "from '@/lib/firebase'");
    content = content.replace(/from\s+['"]\.\.\/\.\.\/firebase['"]/g, "from '@/lib/firebase'");

    if(content !== original) {
      fs.writeFileSync(file, content, 'utf8');
    }
  });
});
