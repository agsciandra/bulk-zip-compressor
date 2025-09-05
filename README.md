# Bulk Zip Compressor

A browser-based tool that allows users to upload a .zip file, compress images and videos inside according to user-defined size limits, and download a new compressed .zip file. All processing happens client-side in the browser.

## Features

- **File Input**: Drag-and-drop zone and file picker for .zip files
- **Image Compression**: Compresses PNG, JPG, JPEG, and WebP images to user-defined size limits
- **Video Compression**: Compresses MP4, MOV, and WebM videos using FFmpeg.wasm
- **Real-time Progress**: Visual progress bar with current file being processed
- **Debug Console**: Real-time logging with colored entries for different log types
- **Modern UI**: Clean, card-based design with smooth animations

## Supported Formats

- **Images**: PNG, JPG, JPEG, WebP
- **Videos**: MP4, MOV, WebM
- **Other files**: Passed through unchanged

## Usage

1. Open `index.html` in a modern web browser
2. Drag and drop a .zip file or click "Choose File"
3. Adjust compression settings for images and videos
4. Click "Start Compression" to begin processing
5. Monitor progress in the debug console
6. Download the compressed .zip file when complete

## Technical Details

- **Client-side only**: No server required, all processing happens in the browser
- **Libraries used**:
  - JSZip for zip file handling
  - browser-image-compression for image compression
  - FFmpeg.wasm for video compression
- **Error handling**: Graceful handling of compression failures with fallback to original files
- **MacOS compatibility**: Automatically skips .DS_Store and __MACOSX files

## Browser Requirements

- Modern browser with WebAssembly support
- JavaScript enabled
- Sufficient memory for processing large files

## File Structure

```
bulk-zip-compressor/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── main.js            # JavaScript functionality
└── README.md          # This file
```

## Development

To run locally, simply open `index.html` in a web browser. No build process or server setup required.

## License

This project is open source and available under the MIT License.
