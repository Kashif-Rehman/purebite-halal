#!/usr/bin/env python3
"""
Prepare screenshots for Google Play Store with AI enhancements
- Resizes to 1080x1920 (standard phone size)
- Adds professional captions with styling
- Enhances visuals with gradients, overlays, and branding
- Adds app icon and visual elements for better engagement
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
from pathlib import Path

# Configuration
SOURCE_DIR = 'src/photos'
OUTPUT_DIR = 'store-assets/screenshots'
ICON_PATH = 'public/assets/icon.png'
PLAYSTORE_WIDTH = 1080
PLAYSTORE_HEIGHT = 1920
PRIMARY_COLOR = '#10b981'  # App primary green
ACCENT_COLOR = '#059669'   # Darker green
LIGHT_BG = '#ecfdf5'       # Light green

# Create output directory
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

# List of screenshots to process (in order for Play Store)
# Format: (filename, caption, position, emoji)
SCREENSHOTS = [
    ('Screenshot_2026-02-16-21-28-04-970_com.halalfoodchecker.app.jpg', 'Search & Scan\nFind Halal Products', 'top', '🔍'),
    ('Screenshot_2026-02-16-21-26-12-097_com.halalfoodchecker.app.jpg', 'Instant Halal\nAnalysis', 'top', '✅'),
    ('Screenshot_2026-02-16-22-01-12-818_com.halalfoodchecker.app.jpg', 'E-Codes Reference\nMake Informed Choices', 'top', '📚'),
    ('Screenshot_2026-02-16-22-00-58-251_com.halalfoodchecker.app.jpg', 'Comprehensive\nProduct Details', 'top', '📊'),
    ('Screenshot_2026-02-16-21-28-09-596_com.halalfoodchecker.app.jpg', '28 Languages\nGlobal Support', 'top', '🌍'),
    ('Screenshot_2026-02-16-21-24-26-343_com.halalfoodchecker.app.jpg', 'Quick Barcode\nScanning', 'bottom', '📱'),
]

def resize_and_pad(image_path, width, height, bg_color='#10b981'):
    """
    Resize image to fit Play Store dimensions while maintaining aspect ratio
    Apply color enhancement and contrast improvement
    """
    try:
        img = Image.open(image_path)
        
        # Enhance image - increase vibrancy and contrast
        from PIL import ImageEnhance
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.15)
        
        # Increase brightness slightly
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.05)
        
        # Increase color saturation
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.1)
        
        # Calculate aspect ratios
        img_aspect = img.width / img.height
        target_aspect = width / height
        
        # Calculate new dimensions to maintain aspect ratio
        if img_aspect > target_aspect:
            # Image is wider, fit to width
            new_width = width
            new_height = int(width / img_aspect)
        else:
            # Image is taller, fit to height
            new_height = height
            new_width = int(height * img_aspect)
        
        # Resize image
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create new image with background
        bg = Image.new('RGB', (width, height), bg_color)
        
        # Calculate position to center the image
        x = (width - new_width) // 2
        y = (height - new_height) // 2
        
        # Paste resized image onto background
        bg.paste(img, (x, y))
        
        return bg
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def add_gradient_overlay(image, color1, color2, alpha=80):
    """
    Add a subtle gradient overlay to enhance visuals
    """
    try:
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Convert hex to RGB
        r1, g1, b1 = int(color1[1:3], 16), int(color1[3:5], 16), int(color1[5:7], 16)
        r2, g2, b2 = int(color2[1:3], 16), int(color2[3:5], 16), int(color2[5:7], 16)
        
        # Create gradient from top to bottom
        for y in range(image.height):
            ratio = y / image.height
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            draw.line([(0, y), (image.width, y)], fill=(r, g, b, alpha))
        
        return Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
    except Exception as e:
        print(f"Error adding gradient: {e}")
        return image

def add_app_icon(image, icon_path, size=200, position='top-right'):
    """
    Add app icon to the screenshot for branding
    """
    try:
        if not os.path.exists(icon_path):
            return image
        
        icon = Image.open(icon_path)
        
        # Resize icon
        icon = icon.resize((size, size), Image.Resampling.LANCZOS)
        
        # Add semi-transparent background circle
        icon_bg = Image.new('RGBA', (size + 20, size + 20), (0, 0, 0, 0))
        draw = ImageDraw.Draw(icon_bg)
        draw.ellipse([0, 0, size + 20, size + 20], fill=(255, 255, 255, 200))
        
        # Paste icon on background
        icon_bg.paste(icon, (10, 10), icon if icon.mode == 'RGBA' else None)
        
        # Calculate position
        padding = 20
        if position == 'top-right':
            x = image.width - size - 20 - padding
            y = padding
        elif position == 'top-left':
            x = padding
            y = padding
        elif position == 'bottom-right':
            x = image.width - size - 20 - padding
            y = image.height - size - 20 - padding
        else:
            x = padding
            y = image.height - size - 20 - padding
        
        # Paste on main image
        result = image.convert('RGBA')
        result.paste(icon_bg, (x, y), icon_bg)
        return result.convert('RGB')
    except Exception as e:
        print(f"Error adding icon: {e}")
        return image

def add_caption(image, caption, position='top', icon_emoji=''):
    """
    Add professional caption with enhanced styling and optional emoji
    """
    try:
        # Create image with alpha for better text rendering
        bg_with_alpha = image.convert('RGBA')
        
        # Try to use a nice font, fallback to default
        try:
            # Font size based on image height
            font_size = int(image.height * 0.07)
            font = ImageFont.truetype("arial.ttf", font_size)
            font_bold = ImageFont.truetype("arialbd.ttf", font_size)
        except:
            font = ImageFont.load_default()
            font_bold = font
        
        # Create overlay for text
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        # Text color - white for contrast
        text_color = (255, 255, 255, 255)
        
        # Build caption with emoji
        full_caption = f"{icon_emoji}\n{caption}" if icon_emoji else caption
        
        # Get text bounding box for centering and sizing
        bbox = overlay_draw.textbbox((0, 0), full_caption, font=font_bold)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Position with more padding
        if position == 'top':
            x = (image.width - text_width) // 2
            y = int(image.height * 0.08)
        else:  # bottom
            x = (image.width - text_width) // 2
            y = int(image.height * 0.75)
        
        # Add semi-transparent background box
        padding = 30
        box_coords = [
            x - padding, 
            y - padding // 2, 
            x + text_width + padding, 
            y + text_height + padding // 2
        ]
        
        # Draw rounded-rectangle effect with gradient background
        overlay_draw.rectangle(box_coords, fill=(16, 185, 129, 220), outline=(255, 255, 255, 150), width=3)
        
        # Apply overlay
        bg_with_alpha = Image.alpha_composite(bg_with_alpha, overlay)
        
        # Draw text with shadow
        text_draw = ImageDraw.Draw(bg_with_alpha)
        
        # Shadow text
        shadow_offset = 2
        text_draw.text(
            (x + shadow_offset, y + shadow_offset), 
            full_caption, 
            fill=(0, 0, 0, 200), 
            font=font_bold
        )
        
        # Main text
        text_draw.text(
            (x, y), 
            full_caption, 
            fill=text_color, 
            font=font_bold
        )
        
        return bg_with_alpha.convert('RGB')
    except Exception as e:
        print(f"Error adding caption: {e}")
        return image

def process_screenshots():
    """Process all screenshots"""
    print("📱 Preparing screenshots for Google Play Store...")
    print(f"Target size: {PLAYSTORE_WIDTH}×{PLAYSTORE_HEIGHT}")
    print("✨ Applying AI enhancements:")
    print("   • Enhanced contrast & colors")
    print("   • Gradient overlays")
    print("   • App icon branding")
    print("   • Professional captions with emojis")
    print()
    
    processed = 0
    
    for i, (filename, caption, position, emoji) in enumerate(SCREENSHOTS, 1):
        source_path = os.path.join(SOURCE_DIR, filename)
        
        if not os.path.exists(source_path):
            print(f"⚠️  {i}. {filename} - NOT FOUND")
            continue
        
        # Resize and pad with color enhancement
        result = resize_and_pad(source_path, PLAYSTORE_WIDTH, PLAYSTORE_HEIGHT, PRIMARY_COLOR)
        
        if result is None:
            print(f"❌ {i}. {filename} - FAILED")
            continue
        
        # Add gradient overlay for enhanced visual appeal
        result = add_gradient_overlay(result, PRIMARY_COLOR, ACCENT_COLOR, alpha=40)
        
        # Add app icon for branding
        icon_position = 'top-right' if position == 'top' else 'bottom-right'
        result = add_app_icon(result, ICON_PATH, size=150, position=icon_position)
        
        # Add caption with professional styling and emoji
        result = add_caption(result, caption, position=position, icon_emoji=emoji)
        
        # Save
        # Extract first line of caption for filename
        caption_filename = caption.split('\n')[0].replace(' ', '_').lower()
        output_filename = f"{i:02d}_{caption_filename}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        result.save(output_path, 'PNG', quality=95, optimize=True)
        
        print(f"✅ {i}. {output_filename} ({PLAYSTORE_WIDTH}×{PLAYSTORE_HEIGHT})")
        processed += 1
    
    print()
    print(f"✨ Processed {processed}/{len(SCREENSHOTS)} screenshots")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()
    print("📋 Play Store Requirements:")
    print("   • Minimum 2 screenshots")
    print("   • Maximum 8 screenshots")
    print("   • Recommended: 4-6 screenshots")
    print("   • Files must be PNG or JPEG")
    print("   • Dimensions: 1080×1920 or 720×1280")
    print()
    print("✨ Your screenshots are ready for upload!")

if __name__ == "__main__":
    process_screenshots()
