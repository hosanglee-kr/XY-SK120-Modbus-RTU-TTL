from SCons.Script import Import, DefaultEnvironment
import os
import shutil
import sys

env = DefaultEnvironment()

def copy_static_files(source, target, env):
    """Copy static folder contents to the data folder so they're included in LittleFS"""
    
    project_dir = env.subst("$PROJECT_DIR")
    static_dir = os.path.join(project_dir, "static")
    data_dir = os.path.join(project_dir, "data")
    
    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created data directory at {data_dir}")
    
    # Check if static directory exists
    if not os.path.exists(static_dir):
        print(f"Static directory {static_dir} not found!")
        return
    
    print(f"Copying static files directly to data folder (not under data/static)...")
    
    # Important: Copy files directly to data folder, not to data/static
    # This ensures paths like /static/js/file.js work correctly
    
    copied_count = 0
    for root, dirs, files in os.walk(static_dir):
        # Calculate the relative path from static_dir
        relative_path = os.path.relpath(root, static_dir)
        
        # Create the target directory in data/
        # If we're at the root of static/, the target is data/static
        # If we're at static/js/, the target is data/static/js
        if relative_path == '.':
            target_dir = os.path.join(data_dir, "static")
        else:
            target_dir = os.path.join(data_dir, "static", relative_path)
            
        # Create target directory if needed
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            print(f"Created directory: {target_dir}")
        
        # Copy files
        for file in files:
            source_file = os.path.join(root, file)
            target_file = os.path.join(target_dir, file)
            
            # Always copy for now to ensure everything is in place
            shutil.copy2(source_file, target_file)
            copied_count += 1
            print(f"Copied: {os.path.relpath(source_file, project_dir)} → {os.path.relpath(target_file, project_dir)}")
    
    if copied_count > 0:
        print(f"Copied {copied_count} files from static directory")
    else:
        print("No static files to copy")

    # After copying all files, generate placeholders for missing source maps
    print("Checking for missing source maps...")
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.endswith('.js') and not file.endswith('.map'):
                js_file = os.path.join(root, file)
                map_file = js_file + '.map'
                
                if not os.path.exists(map_file):
                    # Create a minimal source map placeholder
                    with open(map_file, 'w') as f:
                        f.write('{"version":3,"file":"' + file + '","sources":[],"names":[],"mappings":""}')
                    print(f"Created source map placeholder: {os.path.relpath(map_file, data_dir)}")

    # Debug: List all files in data directory after copying
    print("\nFiles in data directory after copying:")
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            print(f"  {os.path.relpath(os.path.join(root, file), data_dir)}")

# Register the pre-action before filesystem operations
env.AddPreAction("$BUILD_DIR/littlefs.bin", copy_static_files)
# Also add as a separate build target for manual execution
env.AddTarget(
    name="copy_static",
    dependencies=None,
    actions=copy_static_files,
    title="Copy Static Files",
    description="Copies static files to data directory for LittleFS"
)
