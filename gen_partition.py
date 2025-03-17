#!/usr/bin/env python3
import csv
import struct
import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description='Convert CSV partition table to binary')
    parser.add_argument('--input', default='partitions.csv', help='Input CSV file')
    parser.add_argument('--output', default='partitions.bin', help='Output binary file')
    args = parser.parse_args()

    input_file = args.input
    output_file = args.output

    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} doesn't exist!")
        sys.exit(1)

    # Read CSV
    partitions = []
    with open(input_file, 'r') as f:
        csvreader = csv.reader(f)
        for row in csvreader:
            if not row or row[0].startswith('#'):
                continue  # Skip empty lines and comments
            
            row = [cell.strip() for cell in row]
            if len(row) < 5:
                continue  # Skip malformed rows
                
            name, type_, subtype, offset, size = row[:5]
            
            # Convert from text format to binary format
            try:
                type_ = convert_type(type_)
                
                # Handle subtype conversion - fix here to properly handle text subtypes
                if subtype.isdigit() or (subtype.startswith("0x") and all(c in "0123456789abcdefABCDEF" for c in subtype[2:])):
                    subtype = int(subtype, 0)  # Parse as number if it's a number
                else:
                    subtype = convert_subtype(subtype)  # Convert text to number
                    
                offset = int(offset, 0)
                size = int(size, 0)
                
                # Append partition
                partitions.append((name, type_, subtype, offset, size))
            except Exception as e:
                print(f"Error processing row {row}: {e}")
                continue
    
    # Write binary file
    with open(output_file, 'wb') as f:
        # ESP32 partition table magic number
        f.write(struct.pack('<I', 0xABCD5432))
        
        # Write each partition entry
        for name, type_, subtype, offset, size in partitions:
            name_bytes = name.encode('utf-8')
            name_array = bytearray(16)
            name_array[:len(name_bytes)] = name_bytes
            
            f.write(name_array)  # 16 bytes for name
            f.write(struct.pack('<BBBBI', type_, subtype, 0, 0, offset))  # Type, subtype, flags (2 bytes), offset
            f.write(struct.pack('<I', size))  # Size
    
    print(f"Generated {output_file} from {input_file}")

def convert_type(type_str):
    types = {
        'app': 0x00,
        'data': 0x01
    }
    return types.get(type_str.lower(), 0)

def convert_subtype(subtype_str):
    subtypes = {
        'factory': 0x00,
        'ota_0': 0x10,
        'ota_1': 0x11,
        'ota': 0x20,
        'nvs': 0x01,
        'phy': 0x02,
        'spiffs': 0x82,
    }
    return subtypes.get(subtype_str.lower(), 0)

if __name__ == '__main__':
    main()
