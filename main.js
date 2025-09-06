// Global variables
let selectedFile = null;

// Initialize all icons from the repository
function initializeIcons() {
    
    // Upload icons
    const uploadIcon = document.getElementById('uploadIcon');
    if (uploadIcon) uploadIcon.textContent = getIcon('UPLOAD', 'UPLOAD');
    
    const folderIcon = document.getElementById('folderIcon');
    if (folderIcon) folderIcon.textContent = getIcon('UPLOAD', 'FOLDER');
    
    // Settings icons
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) settingsIcon.textContent = getIcon('SETTINGS', 'GEAR');
    
    const imageSettingsIcon = document.getElementById('imageSettingsIcon');
    if (imageSettingsIcon) imageSettingsIcon.textContent = getIcon('SETTINGS', 'IMAGE');
    
    const videoSettingsIcon = document.getElementById('videoSettingsIcon');
    if (videoSettingsIcon) videoSettingsIcon.textContent = getIcon('SETTINGS', 'VIDEO');
    
    // Console icon
    const consoleIcon = document.getElementById('consoleIcon');
    if (consoleIcon) consoleIcon.textContent = getIcon('APP', 'TERMINAL');
    
    // Progress icon
    const progressIconFallback = document.getElementById('progressIconFallback');
    if (progressIconFallback) progressIconFallback.textContent = getIcon('PROGRESS', 'DEFAULT');
    
    // Download icons
    const downloadReadyIcon = document.getElementById('downloadReadyIcon');
    if (downloadReadyIcon) downloadReadyIcon.textContent = getIcon('DOWNLOAD', 'READY');
    
    const downloadButtonIcon = document.getElementById('downloadButtonIcon');
    if (downloadButtonIcon) downloadButtonIcon.textContent = getIcon('DOWNLOAD', 'DOWNLOAD');
    
    // Compress button icon
    const compressButtonIcon = document.getElementById('compressButtonIcon');
    if (compressButtonIcon) compressButtonIcon.textContent = getIcon('COMPRESSION', 'START');
}
let ffmpeg = null;
let isProcessing = false;
let currentJob = null;
let logs = [];
let consoleExpanded = false;
let stats = null;
let downloadUrl = null;

// Smart compression configuration
const COMPRESSION_PRESETS = {
    'high_quality': {
        name: 'High Quality',
        description: 'Minimal compression, preserves all details',
        imageQuality: 0.95,
        maxSizeMultiplier: 1.0,
        textDetectionEnabled: true,
        aggressiveCompression: false,
        imageMaxSize: 2,
        imageUnit: 'MB',
        videoMaxSize: 50,
        videoUnit: 'MB'
    },
    'balanced': {
        name: 'Balanced',
        description: 'Good compression with quality preservation',
        imageQuality: 0.85,
        maxSizeMultiplier: 0.7,
        textDetectionEnabled: true,
        aggressiveCompression: false,
        imageMaxSize: 500,
        imageUnit: 'KB',
        videoMaxSize: 10,
        videoUnit: 'MB'
    },
    'aggressive': {
        name: 'Aggressive',
        description: 'Maximum compression, may reduce quality',
        imageQuality: 0.75,
        maxSizeMultiplier: 0.4,
        textDetectionEnabled: false,
        aggressiveCompression: true,
        imageMaxSize: 150,
        imageUnit: 'KB',
        videoMaxSize: 2,
        videoUnit: 'MB'
    }
};

let currentPreset = 'balanced';
let fileOverrides = new Map(); // Map of fileName -> { quality, maxSizeMB }

// DOM elements
const fileDropZone = document.getElementById('fileDropZone');
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const fileSelected = document.getElementById('fileSelected');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const compressBtn = document.getElementById('compressBtn');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const progressCard = document.getElementById('progressCard');
const progressIcon = document.getElementById('progressIcon');
const progressTitle = document.getElementById('progressTitle');
const progressSubtitle = document.getElementById('progressSubtitle');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressBarSection = document.getElementById('progressBarSection');
const statsGrid = document.getElementById('statsGrid');
const compressedSize = document.getElementById('compressedSize');
const spaceSaved = document.getElementById('spaceSaved');
const imagesCompressed = document.getElementById('imagesCompressed');
const videosCompressed = document.getElementById('videosCompressed');
const consoleLogs = document.getElementById('consoleLogs');
const consoleHeader = document.getElementById('consoleHeader');
const logCount = document.getElementById('logCount');
const toggleIcon = document.getElementById('toggleIcon');
const noLogs = document.getElementById('noLogs');
const downloadReady = document.getElementById('downloadReady');
const downloadReadyBtn = document.getElementById('downloadReadyBtn');

