const fs = require('fs');
const path = require('path');
const pagesDir = 'd:/ipl/IPL/regular-meridian/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

const gtagSnippet = `
    <!-- Google tag (gtag.js) -->
    <script is:inline async src="https://www.googletagmanager.com/gtag/js?id=G-DC032Y6PFZ"></script>
    <script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-DC032Y6PFZ');
    </script>`;

const searchRegex = /\s*<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config',\s*'G-DC032Y6PFZ'\);\s*<\/script>/;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (searchRegex.test(content)) {
    // Remove it from its current position
    content = content.replace(searchRegex, '');
    
    // Insert immediately after <head>
    content = content.replace(/<head>/, '<head>' + gtagSnippet);
    
    fs.writeFileSync(filePath, content);
    console.log('Moved in ' + file);
  } else {
    console.log('Snippet not found in ' + file);
  }
});

const layoutPath = 'd:/ipl/IPL/regular-meridian/src/layouts/Layout.astro';
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  if (searchRegex.test(layoutContent)) {
    layoutContent = layoutContent.replace(searchRegex, '');
    layoutContent = layoutContent.replace(/<head>/, '<head>' + gtagSnippet);
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('Moved in Layout.astro');
  }
}
