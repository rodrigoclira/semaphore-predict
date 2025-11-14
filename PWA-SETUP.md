# PWA Setup Guide - Semaphore Tracker

Your app is now configured as a Progressive Web Application (PWA)! 🎉

## What's Been Added

### 1. Web App Manifest (`manifest.json`)
- Defines app name, colors, and metadata
- Specifies required icons
- Enables "Add to Home Screen" functionality

### 2. Service Worker (`service-worker.js`)
- Enables offline functionality
- Caches app resources for faster loading
- Provides app-like experience

### 3. PWA Meta Tags (in `index.html`)
- iOS-specific meta tags
- Theme colors for mobile browsers
- App icons for different platforms

## Installation on iPhone

### Step 1: Open in Safari
1. Open Safari on your iPhone
2. Navigate to: `https://rodrigoclira.github.io/semaphore-predict/`

### Step 2: Add to Home Screen
1. Tap the **Share** button (square with arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Edit the name if desired (default: "Semaphore")
4. Tap **"Add"**

### Step 3: Use as App
- The app icon will appear on your home screen
- Tap to launch in full-screen mode (no Safari UI)
- Works offline after first visit
- Data syncs when online

## Features Now Available

✅ **Offline Access**
- App works without internet (after initial load)
- View cached semaphores and predictions

✅ **Install on Home Screen**
- Looks and feels like a native app
- No browser chrome/UI

✅ **Fast Loading**
- Cached resources load instantly
- Better performance

✅ **Auto-Updates**
- Service worker checks for updates
- Prompts to reload when new version available

## Next Steps: Add Icons

### Required for Full PWA Experience

The app needs icons in the `icons/` folder. See `icons/README.md` for details.

**Quick option:**
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 PNG with your design
3. Download and place in `icons/` folder
4. Commit and push to GitHub

**Simple Design Idea:**
- Purple gradient background (#667eea to #764ba2)
- Traffic light emoji 🚦 or icon
- Circular or rounded square shape

## Testing PWA Features

### Test Offline Mode:
1. Install app on iPhone
2. Open the app
3. Enable Airplane Mode
4. App should still work (viewing cached data)

### Test Service Worker:
1. Open browser DevTools (desktop)
2. Go to Application → Service Workers
3. Should see "Active" service worker

### Test Manifest:
1. DevTools → Application → Manifest
2. Check that all settings are correct

## Troubleshooting

### App Not Installing on iPhone
- Make sure you're using Safari (not Chrome)
- Clear Safari cache and try again
- Check that manifest.json is accessible

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS (GitHub Pages provides this)
- Try hard refresh (Cmd+Shift+R)

### Icons Not Showing
- Generate and add icons to `icons/` folder
- Make sure filenames match manifest.json
- Clear cache and reinstall

## Browser Support

✅ **iOS Safari** (11+) - Full support
✅ **Chrome Android** - Full support
✅ **Samsung Internet** - Full support
✅ **Edge Mobile** - Full support
⚠️ **Chrome Desktop** - Partial (install available)
⚠️ **Firefox** - Partial (no install prompt)

## Performance Tips

1. **First Visit**: App downloads and caches resources
2. **Subsequent Visits**: Lightning fast (loads from cache)
3. **Offline**: Can view cached data, new records saved when online
4. **Updates**: Automatic when new version deployed

## Advanced Features (Available)

The service worker includes hooks for:
- Background sync (offline data submission)
- Push notifications (semaphore state alerts)
- Advanced caching strategies

These can be enabled in future updates!

## Success Metrics

After installation, you should see:
- App icon on home screen with semaphore design
- Full-screen launch (no Safari UI)
- Fast loading times
- Works offline
- Data persists across sessions

Enjoy your installable Semaphore Tracker app! 🚦📱
