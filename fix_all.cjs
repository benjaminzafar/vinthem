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

  // 1. Ensure "use client" at the top (for components/pages that use hooks)
  const needsClientDirective = (
    content.includes('useState') ||
    content.includes('useEffect') ||
    content.includes('useRef') ||
    content.includes('useCallback') ||
    content.includes('useMemo') ||
    content.includes('useRouter') ||
    content.includes('usePathname') ||
    content.includes('useParams') ||
    content.includes('useAuthStore') ||
    content.includes('useCartStore') ||
    content.includes('useSettingsStore') ||
    content.includes('useAppStore') ||
    content.includes('onClick') ||
    content.includes('onChange') ||
    content.includes('motion.') ||
    content.includes('AnimatePresence') ||
    content.includes('toast')
  );
  
  const isLayout = file.includes('layout.tsx') && !file.includes('components');
  const isRootLayout = file.endsWith('app\\layout.tsx') || file.endsWith('app/layout.tsx');
  
  if (needsClientDirective && !isRootLayout && !content.startsWith('"use client"') && !content.startsWith("'use client'")) {
    content = '"use client";\n' + content;
  }

  // 2. Fix react-router imports -> next/navigation
  // Handle Navigate component (redirect)
  content = content.replace(
    /import\s+\{([^}]*)\}\s+from\s+['"]react-router(-dom)?['"];?/g,
    (match, imports) => {
      const parts = imports.split(',').map(s => s.trim()).filter(Boolean);
      const nextNavHooks = [];
      const removed = [];
      
      let hasLink = false;
      
      const filtered = parts.filter(p => {
        const name = p.trim();
        if (name === 'Link') { hasLink = true; return false; }
        if (name === 'BrowserRouter' || name === 'Routes' || name === 'Route') { removed.push(name); return false; }
        if (name === 'Navigate') { removed.push(name); return false; }
        if (name === 'useNavigate') { nextNavHooks.push('useRouter'); return false; }
        if (name === 'useLocation') { nextNavHooks.push('usePathname'); return false; }
        if (name === 'useParams') { nextNavHooks.push('useParams'); return false; }
        if (name === 'useSearchParams') { nextNavHooks.push('useSearchParams'); return false; }
        return true;
      });

      let replacement = '';
      if (hasLink) replacement += "import Link from 'next/link';\n";
      if (nextNavHooks.length > 0) {
        replacement += `import { ${[...new Set(nextNavHooks)].join(', ')} } from 'next/navigation';\n`;
      }
      if (filtered.length > 0) {
        // leftover imports that don't map - just drop them
      }
      return replacement;
    }
  );

  // 3. Fix useNavigate() usage -> useRouter()
  content = content.replace(/const (\w+)\s*=\s*useNavigate\(\)/g, 'const $1 = useRouter()');
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  // navigate('/path') -> router.push('/path')
  content = content.replace(/\bnavigate\s*\(/g, 'router.push(');

  // 4. Fix useLocation() -> usePathname()
  content = content.replace(/const (\w+)\s*=\s*useLocation\(\)/g, 'const $1 = usePathname()');
  content = content.replace(/useLocation\(\)/g, 'usePathname()');
  // Fix .pathname access on what was a location object
  content = content.replace(/\blocation\.pathname\b/g, 'pathname');
  content = content.replace(/\b(\w+)\.pathname\b/g, (m, v) => v === 'window' ? m : 'pathname');

  // 5. Fix <Navigate to="..." /> -> use redirect or just drop (replace with null for now)
  content = content.replace(/<Navigate\s+to=['"]([^'"]*)['"]\s*\/>/g, 
    (match, to) => `<>{typeof window !== 'undefined' && (window.location.href = '${to}')}</>` 
  );

  // 6. Fix <Link to="..." -> <Link href="..."
  content = content.replace(/<Link\s+([^>]*?)to=/g, '<Link $1href=');
  // Fix double spaces
  content = content.replace(/<Link  href=/g, '<Link href=');

  // 7. Fix firebase import paths
  content = content.replace(/from\s+['"]\.\.\/firebase['"]/g, "from '@/lib/firebase'");
  content = content.replace(/from\s+['"]\.\.\/\.\.\/firebase['"]/g, "from '@/lib/firebase'");
  content = content.replace(/from\s+['"]\.\/firebase['"]/g, "from '@/lib/firebase'");
  content = content.replace(/from\s+['"]@\/firebase['"]/g, "from '@/lib/firebase'");

  // 8. Fix relative store imports -> @/store/...
  content = content.replace(/from\s+'\.\.\/store\/([\w]+)'/g, "from '@/store/$1'");
  content = content.replace(/from\s+"\.\.\/store\/([\w]+)"/g, "from '@/store/$1'");
  content = content.replace(/from\s+'\.\.\/\.\.\/store\/([\w]+)'/g, "from '@/store/$1'");
  content = content.replace(/from\s+"\.\.\/\.\.\/store\/([\w]+)"/g, "from '@/store/$1'");

  // 9. Fix relative component imports -> @/components/...
  content = content.replace(/from\s+'\.\.\/components\/([\w/]+)'/g, "from '@/components/$1'");
  content = content.replace(/from\s+"\.\.\/components\/([\w/]+)"/g, "from '@/components/$1'");
  content = content.replace(/from\s+'\.\.\/\.\.\/components\/([\w/]+)'/g, "from '@/components/$1'");
  content = content.replace(/from\s+"\.\.\/\.\.\/components\/([\w/]+)"/g, "from '@/components/$1'");

  // 10. Fix relative lib imports -> @/lib/...
  content = content.replace(/from\s+'\.\.\/lib\/([\w]+)'/g, "from '@/lib/$1'");
  content = content.replace(/from\s+"\.\.\/lib\/([\w]+)"/g, "from '@/lib/$1'");
  content = content.replace(/from\s+'\.\.\/\.\.\/lib\/([\w]+)'/g, "from '@/lib/$1'");
  content = content.replace(/from\s+"\.\.\/\.\.\/lib\/([\w]+)"/g, "from '@/lib/$1'");
  
  // Dynamic imports too
  content = content.replace(/import\('\.\.\/lib\/([\w]+)'\)/g, "import('@/lib/$1')");
  content = content.replace(/import\("\.\.\/lib\/([\w]+)"\)/g, "import('@/lib/$1')");

  // 11. Fix relative hooks imports -> @/hooks/...
  content = content.replace(/from\s+'\.\.\/hooks\/([\w]+)'/g, "from '@/hooks/$1'");
  content = content.replace(/from\s+"\.\.\/hooks\/([\w]+)"/g, "from '@/hooks/$1'");

  // 12. Fix relative utils imports -> @/utils/...
  content = content.replace(/from\s+'\.\.\/utils\/([\w]+)'/g, "from '@/utils/$1'");
  content = content.replace(/from\s+"\.\.\/utils\/([\w]+)"/g, "from '@/utils/$1'");

  // 13. Fix i18n import
  content = content.replace(/from\s+['"]\.\.\/i18n['"]/g, "from '@/i18n'");
  content = content.replace(/from\s+['"]\.\/i18n['"]/g, "from '@/i18n'");

  // 14. Fix types import
  content = content.replace(/from\s+['"]\.\.\/types['"]/g, "from '@/types'");
  content = content.replace(/from\s+['"]\.\/types['"]/g, "from '@/types'");

  // 15. Remove Sentry import (optional dep, causes issues)
  // Keep it but ensure it doesn't break things
  
  // 16. Fix @sentry/react import - wrap in try
  // Keep as is

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
