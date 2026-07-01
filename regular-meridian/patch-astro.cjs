const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

const themeScript = `
    <script is:inline>
      const theme = (() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
          return localStorage.getItem('theme');
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      })();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.localStorage.setItem('theme', theme);
    </script>
`;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add import to frontmatter
  if (!content.includes("import ThemeToggle")) {
    if (content.startsWith("---")) {
      content = content.replace(/^---\s*\n/m, "---\nimport ThemeToggle from '../components/ThemeToggle';\n");
    } else {
      content = `---\nimport ThemeToggle from '../components/ThemeToggle';\n---\n` + content;
    }
  }

  // 2. Add script to <head>
  if (!content.includes("localStorage.getItem('theme')")) {
    content = content.replace(/(<head>)/i, `$1\n${themeScript}`);
  }

  // 3. Add <ThemeToggle client:load /> to <body>
  if (!content.includes("<ThemeToggle client:load />")) {
    content = content.replace(/(<body[^>]*>)/i, `$1\n    <ThemeToggle client:load />`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