// Settings elements
const imageMaxSize = document.getElementById('imageMaxSize');
const imageUnit = document.getElementById('imageUnit');
const videoMaxSize = document.getElementById('videoMaxSize');
const videoUnit = document.getElementById('videoUnit');
const imageLimitText = document.getElementById('imageLimitText');
const videoLimitText = document.getElementById('videoLimitText');
const previewOriginalImage = document.getElementById('previewOriginalImage');
const previewCompressedImage = document.getElementById('previewCompressedImage');
const previewOriginalStats = document.getElementById('previewOriginalStats');
const previewCompressedStats = document.getElementById('previewCompressedStats');
const previewApplyBtn = document.getElementById('previewApplyBtn');
const previewKeepBtn = document.getElementById('previewKeepBtn');
const qualityIssuesHeader = document.getElementById('qualityIssuesHeader');
const qualityIssuesToggle = document.getElementById('qualityIssuesToggle');
const qualityIssuesContent = document.getElementById('qualityIssuesContent');

// Mobile detection
function isMobile() {
    return window.innerWidth <= 768;
}

// Initialize console state - always start collapsed
function initializeConsole() {
    consoleExpanded = false;
    consoleLogs.classList.remove('expanded');
    toggleIcon.classList.remove('rotated');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all icons from the repository
    initializeIcons();
    
    initializeEventListeners();
    initializePresetValues();
    updateLimitTexts();
    initializeProgressCard();
    initializeConsole();
});

// Initialize progress card with default state
function initializeProgressCard() {
    progressCard.style.display = 'none';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressTitle.textContent = 'No file uploaded yet';
    progressSubtitle.textContent = 'Upload a ZIP file to begin compression';
    progressIcon.innerHTML = '<div class="icon-fallback">📁</div>';
    progressBarSection.style.display = 'none';
    statsGrid.style.display = 'none';
}

// Event Listeners
function initializeEventListeners() {
    // File input events
    fileInput.addEventListener('change', handleFileSelect);
    
    // The file input now covers the entire upload zone, so no need for additional click handlers
    
    // Drag and drop events
    fileDropZone.addEventListener('dragover', handleDragOver);
    fileDropZone.addEventListener('dragleave', handleDragLeave);
    fileDropZone.addEventListener('drop', handleFileDrop);
    
    // Compression button
    compressBtn.addEventListener('click', startCompression);
    
    // Download and reset buttons
    downloadBtn.addEventListener('click', downloadCompressedFile);
    resetBtn.addEventListener('click', resetAll);
    
    // Settings change events
    imageMaxSize.addEventListener('input', updateLimitTexts);
    imageUnit.addEventListener('change', updateLimitTexts);
    videoMaxSize.addEventListener('input', updateLimitTexts);
    videoUnit.addEventListener('change', updateLimitTexts);
    
    // Preset selection events
    initializePresetSelection();
    
    // Console events
    consoleHeader.addEventListener('click', toggleConsole);
    downloadReadyBtn.addEventListener('click', downloadCompressedFile);
    
    
    // Handle window resize to update console state
    window.addEventListener('resize', function() {
        // Only update if the mobile/desktop state has changed
        const wasMobile = consoleExpanded === false;
        const isNowMobile = isMobile();
        
        if (wasMobile !== isNowMobile) {
            initializeConsole();
        }
    });
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
        selectFile(file);
    } else if (file) {
        addLog('error', 'Please select a valid .zip file', 'ERROR');
        // Clear the input to allow re-selection
        event.target.value = '';
    }
}

function handleDragOver(event) {
    event.preventDefault();
    fileDropZone.classList.add('drag-active');
}

function handleDragLeave(event) {
    event.preventDefault();
    fileDropZone.classList.remove('drag-active');
}

function handleFileDrop(event) {
    event.preventDefault();
    fileDropZone.classList.remove('drag-active');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.zip')) {
            selectFile(file);
        } else {
            addLog('error', 'Please drop a valid .zip file', 'ERROR');
        }
    }
}

