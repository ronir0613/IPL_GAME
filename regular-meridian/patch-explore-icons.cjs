const fs = require('fs');
const path = require('path');

const exploreFile = path.join(__dirname, 'src', 'components', 'Explore.tsx');
let content = fs.readFileSync(exploreFile, 'utf8');

// Fix the Mode Cards icons
content = content.replace(
  'className="bg-blue-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-blue-100"',
  'className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-blue-100 dark:border-blue-900/50"'
);
content = content.replace(
  'className="text-blue-600"',
  'className="text-blue-600 dark:text-blue-400"'
);

content = content.replace(
  'className="bg-purple-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-purple-100"',
  'className="bg-purple-50 dark:bg-purple-900/30 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-purple-100 dark:border-purple-900/50"'
);
content = content.replace(
  'className="text-purple-600"',
  'className="text-purple-600 dark:text-purple-400"'
);

content = content.replace(
  'className="bg-red-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-red-100"',
  'className="bg-red-50 dark:bg-red-900/30 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-red-100 dark:border-red-900/50"'
);
content = content.replace(
  'className="text-red-500"',
  'className="text-red-500 dark:text-red-400"'
);

// Fix the final button text color
content = content.replace(
  'className="bg-white text-[var(--color-ink)] px-10 py-5 rounded-full font-bold text-[18px] hover:bg-[#f8fafc] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"',
  'className="bg-white text-[#0f172a] px-10 py-5 rounded-full font-bold text-[18px] hover:bg-[#f8fafc] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"'
);

fs.writeFileSync(exploreFile, content);
console.log('Explore.tsx patched successfully');
