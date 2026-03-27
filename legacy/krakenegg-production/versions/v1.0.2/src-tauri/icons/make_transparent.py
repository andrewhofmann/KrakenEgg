#!/usr/bin/env python3
"""
Remove white background from SquidAppIcon_Glass.icns and make it transparent
"""

import os
import sys
from PIL import Image
import subprocess

def extract_png_from_icns(icns_path, output_path):
    """Extract PNG from ICNS file using sips"""
    try:
        subprocess.run([
            'sips', '-s', 'format', 'png',
            icns_path, '--out', output_path
        ], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error extracting PNG: {e}")
        return False

def remove_white_background(image_path, output_path, tolerance=10):
    """Remove white background and make it transparent"""
    try:
        # Open the image
        img = Image.open(image_path)

        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Get image data
        data = img.getdata()

        # Create new image data
        new_data = []

        for item in data:
            # Check if pixel is close to white (accounting for tolerance)
            r, g, b = item[:3]
            alpha = item[3] if len(item) == 4 else 255

            # If pixel is close to white, make it transparent
            if (r >= 255 - tolerance and
                g >= 255 - tolerance and
                b >= 255 - tolerance):
                new_data.append((r, g, b, 0))  # Transparent
            else:
                new_data.append((r, g, b, alpha))  # Keep original

        # Update image data
        img.putdata(new_data)

        # Save as PNG with transparency
        img.save(output_path, 'PNG')
        print(f"✅ Created transparent PNG: {output_path}")
        return True

    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return False

def create_icns_from_png(png_path, icns_path):
    """Create ICNS file from PNG using sips"""
    try:
        subprocess.run([
            'sips', '-s', 'format', 'icns',
            png_path, '--out', icns_path
        ], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating ICNS: {e}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Input and output paths
    original_icns = os.path.join(script_dir, 'SquidAppIcon_Glass.icns')
    temp_png = os.path.join(script_dir, 'temp_extracted.png')
    transparent_png = os.path.join(script_dir, 'SquidAppIcon_Glass_transparent.png')
    output_icns = os.path.join(script_dir, 'SquidAppIcon_Glass_transparent.icns')

    print("🎨 Making SquidAppIcon_Glass.icns background transparent...")

    # Step 1: Extract PNG from original ICNS
    print("📤 Extracting PNG from ICNS...")
    if not extract_png_from_icns(original_icns, temp_png):
        print("❌ Failed to extract PNG from ICNS")
        return 1

    # Step 2: Remove white background
    print("🔧 Removing white background...")
    if not remove_white_background(temp_png, transparent_png, tolerance=15):
        print("❌ Failed to remove white background")
        return 1

    # Step 3: Create new ICNS with transparency
    print("📦 Creating transparent ICNS...")
    if not create_icns_from_png(transparent_png, output_icns):
        print("❌ Failed to create transparent ICNS")
        return 1

    # Step 4: Replace original with transparent version
    print("🔄 Replacing original icon...")
    try:
        # Backup original
        backup_path = os.path.join(script_dir, 'SquidAppIcon_Glass_original.icns')
        if not os.path.exists(backup_path):
            os.rename(original_icns, backup_path)
            print(f"📋 Backed up original to: {backup_path}")

        # Move transparent version to original name
        os.rename(output_icns, original_icns)
        print(f"✅ Replaced icon with transparent version")

        # Clean up temp files
        os.remove(temp_png)
        print("🧹 Cleaned up temporary files")

        print("\n🎉 SUCCESS! Icon background has been made transparent!")
        print(f"📁 Original backed up as: {backup_path}")
        print(f"🖼️  Transparent PNG saved as: {transparent_png}")

        return 0

    except Exception as e:
        print(f"❌ Error replacing files: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())