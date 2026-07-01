const fs = require('fs');
const path = require('path');

const exploreFile = path.join(__dirname, 'src', 'components', 'Explore.tsx');
let content = fs.readFileSync(exploreFile, 'utf8');

// Container
content = content.replace(
  'className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#171717] selection:text-[#f2f2f2] overflow-x-hidden"',
  'className="min-h-screen bg-[var(--color-canvas-soft)] text-[var(--color-ink)] font-sans selection:bg-yellow-500/30 overflow-x-hidden"'
);

// Back button
content = content.replace(
  'className="inline-flex items-center gap-2 text-[#4d4d4d] hover:text-[#171717]',
  'className="inline-flex items-center gap-2 text-[var(--color-body)] hover:text-[var(--color-ink)]'
);

// Hero container
content = content.replace(
  'bg-white mx-4 mt-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#ebebeb]"',
  'bg-[var(--color-canvas)] mx-4 mt-4 shadow-sm border border-[var(--color-hairline)]"'
);

// Hero badge
content = content.replace(
  'bg-[#f8fafc] text-[#475569] text-[13px] font-semibold mb-8 border border-[#e2e8f0]',
  'bg-[var(--color-canvas-soft-2)] text-[var(--color-body)] text-[13px] font-semibold mb-8 border border-[var(--color-hairline)]'
);

// Headings and paragraphs
content = content.replace(/text-\[#0f172a\]/g, 'text-[var(--color-ink)]');
content = content.replace(/text-\[#475569\]/g, 'text-[var(--color-body)]');
content = content.replace(/text-\[#64748b\]/g, 'text-[var(--color-mute)]');

// Mode cards & Rule cards
content = content.replace(/bg-white border border-\[#e2e8f0\]/g, 'bg-[var(--color-canvas)] border border-[var(--color-hairline)]');

fs.writeFileSync(exploreFile, content);
console.log('Explore.tsx patched successfully');
