const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/sadeq/Desktop/Company Projact/mavren-shop/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(/text-slate-400/g, 'text-slate-500');
    content = content.replace(/text-gray-400/g, 'text-gray-500');
    content = content.replace(/text-zinc-400/g, 'text-zinc-500');
    
    // Also fix placeholders
    content = content.replace(/placeholder:text-slate-400/g, 'placeholder:text-slate-500');
    content = content.replace(/placeholder:text-gray-400/g, 'placeholder:text-gray-500');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
