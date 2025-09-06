# 🎨 Icon Customization Guide

This project uses a centralized icon repository that makes it super easy to change all emojis, icons, and images throughout the application.

## 📁 Files

- **`icons.js`** - The main icon repository containing all icons
- **`main.js`** - Updated to use the icon repository
- **`index.html`** - Updated with IDs for dynamic icon loading

## 🚀 Quick Start

### Changing a Single Icon

1. Open `icons.js`
2. Find the icon you want to change in the `ICONS` object
3. Replace the value with your preferred icon

**Example:**
```javascript
// Change the main app icon from sparkles to a rocket
ICONS.APP.SPARKLES = '🚀';

// Change the upload icon from upload to a plus sign
ICONS.UPLOAD.UPLOAD = '➕';
```

### Adding New Icons

1. Add your new icon to the appropriate category in `icons.js`
2. Use the helper functions to access it in your code

**Example:**
```javascript
// Add a new icon to the compression category
ICONS.COMPRESSION.NEW_FEATURE = '🆕';

// Use it in your code
const icon = getIcon('COMPRESSION', 'NEW_FEATURE');
```

## 📋 Available Icon Categories

### 🏠 APP
- `SPARKLES` - Main app icon, compress button
- `FOLDER` - File upload, ZIP files  
- `GEAR` - Settings
- `TERMINAL` - Console log

### 📤 UPLOAD
- `UPLOAD` - Upload button
- `FOLDER` - File selected state
- `CHANGE_FILE` - Change file button

### 🗜️ COMPRESSION
- `START` - Start compression button
- `PROCESSING` - Processing state
- `COMPRESS_ANOTHER` - Compress another ZIP button
- `IMAGE` - Image compression logs
- `VIDEO` - Video compression logs
- `SUCCESS` - Success messages
- `WARNING` - Warning messages
- `ERROR` - Error messages
- `INFO` - Info messages

### ⬇️ DOWNLOAD
- `DOWNLOAD` - Download buttons
- `READY` - Download ready button

### 📝 CONSOAL (Console Log)
- `LOG` - General log entries
- `FILE_SELECTED` - File selected log
- `JOB_CREATED` - Job created successfully
- `COMPRESSION_START` - Compression started
- `COMPRESSION_PROGRESS` - Compression in progress
- `COMPRESSION_COMPLETE` - Compression completed
- `STATS` - Statistics and metrics
- `CUSTOM_SETTINGS` - Custom compression settings
- `RESET_SETTINGS` - Reset to default settings
- `PREVIEW` - Preview button

### 📊 PROGRESS
- `DEFAULT` - Default progress icon
- `PROCESSING` - Processing state
- `COMPLETE` - Completion state

### ⚙️ SETTINGS
- `IMAGE` - Image compression settings
- `VIDEO` - Video compression settings
- `GEAR` - General settings

### 👁️ PREVIEW
- `CLOSE` - Close button
- `APPLY` - Apply settings button
- `RESET` - Reset settings button
- `ORIGINAL` - Original image label
- `COMPRESSED` - Compressed image label

### 🔄 RECOMPRESS
- `ICON` - Recompress prompt icon
- `BUTTON` - Recompress button

### ⚠️ QUALITY
- `WARNING` - Quality warnings
- `EXCELLENT` - Excellent quality
- `GOOD` - Good quality
- `POOR` - Poor quality

### 📄 FILE_TYPES
- `IMAGE` - Image files
- `VIDEO` - Video files
- `ZIP` - ZIP files
- `UNKNOWN` - Unknown file types

### 📊 STATUS
- `LOADING` - Loading state
- `SUCCESS` - Success state
- `ERROR` - Error state
- `WARNING` - Warning state
- `INFO` - Info state
- `QUESTION` - Question state

## 🛠️ Helper Functions

### `getIcon(category, key, fallback)`
Get an icon from the repository with a fallback option.

```javascript
const icon = getIcon('COMPRESSION', 'START', '❓');
```

### `getStyledIcon(category, key, className, fallback)`
Get an icon with custom CSS styling.

```javascript
const styledIcon = getStyledIcon('COMPRESSION', 'START', 'my-custom-class');
```

### `getIconWithTooltip(category, key, tooltip, fallback)`
Get an icon with a tooltip.

```javascript
const iconWithTooltip = getIconWithTooltip('COMPRESSION', 'START', 'Start compression');
```

### `setIcon(category, key, value)`
Add or update an icon in the repository.

```javascript
setIcon('COMPRESSION', 'NEW_FEATURE', '🆕');
```

### `removeIcon(category, key)`
Remove an icon from the repository.

```javascript
removeIcon('COMPRESSION', 'OLD_FEATURE');
```

## 🎨 Icon Types You Can Use

### Emojis
```javascript
ICONS.APP.SPARKLES = '✨';
ICONS.COMPRESSION.SUCCESS = '✅';
```

### Unicode Symbols
```javascript
ICONS.APP.TERMINAL = '>';
ICONS.PREVIEW.CLOSE = '×';
```

### HTML Entities
```javascript
ICONS.STATUS.SUCCESS = '&#10004;';
ICONS.STATUS.ERROR = '&#10008;';
```

### SVG Icons
```javascript
ICONS.APP.SPARKLES = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
```

### Image URLs
```javascript
ICONS.APP.SPARKLES = 'images/sparkles.png';
```

## 🔄 Updating Icons Dynamically

Icons are automatically loaded when the page loads. To update icons after the page has loaded, you can:

1. **Update the repository:**
```javascript
setIcon('COMPRESSION', 'START', '🚀');
```

2. **Re-initialize icons:**
```javascript
initializeIcons();
```

## 💡 Tips

- **Consistency**: Keep icons consistent in style and size
- **Accessibility**: Consider using descriptive alt text for screen readers
- **Performance**: Emojis and Unicode symbols load faster than images
- **Fallbacks**: Always provide fallback icons for better user experience
- **Testing**: Test your icon changes across different browsers and devices

## 🐛 Troubleshooting

### Icons Not Showing
- Check that `icons.js` is loaded before `main.js`
- Verify the icon key exists in the repository
- Check browser console for JavaScript errors

### Icons Not Updating
- Make sure you're calling `initializeIcons()` after updating the repository
- Check that the HTML element has the correct ID

### Custom Icons Not Working
- Ensure your custom icon format is supported (emoji, unicode, HTML, SVG, or image URL)
- Test with a simple emoji first to verify the system is working

## 📝 Example: Complete Icon Theme Change

Here's how to change the entire app to use a space theme:

```javascript
// Update icons.js
ICONS.APP.SPARKLES = '🚀';
ICONS.UPLOAD.UPLOAD = '🛸';
ICONS.UPLOAD.FOLDER = '📦';
ICONS.COMPRESSION.START = '🚀';
ICONS.COMPRESSION.PROCESSING = '⚡';
ICONS.COMPRESSION.SUCCESS = '🌟';
ICONS.DOWNLOAD.DOWNLOAD = '⬇️';
ICONS.SETTINGS.GEAR = '⚙️';
ICONS.CONSOAL.LOG = '📡';
```

Then refresh the page to see your new space-themed icons!
