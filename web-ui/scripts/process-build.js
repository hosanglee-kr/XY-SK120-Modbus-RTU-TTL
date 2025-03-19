const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const buildDir = path.join(__dirname, '..', 'build');
const outputDir = path.join(__dirname, '..', 'spiffs_data');

// Configuration
const MAX_ESP_FS_SIZE = 1800000; // ~1.8MB typical limit for ESP32 LittleFS
const SKIP_SOURCE_MAPS = true;
const SKIP_LICENSE_FILES = true;
const HIGH_COMPRESSION = true;

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Size tracking
let totalSize = 0;
let totalGzippedSize = 0;
let skippedFiles = [];

// Function to process a file
function processFile(filePath, relPath) {
  // Skip source maps and license files
  if ((SKIP_SOURCE_MAPS && relPath.endsWith('.map')) || 
      (SKIP_LICENSE_FILES && relPath.includes('.LICENSE.txt'))) {
    skippedFiles.push(relPath);
    return;
  }

  const content = fs.readFileSync(filePath);
  
  // Don't place files in www subdirectory - ESP32 expects files at SPIFFS root
  const outputPath = path.join(outputDir, relPath);
  
  // Create directory structure if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // For HTML, CSS, and JS files, only store the gzipped version to save space
  if (/\.(html|css|js)$/.test(filePath)) {
    // Use higher compression level (9) for maximum space savings
    const compressionLevel = HIGH_COMPRESSION ? 9 : 6;
    const gzipped = zlib.gzipSync(content, { level: compressionLevel });
    
    // Write the gzipped file
    fs.writeFileSync(`${outputPath}.gz`, gzipped);
    
    // For small files or HTML files, keep an uncompressed version as well
    if (content.length < 10000 || relPath.endsWith('.html')) {
      fs.writeFileSync(outputPath, content);
      totalSize += content.length;
    }
    
    totalGzippedSize += gzipped.length;
    console.log(`Compressed: ${relPath} (${content.length} → ${gzipped.length} bytes, ${Math.round((1 - gzipped.length / content.length) * 100)}% reduction)`);
  } else {
    // For other files, just copy them
    fs.writeFileSync(outputPath, content);
    totalSize += content.length;
    console.log(`Copied: ${relPath} (${content.length} bytes)`);
  }
}

// Function to recursively process a directory
function processDirectory(dir, baseDir = dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(baseDir, fullPath);
    
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath, baseDir);
    } else {
      processFile(fullPath, relPath);
    }
  }
}

// Clean the output directory first
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Processing build output for ESP32 filesystem...');
processDirectory(buildDir);

// REMOVED: No longer moving files to www directory since ESP32 is looking 
// for them directly in the root of SPIFFS

// Report results
console.log('\nBuild processing complete');
console.log(`Total uncompressed size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`Total compressed size: ${(totalGzippedSize / 1024).toFixed(2)} KB`);
console.log(`Skipped ${skippedFiles.length} files (source maps and license files)`);

if (totalGzippedSize > MAX_ESP_FS_SIZE) {
  console.warn('\n⚠️  WARNING: Total compressed size exceeds typical ESP32 filesystem limit!');
  console.warn(`   Current size: ${(totalGzippedSize / 1024).toFixed(2)} KB, Limit: ${(MAX_ESP_FS_SIZE / 1024).toFixed(2)} KB`);
  console.warn('   Consider enabling production builds and further optimizing your application.');
} else {
  console.log(`\nEstimated filesystem usage: ${((totalGzippedSize / MAX_ESP_FS_SIZE) * 100).toFixed(1)}%`);
}

console.log('\nFiles saved to:', outputDir);
console.log('Remember to upload the contents to your ESP device\'s filesystem.');
