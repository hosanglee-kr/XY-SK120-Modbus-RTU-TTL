import os
import sys
import subprocess
from SCons.Script import DefaultEnvironment

env = DefaultEnvironment()

def uploadFS():
    print("Uploading filesystem to device...")
    try:
        # Use platformio.exe on Windows or platformio on Unix
        platformio_exe = "platformio.exe" if sys.platform == "win32" else "platformio"
        
        # Execute the filesystem upload command
        cmd = [platformio_exe, "run", "--target", "uploadfs"]
        
        subprocess.run(cmd, check=True)
        print("Filesystem upload completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error uploading filesystem: {e}")
        return False
    return True

if __name__ == "__main__":
    uploadFS()
