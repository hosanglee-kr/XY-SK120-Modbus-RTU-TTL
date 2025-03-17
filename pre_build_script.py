from SCons.Script import Import, Environment
env = Environment()
import os
import subprocess
import hashlib

# Run the partition generation script if CSV has changed
def before_build(source, target, env):
    csv_file = "partitions.csv"
    bin_file = "partitions.bin"
    script_file = "gen_partition.py"
    
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
            subprocess.check_call(['python3', script_file])
            print("Partition binary generated successfully")
        except subprocess.CalledProcessError as e:
            print(f"Error generating partition binary: {e}")

# Register the callback
env.AddPreAction("buildprog", before_build)
