/**
 * 🎨 ICON REPOSITORY
 * 
 * This file contains all the icons, emojis, and images used throughout the application.
 * To customize any icon, simply change the value in this object.
 * 
 * You can use:
 * - Emojis: ✨, 🖼️, 📁, etc.
 * - Unicode symbols: ⚡, ⚙️, 📊, etc.
 * - HTML entities: &#9733;, &#10004;, etc.
 * - SVG icons: '<svg>...</svg>'
 * - Image URLs: 'path/to/image.png'
 * 
 * TIP: For best results, keep icons consistent in style and size.
 */

const ICONS = {
    // ===== MAIN APPLICATION ICONS =====
    APP: {
        SPARKLES: '✨',           // Main app icon, compress button
        FOLDER: '📁',             // File upload, ZIP files
        GEAR: '⚙️',               // Settings
        TERMINAL: '>',            // Console log
    },

    // ===== UPLOAD & FILE ICONS =====
    UPLOAD: {
        UPLOAD: '📤',             // Upload button
        FOLDER: '📁',             // File selected state
        CHANGE_FILE: '🔄',        // Change file button
    },

    // ===== COMPRESSION ICONS =====
    COMPRESSION: {
        START: '✨',              // Start compression button
        PROCESSING: '⚡',         // Processing state
        COMPRESS_ANOTHER: '🔄',   // Compress another ZIP button
        IMAGE: '🖼️',             // Image compression logs
        VIDEO: '🎥',              // Video compression logs
        SUCCESS: '✅',            // Success messages
        WARNING: '⚠️',            // Warning messages
        ERROR: '❌',              // Error messages
        INFO: '📝',               // Info messages
        COMPRESSION_START: '🚀',  // Compression started
        COMPRESSION_PROGRESS: '⚡', // Compression in progress
        COMPRESSION_COMPLETE: '🎉', // Compression completed
    },

    // ===== DOWNLOAD ICONS =====
    DOWNLOAD: {
        DOWNLOAD: '⬇️',          // Download buttons
        READY: '⬇️',             // Download ready button
    },

    // ===== CONSOLE LOG ICONS =====
    CONSOLE: {
        LOG: '📝',                // General log entries
        FILE_SELECTED: '📂',      // File selected log
        JOB_CREATED: '✅',        // Job created successfully
        COMPRESSION_START: '🚀',  // Compression started
        COMPRESSION_PROGRESS: '⚡', // Compression in progress
        COMPRESSION_COMPLETE: '🎉', // Compression completed
        STATS: '📊',              // Statistics and metrics
        CUSTOM_SETTINGS: '⚙️',    // Custom compression settings
        RESET_SETTINGS: '🔄',     // Reset to default settings
        PREVIEW: '👁️',           // Preview button (can be changed to text)
        IMAGE: '🖼️',             // Image compression logs
        VIDEO: '🎥',              // Video compression logs
        UPLOAD: '📤',             // File upload logs
        SUCCESS: '✅',            // Success messages
        WARNING: '⚠️',            // Warning messages
        ERROR: '❌',              // Error messages
        INFO: 'ℹ️',               // Info messages
        LOADING: '⏳',             // Loading state
        DOWNLOAD: '⬇️',           // Download logs
    },

    // ===== PROGRESS CARD ICONS =====
    PROGRESS: {
        DEFAULT: '📁',            // Default progress icon
        PROCESSING: '⚡',         // Processing state
        COMPLETE: '✅',           // Completion state
    },

    // ===== SETTINGS ICONS =====
    SETTINGS: {
        IMAGE: '🖼️',             // Image compression settings
        VIDEO: '🎥',              // Video compression settings
        GEAR: '⚙️',               // General settings
    },

    // ===== PREVIEW MODAL ICONS =====
    PREVIEW: {
        CLOSE: '×',               // Close button
        APPLY: '✅',              // Apply settings button
        RESET: '🔄',              // Reset settings button
        ORIGINAL: '📷',           // Original image label
        COMPRESSED: '🗜️',        // Compressed image label
    },

    // ===== RECOMPRESS PROMPT ICONS =====
    RECOMPRESS: {
        ICON: '🔄',               // Recompress prompt icon
        BUTTON: '🔄',             // Recompress button
    },

    // ===== FOOTER ICONS =====
    FOOTER: {
        LINK: '🔗',               // Footer link icon (if needed)
    },

    // ===== QUALITY & WARNING ICONS =====
    QUALITY: {
        WARNING: '⚠️',            // Quality warnings
        EXCELLENT: '🌟',          // Excellent quality
        GOOD: '👍',               // Good quality
        POOR: '👎',               // Poor quality
    },

    // ===== FILE TYPE ICONS =====
    FILE_TYPES: {
        IMAGE: '🖼️',             // Image files
        VIDEO: '🎥',              // Video files
        ZIP: '📦',                // ZIP files
        UNKNOWN: '📄',            // Unknown file types
    },

    // ===== STATUS ICONS =====
    STATUS: {
        LOADING: '⏳',            // Loading state
        SUCCESS: '✅',            // Success state
        ERROR: '❌',              // Error state
        WARNING: '⚠️',            // Warning state
        INFO: 'ℹ️',               // Info state
        QUESTION: '❓',           // Question state
    }
};

/**
 * 🎯 ICON HELPER FUNCTIONS
 * 
 * Use these functions to get icons with additional functionality
 */

// Get icon with fallback
function getIcon(category, key, fallback = '📝') {
    return ICONS[category]?.[key] || fallback;
}

// Get icon with custom styling
function getStyledIcon(category, key, className = '', fallback = '📝') {
    const icon = getIcon(category, key, fallback);
    return `<span class="icon ${className}">${icon}</span>`;
}

// Get icon with tooltip
function getIconWithTooltip(category, key, tooltip, fallback = '📝') {
    const icon = getIcon(category, key, fallback);
    return `<span class="icon" title="${tooltip}">${icon}</span>`;
}

// Get all icons in a category
function getCategoryIcons(category) {
    return ICONS[category] || {};
}

// Check if an icon exists
function hasIcon(category, key) {
    return !!(ICONS[category]?.[key]);
}

// Add or update an icon
function setIcon(category, key, value) {
    if (!ICONS[category]) {
        ICONS[category] = {};
    }
    ICONS[category][key] = value;
}

// Remove an icon
function removeIcon(category, key) {
    if (ICONS[category]) {
        delete ICONS[category][key];
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ICONS, getIcon, getStyledIcon, getIconWithTooltip, getCategoryIcons, hasIcon, setIcon, removeIcon };
}
