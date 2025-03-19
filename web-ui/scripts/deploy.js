const fs = require('fs');
const path = require('path');

// Define directories
const sourceDir = path.join(__dirname, '..', 'spiffs_data');
const targetDir = path.join(__dirname, '..', '..', 'data');

// Function to recursively copy files
function copyFiles(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  let copiedCount = 0;

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      // Recursively copy subdirectories
      copiedCount += copyFiles(sourcePath, targetPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${path.relative(sourceDir, sourcePath)} → ${path.relative(targetDir, targetPath)}`);
      copiedCount++;
    }
  }

  return copiedCount;
}

// Clean target directory first
if (fs.existsSync(targetDir)) {
  console.log(`Cleaning target directory: ${targetDir}`);
  fs.rmSync(targetDir, { recursive: true, force: true });
}

// Create fresh target directory
fs.mkdirSync(targetDir, { recursive: true });

console.log(`Deploying files from ${sourceDir} to ${targetDir}...`);

try {
  const totalCopied = copyFiles(sourceDir, targetDir);
  console.log(`\nDeployment complete! ${totalCopied} files copied to ${targetDir}`);
  console.log('Ready for PlatformIO filesystem upload.');
} catch (error) {
  console.error(`\nError during deployment: ${error.message}`);
  process.exit(1);
}
