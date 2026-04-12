const fs = require('fs');
const path = require('path');

const srcPagesDir = path.join(__dirname, '../mavren-ai-shop/src/pages');
const appDir = path.join(__dirname, 'src/app');
const storefrontDir = path.join(appDir, '(storefront)');

if (!fs.existsSync(storefrontDir)) {
  fs.mkdirSync(storefrontDir, { recursive: true });
}

// Ensure "use client" and routing hooks are fixed
function processPageCode(content) {
  let processed = content;
  if (!processed.includes('"use client"') && !processed.includes("'use client'")) {
    processed = '"use client";\n' + processed;
  }
  
  // Replace <Link to="..."> with <Link href="...">
  processed = processed.replace(/<Link([^>]*?)to=/g, '<Link$1href=');
  
  // Replace react-router imports
  if(processed.includes('react-router')) {
    processed = processed.replace(/import\s+{(.*?)}\s+from\s+['"]react-router(-dom)?['"];?/g, (match, p1) => {
      let replacement = '';
      if(p1.includes('Link')) {
        replacement += "import Link from 'next/link';\n";
        p1 = p1.replace(/Link,?\s*/, '');
      }
      
      let navHooks = [];
      if(p1.includes('useNavigate')) {
        navHooks.push('useRouter');
        processed = processed.replace(/(const|let|var)\s+(\w+)\s*=\s*useNavigate\(\)/g, "const $2 = useRouter()");
      }
      if(p1.includes('useLocation')) {
        navHooks.push('usePathname');
        processed = processed.replace(/(const|let|var)\s+(\w+)\s*=\s*useLocation\(\)/g, "const $2 = usePathname()");
      }
      if(p1.includes('useParams')) {
        navHooks.push('useParams');
      }
      
      if(navHooks.length > 0) {
        replacement += `import { ${navHooks.join(', ')} } from 'next/navigation';\n`;
      }
      
      return replacement;
    });

    processed = processed.replace(/useLocation\(\)\.pathname/g, 'usePathname()');
  }

  // Alias @/ fixes
  processed = processed.replace(/from\s+['"](\.\.\/[^'"]+)['"]/g, (match, p1) => {
    // Very rudimentary translation to @/
    // if something was ../components/Foo => @/components/Foo
    let fixed = p1.replace(/\.\.\//g, '');
    if (fixed.startsWith('components') || fixed.startsWith('store') || fixed.startsWith('lib') || fixed.startsWith('utils') || fixed.startsWith('hooks') || fixed.startsWith('i18n') || fixed.startsWith('firebase')) {
      return `from '@/${fixed}'`;
    }
    return match;
  });
  
  processed = processed.replace(/from\s+['"](\.\/[^'"]+)['"]/g, (match, p1) => {
    let fixed = p1.replace(/\.\//g, '');
    if (fixed === 'firebase' || fixed === 'i18n' || fixed.startsWith('components') || fixed.startsWith('store') || fixed.startsWith('lib') || fixed.startsWith('utils')) {
      return `from '@/${fixed}'`;
    }
    return match;
  });

  return processed;
}

const routeMap = {
  'Storefront.tsx': '(storefront)/page.tsx',
  'Products.tsx': '(storefront)/products/page.tsx',
  'ProductDetail.tsx': '(storefront)/product/[id]/page.tsx',
  'Cart.tsx': '(storefront)/cart/page.tsx',
  'Payment.tsx': '(storefront)/payment/page.tsx',
  'CustomerPanel.tsx': '(storefront)/profile/page.tsx',
  'BlogList.tsx': '(storefront)/blog/page.tsx',
  'BlogPostDetail.tsx': '(storefront)/blog/[id]/page.tsx',
  'About.tsx': '(storefront)/about/page.tsx',
  'StaticPageDetail.tsx': '(storefront)/p/[slug]/page.tsx',
  'Auth.tsx': '(storefront)/auth/page.tsx',
  'AdminDashboard.tsx': '(dashboard)/admin/page.tsx'
};

for (const [oldName, newRoute] of Object.entries(routeMap)) {
  const sourcePath = path.join(srcPagesDir, oldName);
  if (fs.existsSync(sourcePath)) {
    const rawContent = fs.readFileSync(sourcePath, 'utf8');
    const processedContent = processPageCode(rawContent);
    const destPath = path.join(appDir, newRoute);
    
    // Ensure parent dir exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    fs.writeFileSync(destPath, processedContent);
    console.log(`Migrated ${oldName} to ${newRoute}`);
  }
}
