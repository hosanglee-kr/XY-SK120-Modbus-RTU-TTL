const fs = require('fs');
const path = require('path');

// Define paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const libDestPath = path.join(__dirname, '..', 'data', 'js', 'lib');

// Libraries to copy
const libraries = [
  {
    name: 'anime.js',
    source: path.join(nodeModulesPath, 'animejs', 'lib', 'anime.min.js'),
    dest: path.join(libDestPath, 'anime.min.js')
  }
  // Add other libraries here as needed
];

// Ensure lib directory exists
if (!fs.existsSync(libDestPath)) {
  console.log(`Creating directory: ${libDestPath}`);
  fs.mkdirSync(libDestPath, { recursive: true });
}

// Copy each library
libraries.forEach(lib => {
  if (fs.existsSync(lib.source)) {
    console.log(`Copying ${lib.name} from ${lib.source} to ${lib.dest}`);
    fs.copyFileSync(lib.source, lib.dest);
    console.log(`✅ Successfully copied ${lib.name}`);
  } else {
    console.error(`❌ Error: Could not find ${lib.name} at ${lib.source}`);
    console.error(`   Make sure you've run 'npm install' first`);
  }
});

console.log('Library copy process completed!');
