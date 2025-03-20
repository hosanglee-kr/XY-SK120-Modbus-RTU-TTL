from SCons.Script import Import, DefaultEnvironment
env = DefaultEnvironment()
import os
import subprocess
import hashlib
import sys

# Add scripts directory to python path to import other modules if needed
sys.path.append(os.path.join(env.subst("$PROJECT_DIR"), "scripts"))

# Run the partition generation script if CSV has changed
def before_build(source, target, env):
    csv_file = env.subst("$PROJECT_DIR/partitions.csv")
    bin_file = env.subst("$PROJECT_DIR/partitions.bin")
    script_file = os.path.join(env.subst("$PROJECT_DIR"), "scripts", "gen_partition.py")
    
    # Check if the CSV file exists
    if not os.path.exists(csv_file):
        print(f"Partition file {csv_file} not found!")
        return
    
    # Check if bin exists and if CSV was modified
    regenerate = False
    if not os.path.exists(bin_file):
        regenerate = True
    else:
        # Check file hashes to see if CSV changed
        with open(csv_file, 'rb') as f:
            csv_hash = hashlib.md5(f.read()).hexdigest()
        
        # Store hash in a temp file for comparison
        hash_file = f"{csv_file}.md5"
        if os.path.exists(hash_file):
            with open(hash_file, 'r') as f:
                old_hash = f.read().strip()
            regenerate = old_hash != csv_hash
        else:
            regenerate = True
        
        if regenerate:
            # Save new hash
            with open(hash_file, 'w') as f:
                f.write(csv_hash)
    
    if regenerate:
        print("Generating partition binary from CSV...")
        try:
            subprocess.check_call(['python3', script_file, '--input', csv_file, '--output', bin_file])
            print("Partition binary generated successfully")
        except subprocess.CalledProcessError as e:
            print(f"Error generating partition binary: {e}")

# Register the callback
env.AddPreAction("buildprog", before_build)

Import("env")

# Remove the BuildSources call to prevent duplicate compilation
# env.BuildSources("$BUILD_DIR/liba74", "$PROJECT_DIR/lib/XY-SKxxx")
