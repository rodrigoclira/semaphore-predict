# 🚦 Semaphore State Tracker

A mobile-first web app to track traffic light (semaphore) states and predict their current status based on timing patterns.

## Features

✅ **Progressive Web App** - Install on your iPhone/Android like a native app
✅ **Offline Support** - Works without internet after first visit
✅ **Multiple Semaphores** - Track different traffic lights separately
✅ **State Prediction** - Predicts current state based on historical patterns
✅ **Dashboard View** - See all semaphores at once for route planning
✅ **Geolocation** - Automatically captures semaphore locations (optional)
✅ **History Tracking** - View complete state change history
✅ **Mobile Optimized** - Designed for smartphone use
✅ **Cloud Sync** - Data accessible anywhere via Supabase
✅ **Reset History** - Update timing patterns when they change

## How It Works

1. **Create a semaphore** - Give it a name (e.g., "Main St & 5th Ave")
2. **Record states** - Click "Now is OPEN" or "Now is CLOSED" when you see it
3. **Get predictions** - After a few cycles, the app predicts the current state
4. **View history** - See all your recorded state changes

The app calculates average open/closed durations and predicts the current state based on when you last recorded it.

## Setup

### 1. Database Setup

1. Go to your Supabase project: https://ymwxkasxjebrtlnjipaj.supabase.co
2. Navigate to **SQL Editor**
3. Run the SQL from `database-setup.sql`

### 2. Deploy to GitHub Pages

#### Option A: Using GitHub Web Interface

1. Go to your repository settings
2. Navigate to **Pages** (under "Code and automation")
3. Under **Source**, select:
   - Branch: `claude/semaphore-state-tracker-01TLF9mKwkhpUfrWeWjHMwLc`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your app will be available at: `https://rodrigoclira.github.io/semaphore-predict/`

#### Option B: Using Command Line

```bash
# Push changes to GitHub
git push -u origin claude/semaphore-state-tracker-01TLF9mKwkhpUfrWeWjHMwLc

# Enable GitHub Pages (requires gh CLI)
gh repo edit --enable-pages --pages-branch=claude/semaphore-state-tracker-01TLF9mKwkhpUfrWeWjHMwLc --pages-path=/
```

### 3. Install as PWA (Progressive Web App)

The app can be installed on your smartphone like a native app!

**📱 iPhone Installation:**
1. Open Safari and visit: `https://rodrigoclira.github.io/semaphore-predict/`
2. Tap the **Share** button
3. Select **"Add to Home Screen"**
4. Tap **"Add"**

**📱 Android Installation:**
1. Open Chrome and visit the app
2. Tap **Menu** (⋮)
3. Select **"Add to Home Screen"** or **"Install App"**

**Benefits:**
- ✅ Launches in full-screen (no browser UI)
- ✅ App icon on home screen
- ✅ Works offline
- ✅ Faster loading with caching
- ✅ Auto-updates when new version available

See [PWA-SETUP.md](PWA-SETUP.md) for detailed installation guide and troubleshooting.

### 4. Generate App Icons (Optional but Recommended)

For the best PWA experience, generate app icons:
1. See `icons/README.md` for instructions
2. Convert the included `icons/icon-template.svg`
3. Or use https://www.pwabuilder.com/imageGenerator

## Usage on Smartphone

1. **First time**: Create a new semaphore with a descriptive name
2. **At the semaphore**: Open the app and select your semaphore
3. **Record state**: Tap the big green or red button matching what you see
4. **Get predictions**: After recording a few cycles, the app will predict the current state

### Geolocation

- The app automatically captures your location when recording states
- This is **optional** - the app works without location permission
- If granted, you'll see a 📍 icon that links to Google Maps

## Files

- `index.html` - Main HTML structure with PWA meta tags
- `style.css` - Mobile-first responsive styles
- `app.js` - Core logic and Supabase integration
- `service-worker.js` - PWA offline support and caching
- `manifest.json` - Web app manifest for installation
- `database-setup.sql` - Database schema and setup
- `icons/` - App icons for different platforms
- `PWA-SETUP.md` - Detailed PWA installation guide

## Technical Details

**Frontend**: Vanilla JavaScript, HTML5, CSS3
**Database**: Supabase (PostgreSQL)
**Hosting**: GitHub Pages
**PWA**: Service Worker, Web App Manifest, Offline Support
**Location**: Browser Geolocation API
**Caching**: Service Worker with cache-first strategy

## Database Schema

```sql
semaphores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  current_state TEXT CHECK (open/closed),
  timestamp TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ
)
```

## Privacy

- This is a personal project - only you use it
- Location data is optional and only stored when granted
- All data is stored in your personal Supabase database
- No third-party tracking or analytics

## Future Enhancements

- [ ] Add authentication for multi-user support
- [ ] Export data to CSV
- [ ] Push notifications for predicted state changes
- [ ] Dark mode
- [ ] Offline support with service workers

## License

MIT - Feel free to modify and use as you wish!
