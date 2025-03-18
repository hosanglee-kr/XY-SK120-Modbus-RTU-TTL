#!/usr/bin/env python3
import os
import subprocess
import json
import argparse
import sys

def format_size(size_bytes):
    """Format size in bytes to human-readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes/1024:.2f} KB"
    else:
        return f"{size_bytes/(1024*1024):.2f} MB"

def get_platformio_size_info(env_name, project_dir):
    """Get firmware size information from PlatformIO build output"""
    try:
        # Check if the .pio/build/{env_name}/.sconsign39.dblite file exists (indicates a build)
        if not os.path.exists(os.path.join(project_dir, '.pio', 'build', env_name, '.sconsign39.dblite')):
            return None
            
        # Look for build output file which contains size information
        build_output_path = os.path.join(project_dir, '.pio', 'build', env_name, 'firmware.map')
        if not os.path.exists(build_output_path):
            # Try to find other files that might contain size information
            firmware_size_file = os.path.join(project_dir, '.pio', 'build', env_name, 'firmware.size')
            if os.path.exists(firmware_size_file):
                with open(firmware_size_file, 'r') as f:
                    size_data = f.read()
                    return {'size_data': size_data, 'source': 'firmware.size'}
                    
        # Try to run "platformio run --environment {env_name} --target size" to get size info
        size_cmd = ['platformio', 'run', '--environment', env_name, '--target', 'size']
        size_result = subprocess.run(size_cmd, capture_output=True, text=True)
        
        if size_result.returncode == 0:
            # Parse the output to extract size information
            output_lines = size_result.stdout.splitlines()
            size_info = {}
            
            # Look for lines containing RAM and Flash usage
            for i, line in enumerate(output_lines):
                if 'Memory Usage' in line:
                    for j in range(i+1, min(i+10, len(output_lines))):
                        if 'RAM:' in output_lines[j]:
                            ram_parts = output_lines[j].split()
                            size_info['ram_used'] = int(ram_parts[1])
                            size_info['ram_total'] = int(ram_parts[3])
                        elif 'Flash:' in output_lines[j]:
                            flash_parts = output_lines[j].split()
                            size_info['flash_used'] = int(flash_parts[1])
                            size_info['flash_total'] = int(flash_parts[3])
            
            if size_info:
                size_info['source'] = 'platformio size command'
                return size_info
                
        return None
    except Exception as e:
        print(f"Error getting PlatformIO size info: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Show firmware size details')
    parser.add_argument('--env', default='seeed_xiao_esp32s3', help='PlatformIO environment name')
    args = parser.parse_args()
    
    env_name = args.env
    
    # Get current project directory
    project_dir = os.getcwd()
    
    # Path to the firmware.elf file
    firmware_path = os.path.join(project_dir, '.pio', 'build', env_name, 'firmware.elf')
    
    if not os.path.exists(firmware_path):
        print(f"Firmware not found at {firmware_path}")
        print("Please build the project first with 'platformio run'")
        return
    
    # Get PlatformIO size information
    pio_size_info = get_platformio_size_info(env_name, project_dir)
    
    # Get details about the firmware size
    try:
        # Try to get section sizes using objdump
        objdump_cmd = ['xtensa-esp32s3-elf-objdump', '-h', firmware_path]
        objdump_result = subprocess.run(objdump_cmd, capture_output=True, text=True)
        
        if objdump_result.returncode != 0:
            print("Could not get detailed section information.")
            print("Using size command for basic information...")
            
            # Fall back to size command
            size_cmd = ['xtensa-esp32s3-elf-size', '-A', firmware_path]
            size_result = subprocess.run(size_cmd, capture_output=True, text=True)
            
            if size_result.returncode == 0:
                print("\nFirmware Size Information:")
                print("==========================")
                print(size_result.stdout)
            else:
                print("Failed to get size information.")
                return
        else:
            sections = []
            flash_sections = []
            ram_sections = []
            lines = objdump_result.stdout.splitlines()
            
            # Define which sections should be included in firmware size calculation
            # These are the sections that actually end up in the binary
            flash_section_prefixes = ['.flash', '.iram0.text', '.iram0.vectors', '.dram0.data']
            ram_section_prefixes = ['.dram0.bss', '.dram0.data', '.iram0.bss']
            
            # Sections to exclude from flash calculation (dummy/placeholder sections)
            exclude_sections = ['.flash_rodata_dummy', '.dram0.dummy']
            
            # Find section size information
            for line in lines:
                parts = line.split()
                if len(parts) >= 7:
                    section_name = parts[1]
                    # Skip debug sections
                    if section_name.startswith('.debug'):
                        continue
                    
                    size_hex = parts[2]
                    try:
                        size = int(size_hex, 16)
                        sections.append((section_name, size))
                        
                        # Add to flash sections if it's a flash section
                        if any(section_name.startswith(prefix) for prefix in flash_section_prefixes) and section_name not in exclude_sections:
                            flash_sections.append((section_name, size))
                            
                        # Add to RAM sections if it's a RAM section
                        if any(section_name.startswith(prefix) for prefix in ram_section_prefixes):
                            ram_sections.append((section_name, size))
                            
                    except ValueError:
                        pass
            
            # Calculate total size (all sections for display)
            total_size = sum(size for _, size in sections)
            
            # Calculate flash size (only including relevant flash sections)
            flash_size = sum(size for _, size in flash_sections)
            
            # Calculate RAM size
            ram_size = sum(size for _, size in ram_sections)
            
            # Display information
            print("\nFirmware Section Sizes (excluding debug info):")
            print("=============================================")
            for section, size in sections:
                included = ""
                if section in exclude_sections:
                    included = "(excluded from flash calculation)"
                elif any(section.startswith(prefix) for prefix in flash_section_prefixes):
                    included = "(included in flash calculation)"
                elif any(section.startswith(prefix) for prefix in ram_section_prefixes):
                    included = "(included in RAM calculation)"
                    
                print(f"{section.ljust(18)}: {format_size(size).ljust(12)} ({size} bytes) {included}")
            
            print("\nTotal firmware size (all sections):", format_size(total_size), f"({total_size} bytes)")
            print("Flash usage (actual):", format_size(flash_size), f"({flash_size} bytes)")
            print("RAM usage (actual):", format_size(ram_size), f"({ram_size} bytes)")
            
            # Display PlatformIO size information if available
            if pio_size_info:
                print("\nPlatformIO Size Information:")
                print("============================")
                if 'size_data' in pio_size_info:
                    print(pio_size_info['size_data'])
                else:
                    if 'flash_used' in pio_size_info:
                        print(f"Flash: {format_size(pio_size_info['flash_used'])} of {format_size(pio_size_info['flash_total'])} ({pio_size_info['flash_used']} bytes)")
                    if 'ram_used' in pio_size_info:
                        print(f"RAM:   {format_size(pio_size_info['ram_used'])} of {format_size(pio_size_info['ram_total'])} ({pio_size_info['ram_used']} bytes)")
                
                # Compare calculated size with PlatformIO reported size
                if 'flash_used' in pio_size_info:
                    print("\nSize Comparison:")
                    print("================")
                    flash_diff = pio_size_info['flash_used'] - flash_size
                    flash_diff_percent = (flash_diff / pio_size_info['flash_used']) * 100 if pio_size_info['flash_used'] > 0 else 0
                    
                    print(f"PlatformIO Flash: {format_size(pio_size_info['flash_used'])} ({pio_size_info['flash_used']} bytes)")
                    print(f"Script Flash:    {format_size(flash_size)} ({flash_size} bytes)")
                    print(f"Difference:      {format_size(abs(flash_diff))} ({abs(flash_diff)} bytes, {abs(flash_diff_percent):.2f}%)")
                    
                    if 'ram_used' in pio_size_info:
                        ram_diff = pio_size_info['ram_used'] - ram_size
                        ram_diff_percent = (ram_diff / pio_size_info['ram_used']) * 100 if pio_size_info['ram_used'] > 0 else 0
                        
                        print(f"\nPlatformIO RAM:   {format_size(pio_size_info['ram_used'])} ({pio_size_info['ram_used']} bytes)")
                        print(f"Script RAM:      {format_size(ram_size)} ({ram_size} bytes)")
                        print(f"Difference:      {format_size(abs(ram_diff))} ({abs(ram_diff)} bytes, {abs(ram_diff_percent):.2f}%)")
                    
                    if abs(flash_diff_percent) > 5:
                        print("\nSignificant Flash size difference detected!")
                        print("Common reasons for the discrepancy:")
                        print("  - Script might include/exclude different sections than PlatformIO")
                        print("  - PlatformIO might calculate size after additional processing steps")
                        print("  - Linker optimization or compression might affect final size")
                        print("  - ESP-IDF specific sections might be handled differently")
                        print("\nTry adjusting the section filters in the script to better match PlatformIO's calculation.")
            
            # Get flash and ram usage from platformio
            factory_size = None
            try:
                # Check if we can get partition info to know max size
                with open(os.path.join(project_dir, 'partitions.csv'), 'r') as f:
                    for line in f:
                        if 'factory' in line and 'app' in line:
                            parts = line.strip().split(',')
                            if len(parts) >= 5:
                                factory_size = int(parts[4].strip(), 16)
                                print(f"\nFactory partition size: {format_size(factory_size)}")
                                print(f"Used: {total_size * 100 / factory_size:.1f}% of factory partition")
            except Exception as e:
                print(f"Could not parse partition info: {e}")
                
            # Add visualization of firmware sections
            print("\nFirmware Section Visualization:")
            print("==============================")
            terminal_width = 80
            
            # Only include significant sections for visualization
            # Filter out sections that are very small or have special characters
            viz_sections = []
            for section_name, size in sections:
                # Skip sections that are too small to visualize properly
                if size < 1000 or section_name.startswith('.xt.'):  # Skip small sections and .xt. sections
                    continue
                viz_sections.append((section_name, size))
            
            # If we have too many sections, only show the top ones
            if len(viz_sections) > 15:
                viz_sections.sort(key=lambda x: x[1], reverse=True)
                viz_sections = viz_sections[:15]
            
            # Find the longest section name for proper alignment
            max_name_length = max(len(section_name) for section_name, _ in viz_sections) if viz_sections else 10
            bar_width = terminal_width - (max_name_length + 15)  # Adjust for name, brackets, and percentage
            
            # Sort sections by size for better visualization
            viz_sections.sort(key=lambda x: x[1], reverse=True)
            
            for section_name, size in viz_sections:
                percentage = (size / total_size) * 100
                # Calculate bar width based on percentage of total firmware
                width = max(1, int(bar_width * percentage / 100))
                bar = "█" * width
                
                # Ensure the section name doesn't cause formatting issues
                safe_name = section_name[:max_name_length]
                
                # Use positional format specifiers to avoid issues with '%' in section names
                print("{:<{}} [{:<{}}] {:.1f}%".format(
                    safe_name, max_name_length, 
                    bar, bar_width,
                    percentage
                ))
            
            # Add visualization of firmware vs partition size if we have factory size
            if factory_size:
                print("\nFirmware vs Partition Size:")
                print("===========================")
                
                used_width = max(1, int(bar_width * flash_size / factory_size))
                free_space = factory_size - flash_size
                free_percentage = (free_space / factory_size) * 100
                used_percentage = 100 - free_percentage
                
                used_bar = "█" * used_width
                # Use consistent spacing with the same width as section names and avoid % formatting
                print("{:<{}} [{:<{}}] {:.1f}% ({})".format(
                    "Used", max_name_length,
                    used_bar, bar_width,
                    used_percentage, format_size(flash_size)
                ))
                
                if free_space > 0:
                    free_width = max(1, int(bar_width * free_space / factory_size))
                    free_bar = "░" * free_width
                    print("{:<{}} [{:<{}}] {:.1f}% ({})".format(
                        "Available", max_name_length,
                        free_bar, bar_width,
                        free_percentage, format_size(free_space)
                    ))
            
    except Exception as e:
        print(f"Error analyzing firmware: {e}")
        import traceback
        traceback.print_exc()  # Print full stack trace for better debugging

# This allows the script to be run both from the command line and as a module
if __name__ == "__main__":
    main()
