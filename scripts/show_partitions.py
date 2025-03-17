#!/usr/bin/env python3
import os
import csv
import argparse
from tabulate import tabulate
import sys

def format_size(size_bytes):
    """Format size in bytes to human-readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes/1024:.2f} KB"
    else:
        return f"{size_bytes/(1024*1024):.2f} MB"

def get_partition_type_name(type_val):
    """Convert partition type to human-readable name"""
    types = {
        'app': "Application",
        'data': "Data"
    }
    return types.get(type_val, type_val)

def get_subtype_name(type_val, subtype_val):
    """Convert partition subtype to human-readable name"""
    if type_val == 'app':
        subtypes = {
            'factory': "Factory App",
            'ota_0': "OTA Slot 0",
            'ota_1': "OTA Slot 1"
        }
        return subtypes.get(subtype_val, subtype_val)
    elif type_val == 'data':
        subtypes = {
            'nvs': "Non-volatile Storage",
            'phy': "PHY Init Data",
            'ota': "OTA Data",
            'spiffs': "SPIFFS/LittleFS"
        }
        return subtypes.get(subtype_val, subtype_val)
    return subtype_val

def main():
    parser = argparse.ArgumentParser(description='Display partition table in human-readable format')
    parser.add_argument('--csv', default='partitions.csv', help='Path to partition CSV file')
    args = parser.parse_args()
    
    # Check if tabulate is installed
    try:
        import tabulate
    except ImportError:
        print("The tabulate package is not installed. Installing it now...")
        try:
            from pip import main as pipmain
        except ImportError:
            from pip._internal import main as pipmain
        pipmain(['install', 'tabulate'])
        try:
            from tabulate import tabulate
        except ImportError:
            print("Failed to install tabulate. Please install it manually: 'pip install tabulate'")
            print("Falling back to simple text format.")
            use_tabulate = False
        else:
            use_tabulate = True
    else:
        use_tabulate = True

    # Get project directory
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(project_dir, args.csv)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: Partition file {csv_path} doesn't exist!")
        sys.exit(1)
    
    # Parse CSV file
    partitions = []
    total_flash_size = 0
    
    with open(csv_path, 'r') as f:
        csvreader = csv.reader(f)
        for row in csvreader:
            if not row or row[0].startswith('#'):
                continue
            
            row = [cell.strip() for cell in row]
            if len(row) < 5:
                continue
                
            name, type_val, subtype_val, offset, size = row[:5]
            
            try:
                offset_int = int(offset, 16)
                size_int = int(size, 16)
                
                # Update total flash size
                partition_end = offset_int + size_int
                if partition_end > total_flash_size:
                    total_flash_size = partition_end
                
                partitions.append({
                    'name': name,
                    'type': type_val,
                    'subtype': subtype_val,
                    'offset': offset_int,
                    'size': size_int,
                    'readable_offset': f"0x{offset_int:X}",
                    'readable_size': format_size(size_int),
                    'readable_type': get_partition_type_name(type_val),
                    'readable_subtype': get_subtype_name(type_val, subtype_val),
                    'percentage': 0  # Will be calculated later
                })
            except Exception as e:
                print(f"Error processing row {row}: {e}")
    
    # Sort partitions by offset
    partitions.sort(key=lambda x: x['offset'])
    
    # Calculate percentage of total flash for each partition
    for p in partitions:
        p['percentage'] = (p['size'] / total_flash_size) * 100
    
    # Display information
    print(f"\nXIAO ESP32S3 Partition Table")
    print(f"============================")
    print(f"Total Flash Size: {format_size(total_flash_size)} ({total_flash_size} bytes)\n")
    
    if use_tabulate:
        # Create pretty table with tabulate
        table_data = []
        for p in partitions:
            table_data.append([
                p['name'],
                p['readable_type'],
                p['readable_subtype'],
                p['readable_offset'],
                p['readable_size'],
                f"{p['percentage']:.1f}%"
            ])
        
        headers = ["Name", "Type", "Subtype", "Offset", "Size", "% of Flash"]
        print(tabulate.tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
        # Simple text format if tabulate isn't available
        format_str = "{:<10} {:<12} {:<18} {:<12} {:<12} {:<8}"
        print(format_str.format("Name", "Type", "Subtype", "Offset", "Size", "% of Flash"))
        print("-" * 80)
        for p in partitions:
            print(format_str.format(
                p['name'],
                p['readable_type'],
                p['readable_subtype'],
                p['readable_offset'],
                p['readable_size'],
                f"{p['percentage']:.1f}%"
            ))
    
    # Print visual representation of flash layout
    print("\nFlash Layout Visualization:")
    print("=========================")
    terminal_width = 80
    for p in partitions:
        # Calculate bar width based on percentage of flash
        width = max(1, int((terminal_width - 30) * p['percentage'] / 100))
        bar = "█" * width
        print(f"{p['name']:<10} [{bar:<{terminal_width-30}}] {p['percentage']:.1f}%")

if __name__ == "__main__":
    main()
