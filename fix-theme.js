const fs = require('fs');
const path = require('path');

const targetDir = path.join('e:', 'CampusBuddyFinal', 'app', 'dashboard');

// Recursively get all .tsx files
const getFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
};

const tsxFiles = getFiles(targetDir);

// Standardize colors
tsxFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace rigid text-white
  newContent = newContent.replace(/\btext-white\b/g, 'text-foreground');
  newContent = newContent.replace(/\btext-white\/50\b/g, 'text-muted-foreground/80');
  newContent = newContent.replace(/\btext-white\/70\b/g, 'text-muted-foreground');
  newContent = newContent.replace(/\btext-white\/90\b/g, 'text-foreground/90');

  // Replace rigid backgrounds
  newContent = newContent.replace(/\bbg-white\/5\b/g, 'bg-black/5 dark:bg-white/5');
  newContent = newContent.replace(/\bbg-white\/2\b/g, 'bg-black/[0.02] dark:bg-white/2');
  newContent = newContent.replace(/\bbg-white\/10\b/g, 'bg-black/10 dark:bg-white/10');
  newContent = newContent.replace(/\bbg-white\/20\b/g, 'bg-black/20 dark:bg-white/20');
  newContent = newContent.replace(/\bbg-background\/50\b/g, 'bg-primary/5 dark:bg-background/50'); // often used for tags
  
  // Replace rigid borders
  newContent = newContent.replace(/\bborder-white\/5\b/g, 'border-black/5 dark:border-white/5');
  newContent = newContent.replace(/\bborder-white\/10\b/g, 'border-black/10 dark:border-white/10');
  newContent = newContent.replace(/\bborder-white\/20\b/g, 'border-black/20 dark:border-white/20');
  
  // Replace hover states
  newContent = newContent.replace(/\bhover:text-white\b/g, 'hover:text-foreground');
  newContent = newContent.replace(/\bhover:bg-white\/5\b/g, 'hover:bg-black/5 dark:hover:bg-white/5');
  newContent = newContent.replace(/\bhover:bg-white\/10\b/g, 'hover:bg-black/10 dark:hover:bg-white/10');
  newContent = newContent.replace(/\bhover:border-white\/10\b/g, 'hover:border-black/10 dark:hover:border-white/10');
  newContent = newContent.replace(/\bhover:border-white\/20\b/g, 'hover:border-black/20 dark:hover:border-white/20');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
console.log('Theme fix completed.');
