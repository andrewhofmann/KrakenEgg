#!/usr/bin/env python3
"""
Advanced icon shadow fix - removes all white/gray borders and shadows
"""

import os
import sys
from PIL import Image, ImageFilter
import subprocess

def create_clean_transparent_icon(input_path, output_path):
    """Create a cleaner transparent icon with no shadow artifacts"""
    try:
        # Open the image
        img = Image.open(input_path)

        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Get image data
        data = img.getdata()

        # Create new image data with more aggressive transparency
        new_data = []

        for item in data:
            r, g, b = item[:3]
            alpha = item[3] if len(item) == 4 else 255

            # Calculate luminance to detect gray/white areas
            luminance = 0.299 * r + 0.587 * g + 0.114 * b

            # More aggressive transparency rules:
            # 1. Remove pure white and near-white pixels
            # 2. Remove light gray pixels (common in shadows)
            # 3. Reduce alpha for semi-transparent light pixels

            if (r >= 250 and g >= 250 and b >= 250) or luminance >= 240:
                # Very light pixels - make fully transparent
                new_data.append((r, g, b, 0))
            elif luminance >= 200 and alpha < 255:
                # Light semi-transparent pixels - make fully transparent
                new_data.append((r, g, b, 0))
            elif luminance >= 180:
                # Medium-light pixels - reduce alpha significantly
                new_alpha = max(0, alpha - 100)
                new_data.append((r, g, b, new_alpha))
            else:
                # Keep darker pixels as-is
                new_data.append((r, g, b, alpha))

        # Update image data
        img.putdata(new_data)

        # Apply a slight blur to smooth any remaining edge artifacts
        # Convert to ensure we maintain alpha
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

        # Save as PNG with transparency
        img.save(output_path, 'PNG', optimize=True)
        print(f"✅ Created clean transparent PNG: {output_path}")
        return True

    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return False

def create_icns_with_iconutil(png_path, icns_path):
    """Create ICNS using iconutil for better quality"""
    try:
        # Create iconset directory
        iconset_dir = png_path.replace('.png', '.iconset')
        os.makedirs(iconset_dir, exist_ok=True)

        # Generate all required sizes using sips
        sizes = [
            (16, 'icon_16x16.png'),
            (32, 'icon_16x16@2x.png'),
            (32, 'icon_32x32.png'),
            (64, 'icon_32x32@2x.png'),
            (128, 'icon_128x128.png'),
            (256, 'icon_128x128@2x.png'),
            (256, 'icon_256x256.png'),
            (512, 'icon_256x256@2x.png'),
            (512, 'icon_512x512.png'),
            (1024, 'icon_512x512@2x.png')
        ]

        for size, filename in sizes:
            output_path = os.path.join(iconset_dir, filename)
            subprocess.run([
                'sips', '-z', str(size), str(size),
                png_path, '--out', output_path
            ], check=True, capture_output=True)

        # Create ICNS from iconset
        subprocess.run([
            'iconutil', '-c', 'icns', iconset_dir, '-o', icns_path
        ], check=True, capture_output=True)

        # Clean up iconset directory
        import shutil
        shutil.rmtree(iconset_dir)

        return True

    except subprocess.CalledProcessError as e:
        print(f"Error creating ICNS with iconutil: {e}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Input and output paths
    input_png = os.path.join(script_dir, 'SquidAppIcon_Glass_transparent.png')
    clean_png = os.path.join(script_dir, 'SquidAppIcon_Glass_clean.png')
    clean_icns = os.path.join(script_dir, 'SquidAppIcon_Glass_clean.icns')
    target_icns = os.path.join(script_dir, 'SquidAppIcon_Glass_transparent.icns')

    print("🎨 Creating ultra-clean transparent icon...")

    # Step 1: Create clean transparent PNG
    print("🧹 Removing all shadow artifacts...")
    if not create_clean_transparent_icon(input_png, clean_png):
        print("❌ Failed to create clean PNG")
        return 1

    # Step 2: Create high-quality ICNS
    print("📦 Creating high-quality ICNS...")
    if not create_icns_with_iconutil(clean_png, clean_icns):
        print("⚠️  iconutil failed, falling back to sips...")
        # Fallback to sips
        try:
            subprocess.run([
                'sips', '-s', 'format', 'icns',
                clean_png, '--out', clean_icns
            ], check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Both iconutil and sips failed: {e}")
            return 1

    # Step 3: Replace the transparent ICNS
    print("🔄 Replacing transparent ICNS...")
    try:
        if os.path.exists(target_icns):
            backup_path = os.path.join(script_dir, 'SquidAppIcon_Glass_transparent_backup.icns')
            if not os.path.exists(backup_path):
                os.rename(target_icns, backup_path)
                print(f"📋 Backed up original to: {backup_path}")

        os.rename(clean_icns, target_icns)
        print(f"✅ Replaced with ultra-clean version")

        print("\n🎉 SUCCESS! Icon shadow artifacts should now be eliminated!")
        print(f"🖼️  Clean PNG saved as: {clean_png}")

        return 0

    except Exception as e:
        print(f"❌ Error replacing files: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())