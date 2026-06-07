const fs = require('fs');
const path = require('path');

const omsDir = path.join(__dirname, 'apps', 'oms-web');
const portalDir = path.join(omsDir, 'app', 'portal');
const newPortalDir = path.join(omsDir, 'app', '(portal)');

// 1. Copy portal to (portal)
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(portalDir)) {
  copyDir(portalDir, newPortalDir);
  console.log('Copied portal to (portal)');
}

// 2. Search and replace `/portal` in all `.ts` and `.tsx` files
function walkAndReplace(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    // Skip old portal dir, node_modules, .next
    if (entry.name === 'portal' && dir === path.join(omsDir, 'app')) continue;
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndReplace(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes("'/portal/")) {
        content = content.replace(/'\/portal\//g, "'/");
        changed = true;
      }
      if (content.includes('"/portal/')) {
        content = content.replace(/"\/portal\//g, '"/');
        changed = true;
      }
      if (content.includes('`/portal/')) {
        content = content.replace(/`\/portal\//g, '`/');
        changed = true;
      }
      if (content.includes("'/portal'")) {
        content = content.replace(/'\/portal'/g, "'/'");
        changed = true;
      }
      if (content.includes('"/portal"')) {
        content = content.replace(/"\/portal"/g, '"/"');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated links in', fullPath);
      }
    }
  }
}

walkAndReplace(omsDir);

// 3. Update root page.tsx
const rootPagePath = path.join(omsDir, 'app', 'page.tsx');
if (fs.existsSync(rootPagePath)) {
  fs.writeFileSync(rootPagePath, `import { redirect } from 'next/navigation';\n\nexport default function RootPage() {\n  redirect('/dashboard');\n}\n`, 'utf8');
  console.log('Updated root page.tsx');
}

// 4. Update api-client.ts to remove isPortal
const apiClientPath = path.join(omsDir, 'lib', 'api-client.ts');
if (fs.existsSync(apiClientPath)) {
  let content = fs.readFileSync(apiClientPath, 'utf8');
  
  // Replace isPortal logic in getToken
  content = content.replace(
    /const isPortal = typeof window !== 'undefined' && window\.location\.pathname\.startsWith\('\/portal'\);\n\s*const session = await getSession\(\);\n\s*console\.log\("api-client \[DEBUG\]: isPortal =", isPortal, .+\);/g,
    `const session = await getSession();\n  console.log("api-client [DEBUG]: session =", session, "accessToken =", (session as any)?.accessToken ? "PRESENT (length " + (session as any).accessToken.length + ")" : "MISSING");`
  );
  
  // Replace isPortal logic in handleApiError
  content = content.replace(
    /const isPortal = window\.location\.pathname\.startsWith\('\/portal'\);\n\s*signOut\({ \n\s*callbackUrl: isPortal \? '\/login' : '\/login'\n\s*}\);/g,
    `signOut({ callbackUrl: '/login' });`
  );

  fs.writeFileSync(apiClientPath, content, 'utf8');
  console.log('Updated api-client.ts');
}

// 5. Try to delete old portal folder
try {
  fs.rmSync(portalDir, { recursive: true, force: true });
  console.log('Deleted old portal directory');
} catch (e) {
  console.log('Could not delete old portal directory (likely locked by Next.js server). Please delete it manually or ignore it.');
}
