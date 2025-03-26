#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess

def format_size(size_bytes):
    """Format size in bytes to human-readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes/1024:.2f} KB"
    else:
        return f"{size_bytes/(1024*1024):.2f} MB"

def count_files_by_type(directory):
    """Count files by extension in a directory tree"""
    extension_counts = {}
    extension_sizes = {}
    
    for root, _, files in os.walk(directory):
        for file in files:
            # Skip hidden files
            if file.startswith('.'):
                continue
                
            filepath = os.path.join(root, file)
            
            # Get file extension
            _, ext = os.path.splitext(file)
            ext = ext.lower()  # Normalize extension
            if not ext:
                ext = '(no extension)'
            
            # Count by extension
            extension_counts[ext] = extension_counts.get(ext, 0) + 1
            
            # Get file size
            try:
                file_size = os.path.getsize(filepath)
                extension_sizes[ext] = extension_sizes.get(ext, 0) + file_size
            except Exception as e:
                print(f"Error getting size for {filepath}: {e}")
    
    return extension_counts, extension_sizes

def get_filesystem_info(env_name, project_dir):
    """Get information about the filesystem image"""
    # Path to the filesystem image
    fs_image_path = os.path.join(project_dir, '.pio', 'build', env_name, 'littlefs.bin')
    
    if not os.path.exists(fs_image_path):
        print(f"Filesystem image not found at {fs_image_path}")
        print("Please build the filesystem image first with 'pio run --target buildfs'")
        return None
    
    # Get the size of the filesystem image
    fs_image_size = os.path.getsize(fs_image_path)
    
    # Get information about data directory
    data_dir = os.path.join(project_dir, 'data')
    if not os.path.exists(data_dir):
        print(f"Data directory not found at {data_dir}")
        data_dir_size = 0
        file_count = 0
        extension_stats = {}
    else:
        # Get total size of data directory
        data_dir_size = 0
        file_count = 0
        for root, _, files in os.walk(data_dir):
            for file in files:
                if file.startswith('.'):  # Skip hidden files
                    continue
                filepath = os.path.join(root, file)
                try:
                    file_size = os.path.getsize(filepath)
                    data_dir_size += file_size
                    file_count += 1
                except Exception as e:
                    print(f"Error getting size for {filepath}: {e}")
        
        # Get statistics by file extension
        extension_counts, extension_sizes = count_files_by_type(data_dir)
        
        # Create a sorted list of extensions by size
        extension_stats = [
            {
                'extension': ext,
                'count': extension_counts[ext],
                'size': extension_sizes[ext],
                'avg_size': extension_sizes[ext] / extension_counts[ext]
            }
            for ext in extension_counts
        ]
        
        # Sort by size (largest first)
        extension_stats.sort(key=lambda x: x['size'], reverse=True)
    
    return {
        'fs_image_size': fs_image_size,
        'data_dir_size': data_dir_size,
        'file_count': file_count,
        'extension_stats': extension_stats
    }

def main():
    parser = argparse.ArgumentParser(description='Analyze filesystem image size')
    parser.add_argument('--env', default='seeed_xiao_esp32s3', help='PlatformIO environment name')
    args = parser.parse_args()
    
    # Get the environment name
    env_name = args.env
    
    # Get project directory
    project_dir = os.getcwd()
    
    # Get filesystem information
    fs_info = get_filesystem_info(env_name, project_dir)
    
    if not fs_info:
        return
    
    # Display filesystem information
    print("\nFilesystem Image Analysis")
    print("=========================")
    print(f"Image size:       {format_size(fs_info['fs_image_size'])} ({fs_info['fs_image_size']} bytes)")
    print(f"Data dir size:    {format_size(fs_info['data_dir_size'])} ({fs_info['data_dir_size']} bytes)")
    
    if fs_info['data_dir_size'] > 0:
        ratio = fs_info['data_dir_size'] / fs_info['fs_image_size']
        print(f"Compression ratio: {ratio:.2f}x")
    
    print(f"Total files:      {fs_info['file_count']}")
    
    # Get partition information to determine max size
    try:
        partition_file = os.path.join(project_dir, 'partitions.csv')
        fs_partition_size = None
        
        if os.path.exists(partition_file):
            with open(partition_file, 'r') as f:
                for line in f:
                    if 'spiffs' in line or 'littlefs' in line:
                        parts = line.strip().split(',')
                        if len(parts) >= 5:
                            fs_partition_size = int(parts[4].strip(), 16)
                            break
        
        if fs_partition_size:
            print(f"Filesystem partition size: {format_size(fs_partition_size)} ({fs_partition_size} bytes)")
            usage_percent = (fs_info['fs_image_size'] / fs_partition_size) * 100
            print(f"Usage: {usage_percent:.1f}% of filesystem partition")
            
            # Add visualization of usage
            terminal_width = 60
            used_width = int((terminal_width * usage_percent) / 100)
            used_bar = "█" * used_width
            free_bar = "░" * (terminal_width - used_width)
            print(f"[{used_bar}{free_bar}]")
            
    except Exception as e:
        print(f"Could not determine filesystem partition size: {e}")
    
    # Display file type statistics
    if fs_info['extension_stats']:
        print("\nFile types by size:")
        print("==================")
        for stat in fs_info['extension_stats']:
            ext = stat['extension']
            count = stat['count']
            size = stat['size']
            avg = stat['avg_size']
            
            # Calculate percentage of total size
            percentage = (size / fs_info['data_dir_size']) * 100 if fs_info['data_dir_size'] > 0 else 0
            
            print(f"{ext.ljust(15)}: {format_size(size).ljust(10)} ({count} files, avg {format_size(avg)}, {percentage:.1f}%)")
        
        # Visualize file types by size
        print("\nFile types visualization:")
        print("========================")
        terminal_width = 60
        
        # Only show top 10 file types for visualization
        top_extensions = fs_info['extension_stats'][:10]
        
        # Find maximum extension name length
        max_ext_len = max(len(stat['extension']) for stat in top_extensions)
        
        for stat in top_extensions:
            ext = stat['extension']
            size = stat['size']
            percentage = (size / fs_info['data_dir_size']) * 100 if fs_info['data_dir_size'] > 0 else 0
            
            # Calculate bar width based on percentage
            bar_width = max(1, int((terminal_width * percentage) / 100))
            bar = "█" * bar_width
            
            print(f"{ext.ljust(max_ext_len)} [{bar.ljust(terminal_width)}] {percentage:.1f}%")
    
    print("\nNote: The filesystem image size may differ from the data directory size due to")
    print("filesystem overhead, block size, and compression settings.")
    print("\nTip: If you see errors about missing PIL when building the filesystem,")
    print("you can install it with: 'pip install Pillow' for better icon generation.")
    print("A simple fallback has been provided, but proper icons may require PIL.")

if __name__ == "__main__":
    main()
