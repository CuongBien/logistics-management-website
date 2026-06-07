const fs = require('fs');
const path = require('path');

const omsDir = path.join(__dirname, 'apps', 'oms-web');
const partnersDir = path.join(omsDir, 'app', '(portal)', 'partners');
const contactsDir = path.join(omsDir, 'app', '(portal)', 'contacts');

// 1. Copy partners to contacts
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

if (fs.existsSync(partnersDir)) {
  copyDir(partnersDir, contactsDir);
  console.log('Copied partners to contacts');
}

// 2. Search and replace `/partners` in all `.ts` and `.tsx` files
function walkAndReplace(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    if (entry.name === 'partners' && dir === path.join(omsDir, 'app', '(portal)')) continue;
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndReplace(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace URL routes
      if (content.includes("'/partners/")) {
        content = content.replace(/'\/partners\//g, "'/contacts/");
        changed = true;
      }
      if (content.includes('"/partners/')) {
        content = content.replace(/"\/partners\//g, '"/contacts/');
        changed = true;
      }
      if (content.includes('`/partners/')) {
        content = content.replace(/`\/partners\//g, '`/contacts/');
        changed = true;
      }
      if (content.includes("'/partners'")) {
        content = content.replace(/'\/partners'/g, "'/contacts'");
        changed = true;
      }
      if (content.includes('"/partners"')) {
        content = content.replace(/"\/partners"/g, '"/contacts"');
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

// 3. Try to delete old partners folder
try {
  fs.rmSync(partnersDir, { recursive: true, force: true });
  console.log('Deleted old partners directory');
} catch (e) {
  console.log('Could not delete old partners directory (likely locked by Next.js server). Please delete it manually or ignore it.');
}
