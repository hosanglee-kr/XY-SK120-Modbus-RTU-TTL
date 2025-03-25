import os
import sys
from SCons.Script import Import, DefaultEnvironment

env = DefaultEnvironment()

def process_fs_data(source, target, env):
    """Process data directory before uploading to filesystem"""
    print("Preparing filesystem data for upload...")
    
    # Get the data directory where web files are stored
    data_dir = os.path.join(env.subst("$PROJECT_DIR"), "data")
    
    # Make sure the data directory exists
    if not os.path.isdir(data_dir):
        print(f"Warning: Data directory {data_dir} does not exist. Creating it...")
        os.makedirs(data_dir, exist_ok=True)
    
    # Check for required icons and generate them if missing
    required_icons = [
        "favicon.ico",
        "apple-touch-icon.png",
        "apple-touch-icon-precomposed.png"
    ]
    
    missing_icons = [icon for icon in required_icons if not os.path.exists(os.path.join(data_dir, icon))]
    if missing_icons:
        print(f"Missing icons: {', '.join(missing_icons)}")
        print("Generating missing icons...")
        try:
            # Use the generate_icons script
            sys.path.append(os.path.join(env.subst("$PROJECT_DIR"), "scripts"))
            from generate_icons import main as generate_icons
            generate_icons()
        except Exception as e:
            print(f"Failed to generate icons: {e}")
    
    # Count web files to upload
    web_file_count = 0
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.endswith(('.html', '.css', '.js', '.json', '.ico', '.png')):
                web_file_count += 1
    
    print(f"Found {web_file_count} web files to upload in data directory")
    
    # Check if index.html exists which is required
    if not os.path.exists(os.path.join(data_dir, "index.html")):
        print("Warning: index.html not found in data directory. Web interface may not work properly.")
    
    # Return success
    return True

# Add our custom action to run when filesystem is being built
try:
    # This might fail if the target doesn't exist yet
    env.AddPreAction("$BUILD_DIR/littlefs.bin", process_fs_data)
except Exception as e:
    print(f"Note: Could not add pre-action for filesystem build: {e}")

# Don't add custom target - uploadfs is already defined by PlatformIO
print("Filesystem scripts initialized. Use 'pio run --target uploadfs' to upload files.")
