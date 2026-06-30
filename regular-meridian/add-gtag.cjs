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
    </script>
`;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('G-DC032Y6PFZ') && content.includes('</head>')) {
    content = content.replace('</head>', gtagSnippet + '  </head>');
    fs.writeFileSync(filePath, content);
    console.log('Added to ' + file);
  }
});

const layoutPath = 'd:/ipl/IPL/regular-meridian/src/layouts/Layout.astro';
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  if (!layoutContent.includes('is:inline async src')) {
     layoutContent = layoutContent.replace('<script async src="https://www.googletagmanager.com/gtag/js?id=G-DC032Y6PFZ"></script>', '<script is:inline async src="https://www.googletagmanager.com/gtag/js?id=G-DC032Y6PFZ"></script>');
     fs.writeFileSync(layoutPath, layoutContent);
     console.log('Updated Layout.astro');
  }
}
