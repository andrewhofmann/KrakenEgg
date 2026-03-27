#!/usr/bin/env python3
"""
Script to round the corners of icon images to match macOS system icon style.
macOS uses approximately 22.5% radius relative to the icon size.
"""

import os
import sys
from PIL import Image, ImageDraw
import glob

def round_corners(image, radius_percent=0.225):
    """
    Round the corners of an image with specified radius percentage.
    macOS typically uses ~22.5% radius relative to icon size.
    """
    # Get image dimensions
    width, height = image.size

    # Calculate radius (22.5% of the smaller dimension)
    radius = int(min(width, height) * radius_percent)

    # Create a mask for rounded corners
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # Draw rounded rectangle on mask
    draw.rounded_rectangle(
        [(0, 0), (width, height)],
        radius=radius,
        fill=255
    )

    # Apply the mask to the image
    output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)

    return output

def process_iconset(iconset_path):
    """Process all PNG files in an iconset directory."""
    png_files = glob.glob(os.path.join(iconset_path, "*.png"))

    if not png_files:
        print(f"No PNG files found in {iconset_path}")
        return

    print(f"Processing {len(png_files)} icon files...")

    for png_file in png_files:
        print(f"Processing {os.path.basename(png_file)}...")

        # Open the image
        try:
            image = Image.open(png_file).convert('RGBA')

            # Round the corners
            rounded = round_corners(image)

            # Save the result
            rounded.save(png_file)
            print(f"  ✅ Rounded corners applied")

        except Exception as e:
            print(f"  ❌ Error processing {png_file}: {e}")

def main():
    iconset_path = "SquidAppIcon_Option6_ScaledSafeZone.iconset"

    if not os.path.exists(iconset_path):
        print(f"Error: {iconset_path} not found")
        sys.exit(1)

    print("🔄 Applying macOS-style rounded corners to icon...")
    process_iconset(iconset_path)
    print("✅ Icon corner rounding complete!")

if __name__ == "__main__":
    main()