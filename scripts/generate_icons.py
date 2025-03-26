import os
from PIL import Image, ImageDraw, ImageFont
import io

def generate_icon(size, text, output_path):
    """Generate a simple icon with the given text"""
    # Create a new image with a blue background
    img = Image.new('RGB', (size, size), color=(52, 152, 219))
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a font (this will vary by system)
        font_size = size // 3
        try:
            font = ImageFont.truetype("Arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        # Calculate text position to center it
        text_width, text_height = draw.textsize(text, font=font)
        position = ((size - text_width) // 2, (size - text_height) // 2)
        
        # Draw white text
        draw.text(position, text, fill=(255, 255, 255), font=font)
    except Exception as e:
        print(f"Error drawing text: {e}")
        # Draw a simple circle instead
        margin = size // 4
        draw.ellipse((margin, margin, size - margin, size - margin), fill=(255, 255, 255))
    
    # Save the image
    img.save(output_path)
    print(f"Generated icon: {output_path}")

def main():
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    # Generate favicon
    favicon_path = os.path.join(data_dir, "favicon.ico")
    if not os.path.exists(favicon_path):
        generate_icon(32, "XY", favicon_path)
    
    # Generate Apple Touch Icons
    apple_icon_path = os.path.join(data_dir, "apple-touch-icon.png")
    if not os.path.exists(apple_icon_path):
        generate_icon(180, "XY", apple_icon_path)
    
    apple_icon_precomposed_path = os.path.join(data_dir, "apple-touch-icon-precomposed.png")
    if not os.path.exists(apple_icon_precomposed_path):
        generate_icon(180, "XY", apple_icon_precomposed_path)
    
    print("Icon generation complete!")

if __name__ == "__main__":
    main()
