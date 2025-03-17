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
            lines = objdump_result.stdout.splitlines()
            
            # Find section size information
            for line in lines:
                parts = line.split()
                if len(parts) >= 7 and any(s in parts[1] for s in ['.text', '.data', '.rodata', '.bss']):
                    section_name = parts[1]
                    size_hex = parts[2]
                    try:
                        size = int(size_hex, 16)
                        sections.append((section_name, size))
                    except ValueError:
                        pass
            
            # Calculate total size
            total_size = sum(size for _, size in sections)
            
            # Display information
            print("\nFirmware Section Sizes:")
            print("======================")
            for section, size in sections:
                print(f"{section.ljust(10)}: {format_size(size).ljust(12)} ({size} bytes)")
            
            print("\nTotal firmware size:", format_size(total_size), f"({total_size} bytes)")
            
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
            
            # Sort sections by size (largest first) for better visualization
            sections.sort(key=lambda x: x[1], reverse=True)
            
            # Find the longest section name for proper alignment
            max_name_length = max(len(section_name) for section_name, _ in sections)
            bar_width = terminal_width - (max_name_length + 15)  # Adjust for name, brackets, and percentage
            
            for section_name, size in sections:
                percentage = (size / total_size) * 100
                # Calculate bar width based on percentage of total firmware
                width = max(1, int(bar_width * percentage / 100))
                bar = "█" * width
                # Use max_name_length to ensure consistent alignment
                print(f"{section_name:<{max_name_length}} [{bar:<{bar_width}}] {percentage:.1f}%")
            
            # Add visualization of firmware vs partition size if we have factory size
            if factory_size:
                print("\nFirmware vs Partition Size:")
                print("===========================")
                
                used_width = max(1, int(bar_width * total_size / factory_size))
                free_space = factory_size - total_size
                free_percentage = (free_space / factory_size) * 100
                used_percentage = 100 - free_percentage
                
                used_bar = "█" * used_width
                # Use consistent spacing with the same width as section names
                print(f"{'Used':<{max_name_length}} [{used_bar:<{bar_width}}] {used_percentage:.1f}% ({format_size(total_size)})")
                
                if free_space > 0:
                    free_width = max(1, int(bar_width * free_space / factory_size))
                    free_bar = "░" * free_width
                    print(f"{'Available':<{max_name_length}} [{free_bar:<{bar_width}}] {free_percentage:.1f}% ({format_size(free_space)})")
            
    except Exception as e:
        print(f"Error analyzing firmware: {e}")

# This allows the script to be run both from the command line and as a module
if __name__ == "__main__":
    main()
