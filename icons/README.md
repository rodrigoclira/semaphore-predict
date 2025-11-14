# App Icons for PWA

This folder contains the app icons needed for the Progressive Web Application.

## Required Icon Sizes

The following icon sizes are needed:
- 72x72 (icon-72x72.png)
- 96x96 (icon-96x96.png)
- 128x128 (icon-128x128.png)
- 144x144 (icon-144x144.png)
- 152x152 (icon-152x152.png) - Apple Touch Icon
- 192x192 (icon-192x192.png) - Android/Chrome
- 384x384 (icon-384x384.png)
- 512x512 (icon-512x512.png) - Splash screen

## How to Generate Icons

### Option 1: Online Icon Generator (Easiest)

1. Create a 512x512 PNG icon with your design
2. Visit: https://www.pwabuilder.com/imageGenerator
3. Upload your 512x512 icon
4. Download the generated icon pack
5. Place the icons in this folder

### Option 2: Use Favicon Generator

1. Create a high-resolution icon (at least 512x512)
2. Visit: https://realfavicongenerator.net/
3. Upload your icon
4. Select "Generate icons for Web, Android, Microsoft, and iOS"
5. Download and extract to this folder

### Option 3: Manual Creation

Use an image editor (Photoshop, GIMP, Figma) to create each size manually.

## Icon Design Tips

For the Semaphore Tracker app, consider:
- **Background**: Purple gradient (#667eea to #764ba2)
- **Icon**: Traffic light emoji 🚦 or stylized semaphore
- **Safe zone**: Keep important elements within 80% of canvas
- **Format**: PNG with transparency or solid background
- **Colors**: Match app theme (purple/blue)

## Simple Icon Idea

A simple design could be:
- Circular background with gradient
- White traffic light icon in center
- App name "Semaphore" below (optional)

## Current Status

⚠️ **Icons need to be generated and placed in this folder**

The app will work without icons, but they are required for:
- Proper installation on iOS/Android
- App icon on home screen
- Splash screen
- Better user experience

## Quick Start: Convert the Template

A template SVG (`icon-template.svg`) is included in this folder!

### Convert SVG to PNG Icons:

**Option A: Online Converter**
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload `icon-template.svg`
3. Download all generated sizes
4. Place in this folder

**Option B: Manual Conversion**
1. Open `icon-template.svg` in browser
2. Use a tool like:
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
3. Convert to 512x512 first
4. Use that to generate all other sizes at https://www.pwabuilder.com/imageGenerator

**Option C: Command Line (if you have ImageMagick)**
```bash
# Convert SVG to all required sizes
for size in 72 96 128 144 152 192 384 512; do
  convert icon-template.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Customize the Icon

Edit `icon-template.svg` to customize:
- Change colors in the gradient
- Modify traffic light design
- Change or remove text
- Adjust roundness (rx value in rect)
