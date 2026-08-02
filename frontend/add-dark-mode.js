const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /(?<!dark:)bg-white/g, replacement: 'bg-white dark:bg-gray-900' },
  { regex: /(?<!dark:)text-gray-900/g, replacement: 'text-gray-900 dark:text-gray-100' },
  { regex: /(?<!dark:)text-gray-800/g, replacement: 'text-gray-800 dark:text-gray-200' },
  { regex: /(?<!dark:)text-gray-700/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /(?<!dark:)text-gray-600/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /(?<!dark:)text-gray-500/g, replacement: 'text-gray-500 dark:text-gray-400' },
  { regex: /(?<!dark:)bg-gray-50(?!0)/g, replacement: 'bg-gray-50 dark:bg-gray-950' },
  { regex: /(?<!dark:)bg-gray-100/g, replacement: 'bg-gray-100 dark:bg-gray-800' },
  { regex: /(?<!dark:)bg-gray-200/g, replacement: 'bg-gray-200 dark:bg-gray-700' },
  { regex: /(?<!dark:)border-gray-200/g, replacement: 'border-gray-200 dark:border-gray-800' },
  { regex: /(?<!dark:)border-gray-100/g, replacement: 'border-gray-100 dark:border-gray-800' },
  { regex: /(?<!dark:)border-gray-300/g, replacement: 'border-gray-300 dark:border-gray-700' },
  { regex: /(?<!dark:)hover:bg-gray-50(?!0)/g, replacement: 'hover:bg-gray-50 dark:hover:bg-gray-800' },
  { regex: /(?<!dark:)hover:bg-gray-100/g, replacement: 'hover:bg-gray-100 dark:hover:bg-gray-800' },
  { regex: /(?<!dark:)hover:text-gray-900/g, replacement: 'hover:text-gray-900 dark:hover:text-gray-100' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      // Exclude layout.js in dashboard since I already manually did it, actually let's re-run it, the regex has (?<!dark:) so it won't duplicate.
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Done");
