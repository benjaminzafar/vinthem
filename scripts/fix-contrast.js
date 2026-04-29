import fs from 'node:fs';
import path from 'node:path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      walkDir(filePath, callback);
      return;
    }

    callback(filePath);
  });
}

walkDir('c:/Users/sadeq/Desktop/Company Projact/mavren-shop/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
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
