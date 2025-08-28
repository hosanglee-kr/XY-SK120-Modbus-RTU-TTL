#!/bin/bash
# filepath: /Users/frankieyuen/XY-SK120-Modbus-RTU-TTL/build-css.sh

# Build script for Tailwind CSS
# This script will build the Tailwind CSS file from the input.css file

# Display header
echo "==============================================="
echo "    XY-SK120 Tailwind CSS Build Script"
echo "==============================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed!"
    echo "Please install Node.js and npm first."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies!"
        exit 1
    fi
    
    echo "Dependencies installed successfully."
else
    echo "Dependencies already installed."
fi

# Build for development (with source maps, not minified)
echo ""
echo "Building Tailwind CSS for development..."
npm run build:css

if [ $? -ne 0 ]; then
    echo "Error: Failed to build Tailwind CSS!"
    exit 1
fi

echo "Development build completed successfully."

# Ask if the user wants to build for production
echo ""
echo "Do you want to build a minified production version? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Building minified Tailwind CSS for production..."
    npm run prod:css
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build minified CSS!"
        exit 1
    fi
    
    echo "Production build completed successfully."
fi

echo ""
echo "Tailwind CSS build process complete!"
echo "The CSS file is available at: data/css/tailwind.css"
echo ""
echo "To make changes to the styling:"
echo "1. Edit the data/css/input.css file or component files"
echo "2. Run this script again to rebuild the CSS"
echo "3. For continuous development, run 'npm run watch:css'"
echo ""