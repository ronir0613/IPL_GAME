const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (file === 'index.astro') {
    content = content.replace(/import ThemeToggle from '\.\.\/components\/ThemeToggle(\.tsx)?';/, '');
    content = content.replace(/<ThemeToggle client:load \/>/g, '');
  } else {
    // Replace import
    content = content.replace(/import ThemeToggle from '\.\.\/components\/ThemeToggle(\.tsx)?';/, "import NavBar from '../components/NavBar';");

    // For non-index files, we need to inject the NavBar and wrap the rest in pt-16
    if (content.includes('<ThemeToggle client:load />')) {
      content = content.replace(/<ThemeToggle client:load \/>\s*/g, '');
      
      // Inject NavBar right after <body ...>
      content = content.replace(/(<body[^>]*>)/, '$1\n    <NavBar client:load />\n    <div class="pt-16">');
      
      // Inject closing </div> right before </body>
      content = content.replace(/(<\/body>)/, '    </div>\n  $1');
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Patched', file);
}
