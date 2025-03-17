from SCons.Script import Import, DefaultEnvironment
env = DefaultEnvironment()
import os
import subprocess

# Define a function to display the firmware size
def size_callback(*args, **kwargs):
    script_path = os.path.join(env.subst("$PROJECT_DIR"), "scripts", "show_size.py")
    env.Execute("$PYTHONEXE " + script_path)

# Define a function to display the partition table
def partition_callback(*args, **kwargs):
    script_path = os.path.join(env.subst("$PROJECT_DIR"), "scripts", "show_partitions.py")
    env.Execute("$PYTHONEXE " + script_path)

# Register custom targets with a more unique name
env.AddCustomTarget(
    name="firmware-size",
    dependencies=None,
    actions=[size_callback],
    title="Analyze Firmware Size",
    description="Shows detailed firmware size information"
)

# Register the partition table visualization target
env.AddCustomTarget(
    name="show-partitions",
    dependencies=None,
    actions=[partition_callback],
    title="Show Partition Table",
    description="Shows the flash partition layout in human-readable format"
)
