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
      if(file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const targetDirs = [path.join(__dirname, 'src/components'), path.join(__dirname, 'src/hooks'), path.join(__dirname, 'src/store')];

targetDirs.forEach(td => {
  if(!fs.existsSync(td)) return;
  const files = walk(td);
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace <Link to="..."> with <Link href="...">
    content = content.replace(/<Link([^>]*?)to=/g, '<Link$1href=');
    
    // Replace react-router imports
    if(content.includes('react-router')) {
      content = content.replace(/import\s+{(.*?)}\s+from\s+['"]react-router(-dom)?['"];?/g, (match, p1) => {
        let replacement = '';
        if(p1.includes('Link')) {
          replacement += "import Link from 'next/link';\n";
          p1 = p1.replace(/Link,?\s*/, '');
        }
        
        let navHooks = [];
        if(p1.includes('useNavigate')) {
          navHooks.push('useRouter');
          p1 = p1.replace(/useNavigate,?\s*/, '');
          // We also need to replace useNavigate() with useRouter()
          content = content.replace(/(const|let|var)\s+(\w+)\s*=\s*useNavigate\(\)/g, "const $2 = useRouter()");
        }
        if(p1.includes('useLocation')) {
          navHooks.push('usePathname');
          p1 = p1.replace(/useLocation,?\s*/, '');
          content = content.replace(/(const|let|var)\s+(\w+)\s*=\s*useLocation\(\)/g, "const $2 = usePathname()");
          // fix uses of location.pathname if the variable was named `location`
          // Note: naive replacement, will do const location = usePathname(); location.pathname -> location
        }
        if(p1.includes('useParams')) {
          navHooks.push('useParams');
          p1 = p1.replace(/useParams,?\s*/, '');
        }
        
        if(navHooks.length > 0) {
          replacement += `import { ${navHooks.join(', ')} } from 'next/navigation';\n`;
        }
        
        return replacement;
      });
      
      // Fix specific common useLocation() stuff (e.g. `location.pathname`)
      content = content.replace(/useLocation\(\)\.pathname/g, 'usePathname()');
      
      // We might have variables named `location` that are now strings (from usePathname), 
      // so `location.pathname` will be undefined.
      content = content.replace(/(\w+)\.pathname/g, (match, prefix) => {
        // Only if prefix is likely the location variable.
        if(prefix === 'location') return 'location';
        return match;
      });
    }

    if(content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Converted ${file}`);
    }
  });
});
