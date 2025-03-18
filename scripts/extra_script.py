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

# Define a function to generate custom partition table
def gen_partitions_callback(*args, **kwargs):
    script_path = os.path.join(env.subst("$PROJECT_DIR"), "scripts", "gen_partitions.py")
    env.Execute("$PYTHONEXE " + script_path)

# Define a function for pre-build tasks
def pre_build_callback(*args, **kwargs):
    script_path = os.path.join(env.subst("$PROJECT_DIR"), "scripts", "pre_build_script.py")
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

# Register the generate partitions target
env.AddCustomTarget(
    name="gen-partitions",
    dependencies=None,
    actions=[gen_partitions_callback],
    title="Generate Partition Table",
    description="Generates custom partition table for the project"
)

# Register the pre-build tasks target
env.AddCustomTarget(
    name="pre-build-tasks",
    dependencies=None,
    actions=[pre_build_callback],
    title="Run Pre-build Tasks",
    description="Executes pre-build tasks like version updates or configuration generation"
)

# Add pre-build hook to automatically run the pre-build script before each build
env.AddPreAction("buildprog", pre_build_callback)
