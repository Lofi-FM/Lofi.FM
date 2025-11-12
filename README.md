# 🎵 Lofi FM

A soothing, chill Lofi FM radio with rain and vinyl layers. A zero-build Progressive Web App (PWA) that streams live lofi music with ambient sound effects.

## ✨ Features

- 🎵 **Live Lofi Radio Stream** - Continuous lofi music streaming
- 🌧️ **Rain Sound Effects** - Toggleable rain ambience overlay
- 🎛️ **Vinyl Crackle** - Authentic vinyl record crackle effects
- 🎚️ **Individual Volume Controls** - Separate sliders for main, rain, and vinyl
- 📱 **Progressive Web App** - Installable on mobile devices
- 🎧 **Media Session Integration** - Shows track info in system media controls
- 🔄 **Real-time Metadata** - Displays current track information
- 📱 **Mobile Optimized** - Responsive design for all devices

## 🚀 Quick Start

### Option 1: Python HTTP Server (Recommended)

```bash
# Navigate to the project directory
cd /path/to/Lofi.FM

# Start the server (try different ports if 8000 is busy)
python3 -m http.server 8000

# If port 8000 is busy, try:
python3 -m http.server 8001
# or
python3 -m http.server 3000
```

Then open your browser and go to:
- **http://localhost:8000** (or whatever port you used)

### Option 2: Node.js HTTP Server

If you have Node.js installed:

```bash
# Install a simple HTTP server globally
npm install -g http-server

# Navigate to the project directory
cd /path/to/Lofi.FM

# Start the server
http-server -p 8000

# If port 8000 is busy, try:
http-server -p 8001
```

### Option 3: PHP Built-in Server

If you have PHP installed:

```bash
# Navigate to the project directory
cd /path/to/Lofi.FM

# Start the server
php -S localhost:8000

# If port 8000 is busy, try:
php -S localhost:8001
```

## 🎮 How to Use

1. **Start the Radio**: Click the "Play" button to begin streaming lofi music
2. **Add Ambience**: Toggle "Rain" and "Vinyl" buttons to add atmospheric layers
3. **Control Volume**: Use the sliders to adjust:
   - **Main**: Radio stream volume
   - **Rain**: Rain sound effects volume
   - **Vinyl**: Vinyl crackle volume
4. **Install as App**: Click "Install App" (if available) to add to your device

## 📱 PWA Installation

This app can be installed as a native app on your device:

### Desktop (Chrome/Edge)
- Look for the install icon in the address bar
- Click it to install the app

### Mobile (iOS/Android)
- Open in Safari (iOS) or Chrome (Android)
- Tap the share button
- Select "Add to Home Screen"

## 🛠️ Development

This is a zero-build application - no compilation or build process required. All files are served as static assets.

### Project Structure

```
Lofi.FM/
├── index.html          # Main HTML file
├── app.js             # JavaScript application logic
├── styles.css         # Additional styles
├── sw.js              # Service worker for PWA
├── manifest.webmanifest # PWA manifest
└── assets/
    ├── icon-192.png   # App icon (192x192)
    ├── icon-512.png   # App icon (512x512)
    ├── icon-HD.png    # High-res app icon
    ├── rain.wav       # Rain sound effect
    └── vinyl.wav      # Vinyl crackle sound
```

### Key Components

- **Audio Context**: Web Audio API for mixing multiple audio sources
- **Service Worker**: Enables offline functionality and PWA features
- **EventSource**: Real-time metadata updates from the radio stream
- **Media Session**: Integration with system media controls

## 🔧 Troubleshooting

### Port Already in Use
If you get "Address already in use" error:

```bash
# Find what's using the port
lsof -ti:8000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
python3 -m http.server 8001
```

### Audio Not Playing
- Make sure to click "Play" first (autoplay policies require user interaction)
- Check your browser's audio permissions
- Try refreshing the page

### Stream Issues
- The app streams from a live radio source
- If the stream is down, the app will show an error status
- Try refreshing the page to reconnect

## 🌐 Browser Support

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📄 License

This project is open source. Feel free to use and modify as needed.

## 🤝 Contributing

This is a simple static web app. To contribute:
1. Fork the repository
2. Make your changes
3. Test locally using one of the server methods above
4. Submit a pull request

---

**Enjoy your lofi vibes! 🎧✨**
