#!/usr/bin/env python3
"""
Script to add macOS-style rounded corners to an icon.
macOS icons use approximately 18% corner radius of the icon size.
"""

from PIL import Image, ImageDraw
import sys
import os

def add_rounded_corners(image_path, output_path, corner_radius_percent=0.18):
    """Add rounded corners to an image following macOS design guidelines."""

    # Open the image
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size

    # Calculate corner radius (18% is the macOS standard)
    corner_radius = int(min(width, height) * corner_radius_percent)

    # Create a mask for rounded corners
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # Draw rounded rectangle mask
    draw.rounded_rectangle(
        [(0, 0), (width, height)],
        radius=corner_radius,
        fill=255
    )

    # Create output image with transparent background
    output = Image.new('RGBA', (width, height), (0, 0, 0, 0))

    # Apply the mask to create rounded corners
    output.paste(img, (0, 0))
    output.putalpha(mask)

    # Save the result
    output.save(output_path, "PNG")
    print(f"✅ Created rounded corner icon: {output_path}")
    print(f"   Corner radius: {corner_radius}px ({corner_radius_percent*100:.1f}% of {min(width, height)}px)")

if __name__ == "__main__":
    input_file = "/Users/andrew/Documents/Personal/Dev AI Coding/KrakenEgg/Graphics/Icon Ideas/SquidAppIcon_Option6_Final.png"
    output_file = "/Users/andrew/Documents/Personal/Dev AI Coding/KrakenEgg/Graphics/Icon Ideas/SquidAppIcon_Option6_Final_Rounded.png"

    if os.path.exists(input_file):
        add_rounded_corners(input_file, output_file)
    else:
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)