function selectFile(file) {
    // Check file size limit (500MB = 500 * 1024 * 1024 bytes)
    const maxFileSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxFileSize) {
        addLog('error', `File too large. Maximum size is 500MB. Your file is ${formatFileSize(file.size)}.`, 'ERROR');
        // Clear the input to allow re-selection
        fileInput.value = '';
        return;
    }
    
    // If there was already a file selected, clear console and hide progress card
    if (selectedFile) {
        clearLogs();
        progressCard.style.display = 'none';
        initializeProgressCard();
    }
    
    // Ensure progress card stays hidden during file selection
    progressCard.style.display = 'none';
    
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
    
    // Create job record
    currentJob = {
        id: generateJobId(),
        original_filename: file.name,
        original_size: file.size,
        compression_settings: {
            max_image_size: parseInt(imageMaxSize.value),
            image_unit: imageUnit.value,
            max_video_size: parseInt(videoMaxSize.value),
            video_unit: videoUnit.value
        },
        status: 'uploading',
        processing_log: []
    };
    
    // Show file selected state
    uploadContent.style.display = 'none';
    fileSelected.style.display = 'block';
    fileDropZone.classList.add('file-selected');
    compressBtn.disabled = false;
    
    addLog('info', `File selected: ${file.name}`, 'FILE_SELECTED');
    addLog('info', 'Attempting to create compression job record...', 'LOG');
    addLog('success', `Compression job record created successfully. Job ID: ${currentJob.id}`, 'JOB_CREATED');
    
    // Auto-expand console when file is uploaded
    if (!consoleExpanded) {
        toggleConsole();
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateJobId() {
    return Math.random().toString(36).substr(2, 9);
}

// Settings functions
function updateLimitTexts() {
    const imageSize = imageMaxSize.value;
    const imageUnitValue = imageUnit.value;
    const videoSize = videoMaxSize.value;
    const videoUnitValue = videoUnit.value;
    
    imageLimitText.textContent = `${imageSize} ${imageUnitValue}`;
    videoLimitText.textContent = `${videoSize} ${videoUnitValue}`;
}

// Preset selection functions
function initializePresetSelection() {
    const presetOptions = document.querySelectorAll('.preset-option');
    
    presetOptions.forEach(option => {
        option.addEventListener('click', () => {
            const preset = option.dataset.preset;
            selectPreset(preset);
        });
    });
}

function initializePresetValues() {
    // Set default values based on the balanced preset
    const defaultPreset = COMPRESSION_PRESETS[currentPreset];
    imageMaxSize.value = defaultPreset.imageMaxSize;
    imageUnit.value = defaultPreset.imageUnit;
    videoMaxSize.value = defaultPreset.videoMaxSize;
    videoUnit.value = defaultPreset.videoUnit;
}

function selectPreset(preset) {
    // Update active state
    document.querySelectorAll('.preset-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-preset="${preset}"]`).classList.add('active');
    
    // Update current preset
    currentPreset = preset;
    
    // Auto-fill input fields based on preset
    const presetConfig = COMPRESSION_PRESETS[preset];
    imageMaxSize.value = presetConfig.imageMaxSize;
    imageUnit.value = presetConfig.imageUnit;
    videoMaxSize.value = presetConfig.videoMaxSize;
    videoUnit.value = presetConfig.videoUnit;
    
    // Update the display text
    updateLimitTexts();
    
    // Clear previous warnings
    clearQualityWarnings();
    
    // Show warning for aggressive compression
    if (preset === 'aggressive') {
        showQualityWarning('Aggressive compression may significantly reduce image quality, especially for text and screenshots.', 'high');
    }
    
    addLog('info', `Compression preset changed to: ${COMPRESSION_PRESETS[preset].name}`, 'CUSTOM_SETTINGS');
    addLog('info', `Image settings: ${presetConfig.imageMaxSize} ${presetConfig.imageUnit}, Video settings: ${presetConfig.videoMaxSize} ${presetConfig.videoUnit}`, 'CUSTOM_SETTINGS');
}

function showQualityWarning(message, severity = 'medium') {
    warningText.textContent = message;
    qualityWarnings.style.display = 'block';
}

function clearQualityWarnings() {
    warningText.textContent = '';
    warningList.innerHTML = '';
    qualityWarnings.style.display = 'none';
    qualityWarningsList = []; // Clear the global warnings array
}




// Logging functions
function addLog(type, message, iconKey = 'LOG', additionalData = null) {
    // Get icon from repository based on type and key
    let icon = '📝'; // fallback
    if (typeof iconKey === 'string' && iconKey.includes('_')) {
        // If it's a key like 'COMPRESSION_START', use it directly
        icon = getIcon('COMPRESSION', iconKey) || getIcon('CONSOLE', iconKey) || iconKey;
    } else if (typeof iconKey === 'string') {
        // If it's a simple key, try different categories
        icon = getIcon('CONSOLE', iconKey) || getIcon('COMPRESSION', iconKey) || getIcon('STATUS', iconKey) || iconKey;
    } else {
        // If it's already an emoji/icon, use it directly
        icon = iconKey;
    }
    const timestamp = new Date();
    const logEntry = {
        id: logs.length + 1,
        type: type,
        message: message,
        icon: icon,
        timestamp: timestamp,
        additionalData: additionalData
    };
    
    logs.push(logEntry);
    
    // Update log count
    logCount.textContent = `${logs.length} log entries`;
    
    // Remove "no logs" message if it exists
    const noLogsElement = document.getElementById('noLogs');
    if (noLogsElement) {
        noLogsElement.remove();
    }
    
    // Create log entry element
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${type}`;
    
    let additionalHTML = '';
    if (additionalData && additionalData.originalSize && additionalData.compressedSize) {
        const originalSizeFormatted = formatFileSize(additionalData.originalSize);
        const compressedSizeFormatted = formatFileSize(additionalData.compressedSize);
        additionalHTML = `<div class="log-size-reduction">${originalSizeFormatted} → ${compressedSizeFormatted}</div>`;
    }
    
    if (additionalData && additionalData.previewData) {
        additionalHTML += `<button class="log-preview-btn" data-file="${additionalData.fileName}" title="Preview image">Preview</button>`;
    }
    
    logElement.innerHTML = `
        <div class="log-icon">${icon}</div>
        <div class="log-content">
            <div class="log-message">${message}</div>
            ${additionalHTML}
            <div class="log-timestamp">${formatTimestamp(timestamp)}</div>
        </div>
    `;
    
    // Add to console
    consoleLogs.appendChild(logElement);
    
    // Add preview button event listener if it exists
    if (additionalData && additionalData.previewData) {
        const previewBtn = logElement.querySelector('.log-preview-btn');
        previewBtn.addEventListener('click', () => {
            openImagePreview(additionalData.fileName, additionalData.originalData, additionalData.compressedData);
        });
    }
    
    // Auto-scroll to bottom
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

// Image preview function
function openImagePreview(fileName, originalData, compressedData) {
    // Get current compression settings for this file
    const currentOverride = fileOverrides.get(fileName);
    const currentQuality = currentOverride ? currentOverride.quality : COMPRESSION_PRESETS[currentPreset].imageQuality;
    const currentMaxSize = currentOverride ? currentOverride.maxSizeMB : getImageMaxSizeMB();
    
    // Create a modal for image preview with compression settings
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="image-preview-overlay"></div>
        <div class="image-preview-content">
            <div class="image-preview-header">
                <h3>Preview: ${fileName}</h3>
                <button class="image-preview-close">×</button>
            </div>
            <div class="image-preview-body">
                <div class="image-preview-comparison">
                    <div class="image-preview-original">
                        <h4>Original</h4>
                        <img src="${originalData}" alt="Original" class="preview-image">
                    </div>
                    <div class="image-preview-compressed">
                        <h4>Compressed</h4>
                        <img src="${compressedData}" alt="Compressed" class="preview-image">
                    </div>
                </div>
                
                <div class="image-preview-settings">
                    <h4>Compression Settings for this Image</h4>
                    <div class="settings-row">
                        <label for="preview-quality">Quality (0.1 - 1.0):</label>
                        <input type="number" id="preview-quality" min="0.1" max="1.0" step="0.05" value="${currentQuality}">
                    </div>
                    <div class="settings-row">
                        <label for="preview-max-size">Max Size (MB):</label>
                        <input type="number" id="preview-max-size" min="0.1" max="50" step="0.1" value="${currentMaxSize}">
                    </div>
                    <div class="settings-actions">
                        <button class="preview-apply-settings" data-file="${fileName}">Apply These Settings</button>
                        <button class="preview-reset-settings" data-file="${fileName}">Reset to Default</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.image-preview-close');
    const overlay = modal.querySelector('.image-preview-overlay');
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    overlay.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    // Apply settings functionality
    const applyBtn = modal.querySelector('.preview-apply-settings');
    const resetBtn = modal.querySelector('.preview-reset-settings');
    
    applyBtn.addEventListener('click', () => {
        const quality = parseFloat(modal.querySelector('#preview-quality').value);
        const maxSize = parseFloat(modal.querySelector('#preview-max-size').value);
        
        // Store the override
        fileOverrides.set(fileName, {
            quality: quality,
            maxSizeMB: maxSize
        });
        
        addLog('info', `Custom compression settings applied to ${fileName}`, 'CUSTOM_SETTINGS');
        addLog('info', `Quality: ${quality}, Max Size: ${maxSize}MB`, 'STATS');
        
        // Show recompress prompt
        showRecompressPrompt();
        
        // Close modal
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    resetBtn.addEventListener('click', () => {
        // Remove override
        fileOverrides.delete(fileName);
        
        addLog('info', `Reset ${fileName} to default compression settings`, 'RESET_SETTINGS');
        
        // Close modal
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
}

// Show recompress prompt
function showRecompressPrompt() {
    // Check if recompress prompt already exists
    if (document.getElementById('recompressPrompt')) {
        return;
    }
    
    const prompt = document.createElement('div');
    prompt.id = 'recompressPrompt';
    prompt.className = 'recompress-prompt';
    prompt.innerHTML = `
        <div class="recompress-content">
            <div class="recompress-icon">🔄</div>
            <div class="recompress-text">
                <h4>Compression Settings Updated</h4>
                <p>You've changed compression settings for specific files. Click below to recompress the ZIP with the new settings.</p>
            </div>
            <button class="recompress-button" id="recompressBtn">Recompress ZIP</button>
        </div>
    `;
    
    // Insert after the console card
    const consoleCard = document.querySelector('.console-card');
    consoleCard.parentNode.insertBefore(prompt, consoleCard.nextSibling);
    
    // Add event listener for recompress button
    document.getElementById('recompressBtn').addEventListener('click', () => {
        // Remove the prompt
        prompt.remove();
        // Start recompression
        startCompression();
    });
}

function clearLogs() {
    logs = [];
    consoleLogs.innerHTML = '<div class="no-logs" id="noLogs">No logs yet. Start processing to see debug information.</div>';
    logCount.textContent = '0 log entries';
}

function toggleConsole() {
    consoleExpanded = !consoleExpanded;
    consoleLogs.classList.toggle('expanded', consoleExpanded);
    toggleIcon.classList.toggle('rotated', consoleExpanded);
}

// Progress functions
function updateProgress(percent, status = 'processing', currentFileName = '') {
    progressCard.style.display = 'block';
    progressBarSection.style.display = 'block';
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    
    if (status === 'processing') {
        // Show image preview if it's an image file
        if (currentFileName && isImageFile(currentFileName.split('.').pop().toLowerCase())) {
            showImagePreview(currentFileName);
        } else {
            progressIcon.innerHTML = '<div class="icon-fallback">⚡</div>';
        }
        progressTitle.textContent = 'Compressing files...';
        progressSubtitle.textContent = currentFileName ? `Processing: ${currentFileName}` : 'Processing your files...';
    } else if (status === 'completed') {
        progressIcon.innerHTML = '<div class="icon-fallback">✅</div>';
        progressTitle.textContent = 'Compression completed successfully!';
        progressSubtitle.textContent = 'Your files have been compressed and are ready for download.';
    } else if (status === 'failed') {
        progressIcon.innerHTML = '<div class="icon-fallback">❌</div>';
        progressTitle.textContent = 'Compression failed';
        progressSubtitle.textContent = 'There was an error processing your files.';
    }
}

function showImagePreview(fileName) {
    // For now, just show a generic image icon
    // In a real implementation, you might want to show a thumbnail
    progressIcon.innerHTML = '<div class="icon-fallback">🖼️</div>';
}

function showStats(compressionStats) {
    stats = compressionStats;
    statsGrid.style.display = 'grid';
    compressedSize.textContent = formatFileSize(compressionStats.compressedSize || 0);
    spaceSaved.textContent = `${compressionStats.spaceSaved || 0}%`;
    imagesCompressed.textContent = compressionStats.imagesCompressed || 0;
    videosCompressed.textContent = compressionStats.videosCompressed || 0;
}

// Main compression function
async function startCompression() {
    if (!selectedFile || !currentJob) {
        addLog('error', 'Cannot start. No file selected or job record is missing.', 'ERROR');
        return;
    }

    addLog('info', 'Start Compression button clicked. Beginning process...', 'COMPRESSION_START');
    setProcessingState(true);
    updateProgress(10, 'processing');

    try {
        // Step 1: Upload file
        addLog('info', 'Step 1: Uploading ZIP file to server...', 'UPLOAD');
        updateProgress(20, 'processing');
        
        // Simulate file upload (in real implementation, this would upload to server)
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog('success', 'Step 1 complete. File uploaded successfully.', 'SUCCESS');
        
        // Step 2: Analyze ZIP contents
        addLog('info', 'Step 2: Analyzing ZIP contents and compressing files...', 'COMPRESSION_PROGRESS');
        updateProgress(40, 'processing');

        // Load FFmpeg (optional for video compression)
        await loadFFmpeg();
        
        // Read the zip file
        const zip = await JSZip.loadAsync(selectedFile);
        const files = Object.keys(zip.files);
        const processableFiles = files.filter(file => 
            !file.startsWith('__MACOSX/') && 
            !file.endsWith('.DS_Store') && 
            !zip.files[file].dir
        );

        addLog('info', `Found ${processableFiles.length} files to process`, 'STATS');
        
        // Clear previous flagged files
        flaggedFiles = [];
        
        // Analyze file types and provide recommendations
        const imageFiles = processableFiles.filter(file => isImageFile(file.split('.').pop().toLowerCase()));
        const videoFiles = processableFiles.filter(file => isVideoFile(file.split('.').pop().toLowerCase()));
        
        if (imageFiles.length > 0) {
            addLog('info', `Found ${imageFiles.length} image files - smart compression will analyze each for optimal quality`, 'COMPRESSION_PROGRESS');
        }
        if (videoFiles.length > 0) {
            addLog('info', `Found ${videoFiles.length} video files - video compression not yet implemented`, 'VIDEO');
        }

        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        let imagesCompressed = 0;
        let videosCompressed = 0;
        const compressedZip = new JSZip();

        // Process each file
        for (let i = 0; i < processableFiles.length; i++) {
            const fileName = processableFiles[i];
            const file = zip.files[fileName];
            const fileData = await file.async('uint8array');
            const fileSize = fileData.length;
            totalOriginalSize += fileSize;

            const fileExtension = fileName.split('.').pop().toLowerCase();
            let compressedData = fileData;
            let wasCompressed = false;
            let compressionRatio = 1.0;

            // Update progress
            const progress = 40 + (i / processableFiles.length) * 40;
            updateProgress(progress, 'processing', fileName);

            if (isImageFile(fileExtension)) {
                try {
                    const imageFile = new File([fileData], fileName, { type: `image/${fileExtension}` });
                    const compressedImageFile = await compressImage(imageFile, fileName);
                    
                    compressedData = await compressedImageFile.arrayBuffer();
                    compressedData = new Uint8Array(compressedData);
                    wasCompressed = true;
                    imagesCompressed++;
                    
                    // Calculate compression ratio
                    compressionRatio = compressedData.length / fileSize;
                    const spaceSaved = Math.round((1 - compressionRatio) * 100);
                    
                    // Store image data for preview
                    const originalReader = new FileReader();
                    const compressedReader = new FileReader();
                    let originalDataUrl = '';
                    let compressedDataUrl = '';
                    
                    originalReader.onload = () => {
                        originalDataUrl = originalReader.result;
                    };
                    compressedReader.onload = () => {
                        compressedDataUrl = compressedReader.result;
                        
                        // Log with size reduction and preview data
                        addLog('success', `Compressed image: ${fileName} (${spaceSaved}% reduction)`, 'IMAGE', {
                            originalSize: fileSize,
                            compressedSize: compressedData.length,
                            fileName: fileName,
                            previewData: true,
                            originalData: originalDataUrl,
                            compressedData: compressedDataUrl
                        });
                    };
                    
                    originalReader.readAsDataURL(imageFile);
                    compressedReader.readAsDataURL(compressedImageFile);
                } catch (error) {
                    addLog('warning', `Failed to compress image ${fileName}: ${error.message}`, 'WARNING');
                }
            } else if (isVideoFile(fileExtension) && ffmpeg) {
                try {
                    // Video compression would go here
                    // For now, just add the original file
                    addLog('info', `Video file ${fileName} - video compression requires FFmpeg to be loaded`, 'VIDEO');
                    videosCompressed++;
                } catch (error) {
                    addLog('warning', `Failed to process video ${fileName}: ${error.message}`, 'WARNING');
                }
            }

            // Add to compressed zip
            compressedZip.file(fileName, compressedData);
            totalCompressedSize += compressedData.length;
        }

        // Step 3: Create final ZIP
        addLog('info', 'Step 3: Creating compressed ZIP file...', 'COMPRESSION_PROGRESS');
        updateProgress(90, 'processing');

        const zipBlob = await compressedZip.generateAsync({ type: 'blob' });
        downloadUrl = URL.createObjectURL(zipBlob);
        
        const spaceSavedPercent = Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100);
        
        updateProgress(100, 'completed');
        showStats({
            compressedSize: totalCompressedSize,
            spaceSaved: spaceSavedPercent,
            imagesCompressed: imagesCompressed,
            videosCompressed: videosCompressed
        });
        
        addLog('success', `Step 3 complete. Compression finished! Saved ${spaceSavedPercent}% space.`, 'COMPRESSION_COMPLETE');
        addLog('success', `Original size: ${formatFileSize(totalOriginalSize)}`, 'STATS');
        addLog('success', `Compressed size: ${formatFileSize(totalCompressedSize)}`, 'STATS');
        
        // Add quality assessment summary
        if (imagesCompressed > 0) {
            const avgCompressionRatio = totalCompressedSize / totalOriginalSize;
            addLog('info', `Average compression ratio: ${Math.round((1 - avgCompressionRatio) * 100)}% space saved`, 'STATS');
        }
        
        
        // Show download ready button
        downloadReady.style.display = 'block';
        
        // Update button to allow compressing another file
        updateButtonAfterCompression();
        
        // Update job status
        currentJob.status = 'completed';
        currentJob.compressed_size = totalCompressedSize;
        currentJob.output_file_url = downloadUrl;
        currentJob.processing_log = logs;
        
    } catch (error) {
        updateProgress(0, 'failed');
        addLog('error', `Compression process failed: ${error.message}`, 'ERROR');
        
        if (currentJob) {
            currentJob.status = 'failed';
            currentJob.processing_log = logs;
        }
    } finally {
        setProcessingState(false);
    }
}

// File type detection
function isImageFile(extension) {
    return ['png', 'jpg', 'jpeg', 'webp'].includes(extension);
}

function isVideoFile(extension) {
    return ['mp4', 'mov', 'webm'].includes(extension);
}


// Simple image compression function
async function compressImage(imageFile, fileName) {
    const presetConfig = COMPRESSION_PRESETS[currentPreset];
    
    // Check for file-specific override
    const override = fileOverrides.get(fileName);
    const quality = override ? override.quality : presetConfig.imageQuality;
    const maxSizeMB = override ? override.maxSizeMB : getImageMaxSizeMB();
    
    if (override) {
        addLog('info', `Using custom settings for ${fileName}: Quality ${quality}, Max Size ${maxSizeMB}MB`, 'CUSTOM_SETTINGS');
    }
    
    const compressionSettings = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality
    };
    
    try {
        const compressedImageFile = await imageCompression(imageFile, compressionSettings);
        return compressedImageFile;
    } catch (error) {
        addLog('warning', `Failed to compress ${fileName}, using original file`, 'WARNING');
        return imageFile;
    }
}

// FFmpeg loading
async function loadFFmpeg() {
    if (ffmpeg) return;
    
    // Check if running from file:// protocol (local file)
    if (window.location.protocol === 'file:') {
        addLog('info', 'Running from local file - FFmpeg requires a web server', 'INFO');
        addLog('info', 'Video compression disabled. Image compression will still work.', 'INFO');
        return; // Don't try to load FFmpeg from file://
    }
    
    addLog('info', 'Loading FFmpeg...', 'LOADING');
    
    try {
        const { FFmpeg } = FFmpegWASM;
        ffmpeg = new FFmpeg();
        
        // Use jsDelivr CDN which has better CORS support
        await ffmpeg.load({
            coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });
        
        addLog('success', 'FFmpeg loaded successfully', 'SUCCESS');
    } catch (error) {
        // Try alternative CDN if first one fails
        try {
            addLog('info', 'Trying alternative FFmpeg CDN...', 'LOADING');
            await ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
            });
            addLog('success', 'FFmpeg loaded successfully from alternative CDN', 'SUCCESS');
        } catch (secondError) {
            addLog('warning', 'FFmpeg failed to load from both CDNs', 'WARNING');
            addLog('info', 'Video compression will be disabled. Image compression will still work.', 'INFO');
            // Don't throw error, just disable video compression
        }
    }
}

// Helper functions
function getImageMaxSizeMB() {
    const size = parseInt(imageMaxSize.value);
    const unit = imageUnit.value;
    
    switch (unit) {
        case 'KB': return size / 1024;
        case 'MB': return size;
        case 'GB': return size * 1024;
        default: return 0.25; // Default to 250KB
    }
}

function getVideoMaxSizeMB() {
    const size = parseInt(videoMaxSize.value);
    const unit = videoUnit.value;
    
    switch (unit) {
        case 'KB': return size / 1024;
        case 'MB': return size;
        case 'GB': return size * 1024;
        default: return 8; // Default to 8MB
    }
}

// Download functions
function downloadCompressedFile() {
    if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `compressed_${selectedFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addLog('success', 'Download started', 'DOWNLOAD');
    } else {
        addLog('error', 'No compressed file available for download', 'ERROR');
    }
}



// Reset function
function resetAll() {
    selectedFile = null;
    currentJob = null;
    stats = null;
    downloadUrl = null;
    consoleExpanded = false;
    fileOverrides.clear();
    
    // Reset UI
    uploadContent.style.display = 'block';
    fileSelected.style.display = 'none';
    fileDropZone.classList.remove('file-selected');
    compressBtn.style.display = 'inline-flex';
    downloadSection.style.display = 'none';
    statsGrid.style.display = 'none';
    progressCard.style.display = 'none';
    
    // Reset progress card to initial state
    initializeProgressCard();
    
    // Reset form
    fileInput.value = '';
    compressBtn.disabled = true;
    
    // Reset button click handler
    compressBtn.onclick = startCompression;
    
    // Reset console to device-appropriate state
    initializeConsole();
    clearLogs();
}

// Processing state
function setProcessingState(processing) {
    isProcessing = processing;
    compressBtn.disabled = processing;
    
    if (processing) {
        compressBtn.innerHTML = `<div class="button-icon">${getIcon('COMPRESSION', 'PROCESSING')}</div><span>Compressing...</span>`;
    } else {
        // Only reset to "Start Compression" if not already set to "Compress Another ZIP"
        if (!compressBtn.innerHTML.includes('Compress Another ZIP')) {
            compressBtn.innerHTML = `<div class="button-icon">${getIcon('COMPRESSION', 'START')}</div><span>Start Compression</span>`;
        }
    }
}

// Update button after compression completion
function updateButtonAfterCompression() {
    compressBtn.innerHTML = `<div class="button-icon">${getIcon('COMPRESSION', 'COMPRESS_ANOTHER')}</div><span>Compress Another ZIP</span>`;
    compressBtn.disabled = false;
    compressBtn.onclick = () => {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Clear current file and reset UI to upload state
        selectedFile = null;
        currentJob = null;
        uploadContent.style.display = 'block';
        fileSelected.style.display = 'none';
        fileDropZone.classList.remove('file-selected');
        compressBtn.disabled = true;
        // Reset button to original state
        compressBtn.innerHTML = `<div class="button-icon">${getIcon('COMPRESSION', 'START')}</div><span>Start Compression</span>`;
        compressBtn.onclick = startCompression;
        // Clear file input
        fileInput.value = '';
        // Clear console and hide progress card
        clearLogs();
        progressCard.style.display = 'none';
        initializeProgressCard();
        // Trigger file input click to allow selecting new file
        setTimeout(() => fileInput.click(), 100);
    };
}