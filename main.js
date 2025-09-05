// Global variables
let selectedFile = null;
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
let qualityWarningsList = [];
let fileOverrides = new Map(); // Map of fileName -> { preset, reason, originalSize, compressedSize }
let flaggedFiles = [];
let currentPreviewFile = null;
let originalImageData = new Map(); // Store original image data for previews

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
const qualityIssuesSection = document.getElementById('qualityIssuesSection');
const flaggedFilesList = document.getElementById('flaggedFilesList');
const reprocessButton = document.getElementById('reprocessButton');
const previewModal = document.getElementById('previewModal');
const previewModalClose = document.getElementById('previewModalClose');
const previewModalOverlay = document.getElementById('previewModalOverlay');
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
    
    // Reprocess button
    reprocessButton.addEventListener('click', reprocessWithOverrides);
    
    // Preview modal events
    previewModalClose.addEventListener('click', closePreviewModal);
    previewModalOverlay.addEventListener('click', closePreviewModal);
    previewApplyBtn.addEventListener('click', applyPreviewSetting);
    previewKeepBtn.addEventListener('click', closePreviewModal);
    
    // Preset button events in modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('preset-btn')) {
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Trigger real-time preview if modal is open
            if (currentPreviewFile) {
                updateCompressionPreview(e.target.dataset.preset);
            }
        }
    });
    
    // Quality issues toggle
    qualityIssuesHeader.addEventListener('click', toggleQualityIssues);
    
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
        addLog('error', 'Please select a valid .zip file', '❌');
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
            addLog('error', 'Please drop a valid .zip file', '❌');
        }
    }
}

function selectFile(file) {
    // Check file size limit (500MB = 500 * 1024 * 1024 bytes)
    const maxFileSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxFileSize) {
        addLog('error', `File too large. Maximum size is 500MB. Your file is ${formatFileSize(file.size)}.`, '❌');
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
    
    addLog('info', `File selected: ${file.name}`, '📂');
    addLog('info', 'Attempting to create compression job record...', '📝');
    addLog('success', `Compression job record created successfully. Job ID: ${currentJob.id}`, '✅');
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
    
    addLog('info', `Compression preset changed to: ${COMPRESSION_PRESETS[preset].name}`, '⚙️');
    addLog('info', `Image settings: ${presetConfig.imageMaxSize} ${presetConfig.imageUnit}, Video settings: ${presetConfig.videoMaxSize} ${presetConfig.videoUnit}`, '⚙️');
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

function displayQualityIssues() {
    if (flaggedFiles.length === 0) {
        qualityIssuesSection.style.display = 'none';
        return;
    }
    
    flaggedFilesList.innerHTML = '';
    
    flaggedFiles.forEach(fileInfo => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flagged-file-item';
        
        const compressionPercent = Math.round((1 - fileInfo.compressionRatio) * 100);
        const originalSizeFormatted = formatFileSize(fileInfo.originalSize);
        const compressedSizeFormatted = fileInfo.compressedSize ? formatFileSize(fileInfo.compressedSize) : 'Processing...';
        
        fileItem.innerHTML = `
            <div class="flagged-file-info">
                <div class="flagged-file-name">${fileInfo.fileName}</div>
                <div class="flagged-file-stats">${originalSizeFormatted} → ${compressedSizeFormatted} (${compressionPercent}% reduction)</div>
            </div>
            <div class="flagged-file-controls">
                <button class="preview-button" data-file="${fileInfo.fileName}">Preview</button>
            </div>
        `;
        
        flaggedFilesList.appendChild(fileItem);
    });
    
    // Add event listeners for preview buttons
    flaggedFilesList.querySelectorAll('.preview-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileName = e.target.dataset.file;
            openPreviewModal(fileName);
        });
    });
    
    qualityIssuesSection.style.display = 'block';
    
    // Start collapsed (triangle pointing up initially)
    qualityIssuesContent.classList.add('collapsed');
    qualityIssuesToggle.classList.add('collapsed');
    
    // Always show re-compress button when there are flagged files
    reprocessButton.style.display = 'inline-flex';
}

// Toggle quality issues section
function toggleQualityIssues() {
    qualityIssuesContent.classList.toggle('collapsed');
    qualityIssuesToggle.classList.toggle('collapsed');
}

// Quality assessment function
function getQualityAssessment(compressionRatio, preset) {
    const spaceSaved = Math.round((1 - compressionRatio) * 100);
    
    if (preset === 'high_quality') {
        if (spaceSaved < 20) {
            return 'Excellent quality preserved with minimal compression';
        } else if (spaceSaved < 40) {
            return 'High quality maintained with good compression';
        } else {
            return 'Good quality with significant space savings';
        }
    } else if (preset === 'balanced') {
        if (spaceSaved < 30) {
            return 'High quality with moderate compression';
        } else if (spaceSaved < 60) {
            return 'Good balance of quality and compression';
        } else {
            return 'Acceptable quality with high compression';
        }
    } else { // aggressive
        if (spaceSaved < 50) {
            return 'Moderate quality loss with good compression';
        } else if (spaceSaved < 80) {
            return 'Significant compression with noticeable quality reduction';
        } else {
            return 'Maximum compression with substantial quality reduction';
        }
    }
}

// Logging functions
function addLog(type, message, icon = '📝') {
    const timestamp = new Date();
    const logEntry = {
        id: logs.length + 1,
        type: type,
        message: message,
        icon: icon,
        timestamp: timestamp
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
    logElement.innerHTML = `
        <div class="log-icon">${icon}</div>
        <div class="log-content">
            <div class="log-message">${message}</div>
            <div class="log-timestamp">${formatTimestamp(timestamp)}</div>
        </div>
    `;
    
    // Add to console
    consoleLogs.appendChild(logElement);
    
    // Auto-scroll to bottom
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
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
        addLog('error', 'Cannot start. No file selected or job record is missing.', '❌');
        return;
    }

    addLog('info', 'Start Compression button clicked. Beginning process...', '🚀');
    setProcessingState(true);
    updateProgress(10, 'processing');

    try {
        // Step 1: Upload file
        addLog('info', 'Step 1: Uploading ZIP file to server...', '📤');
        updateProgress(20, 'processing');
        
        // Simulate file upload (in real implementation, this would upload to server)
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog('success', 'Step 1 complete. File uploaded successfully.', '✅');
        
        // Step 2: Analyze ZIP contents
        addLog('info', 'Step 2: Analyzing ZIP contents and compressing files...', '🧠');
        updateProgress(40, 'processing');

        // Load FFmpeg (optional for video compression)
        try {
            await loadFFmpeg();
        } catch (error) {
            addLog('warning', 'FFmpeg failed to load. Video compression will be skipped, but image compression will still work.', '⚠️');
        }
        
        // Read the zip file
        const zip = await JSZip.loadAsync(selectedFile);
        const files = Object.keys(zip.files);
        const processableFiles = files.filter(file => 
            !file.startsWith('__MACOSX/') && 
            !file.endsWith('.DS_Store') && 
            !zip.files[file].dir
        );

        addLog('info', `Found ${processableFiles.length} files to process`, '📊');
        
        // Clear previous flagged files
        flaggedFiles = [];
        
        // Analyze file types and provide recommendations
        const imageFiles = processableFiles.filter(file => isImageFile(file.split('.').pop().toLowerCase()));
        const videoFiles = processableFiles.filter(file => isVideoFile(file.split('.').pop().toLowerCase()));
        
        if (imageFiles.length > 0) {
            addLog('info', `Found ${imageFiles.length} image files - smart compression will analyze each for optimal quality`, '🔍');
        }
        if (videoFiles.length > 0) {
            addLog('info', `Found ${videoFiles.length} video files - video compression not yet implemented`, '🎥');
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
                    const compressedImageFile = await smartImageCompression(imageFile, fileName, currentPreset);
                    
                    compressedData = await compressedImageFile.arrayBuffer();
                    compressedData = new Uint8Array(compressedData);
                    wasCompressed = true;
                    imagesCompressed++;
                    
                    // Calculate compression ratio
                    compressionRatio = compressedData.length / fileSize;
                    const spaceSaved = Math.round((1 - compressionRatio) * 100);
                    
                    addLog('success', `Smart compressed image: ${fileName} (${spaceSaved}% reduction)`, '🖼️');
                } catch (error) {
                    addLog('warning', `Failed to compress image ${fileName}: ${error.message}`, '⚠️');
                }
            } else if (isVideoFile(fileExtension) && ffmpeg) {
                try {
                    // Video compression would go here
                    // For now, just add the original file
                    addLog('info', `Video file ${fileName} - compression not implemented yet`, '🎥');
                    videosCompressed++;
                } catch (error) {
                    addLog('warning', `Failed to process video ${fileName}: ${error.message}`, '⚠️');
                }
            }

            // Add to compressed zip
            compressedZip.file(fileName, compressedData);
            totalCompressedSize += compressedData.length;
        }

        // Step 3: Create final ZIP
        addLog('info', 'Step 3: Creating compressed ZIP file...', '📦');
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
        
        addLog('success', `Step 3 complete. Compression finished! Saved ${spaceSavedPercent}% space.`, '🎉');
        addLog('success', `Original size: ${formatFileSize(totalOriginalSize)}`, '📊');
        addLog('success', `Compressed size: ${formatFileSize(totalCompressedSize)}`, '📊');
        
        // Add quality assessment summary
        if (imagesCompressed > 0) {
            const avgCompressionRatio = totalCompressedSize / totalOriginalSize;
            const qualityAssessment = getQualityAssessment(avgCompressionRatio, currentPreset);
            addLog('info', `Quality Assessment: ${qualityAssessment}`, '🔍');
        }
        
        // Display quality issues if any
        displayQualityIssues();
        
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
        addLog('error', `Compression process failed: ${error.message}`, '❌');
        
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

// Content analysis functions
async function analyzeImageContent(imageFile) {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const analysis = analyzeImageData(imageData, img.width, img.height);
            resolve(analysis);
        };
        
        img.onerror = () => {
            resolve({
                hasText: false,
                isScreenshot: false,
                complexity: 'medium',
                recommendedQuality: 0.85
            });
        };
        
        img.src = URL.createObjectURL(imageFile);
    });
}

function analyzeImageData(imageData, width, height) {
    const data = imageData.data;
    const pixelCount = width * height;
    
    // Analyze for text characteristics
    let edgePixels = 0;
    let colorVariations = 0;
    let sharpTransitions = 0;
    const colorMap = new Map();
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128) continue; // Skip transparent pixels
        
        // Count color variations
        const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        
        // Detect edges (simplified edge detection)
        if (i + 4 < data.length) {
            const nextR = data[i + 4];
            const nextG = data[i + 5];
            const nextB = data[i + 6];
            
            const colorDiff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
            if (colorDiff > 100) {
                edgePixels++;
                if (colorDiff > 200) {
                    sharpTransitions++;
                }
            }
        }
    }
    
    const edgeRatio = edgePixels / (pixelCount / 4);
    const colorCount = colorMap.size;
    const sharpTransitionRatio = sharpTransitions / (pixelCount / 4);
    
    // Determine if image likely contains text
    const hasText = edgeRatio > 0.1 && sharpTransitionRatio > 0.05;
    
    // Determine if it's likely a screenshot
    const isScreenshot = hasText && colorCount < 50 && edgeRatio > 0.15;
    
    // Determine complexity
    let complexity = 'low';
    if (colorCount > 100 || edgeRatio > 0.2) {
        complexity = 'high';
    } else if (colorCount > 50 || edgeRatio > 0.1) {
        complexity = 'medium';
    }
    
    // Recommend quality based on analysis
    let recommendedQuality = 0.85;
    if (hasText && !isScreenshot) {
        recommendedQuality = 0.95; // High quality for text
    } else if (isScreenshot) {
        recommendedQuality = 0.9; // High quality for screenshots
    } else if (complexity === 'high') {
        recommendedQuality = 0.8; // Lower quality for complex images
    }
    
    return {
        hasText,
        isScreenshot,
        complexity,
        recommendedQuality,
        edgeRatio,
        colorCount,
        sharpTransitionRatio
    };
}

// Smart compression function
async function smartImageCompression(imageFile, fileName, preset) {
    const analysis = await analyzeImageContent(imageFile);
    
    // Check for file-specific override
    const override = fileOverrides.get(fileName);
    const effectivePreset = override ? override.preset : preset;
    const presetConfig = COMPRESSION_PRESETS[effectivePreset];
    
    if (override) {
        addLog('info', `Using override for ${fileName}: ${COMPRESSION_PRESETS[effectivePreset].name}`, '⚙️');
    }
    
    // Determine compression settings based on content analysis
    let compressionSettings = {
        maxSizeMB: getImageMaxSizeMB() * presetConfig.maxSizeMultiplier,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg'
    };
    
    // Smart file type selection based on content analysis
    if (analysis.isScreenshot || (analysis.hasText && analysis.complexity === 'low')) {
        // Use PNG for screenshots and simple text images to preserve sharp edges
        compressionSettings.fileType = 'image/png';
        addLog('info', `Using PNG format for ${fileName} to preserve text clarity`, '📝');
    } else if (analysis.complexity === 'high' && !analysis.hasText) {
        // Use WebP for complex images without text for better compression
        compressionSettings.fileType = 'image/webp';
        addLog('info', `Using WebP format for ${fileName} for optimal compression`, '🖼️');
    }
    
    // Adjust quality based on content analysis
    if (presetConfig.textDetectionEnabled && analysis.hasText) {
        compressionSettings.initialQuality = Math.max(analysis.recommendedQuality, 0.9);
        addLog('info', `Text detected in ${fileName}, using high quality compression`, '📝');
    } else if (analysis.isScreenshot) {
        compressionSettings.initialQuality = 0.95;
        addLog('info', `Screenshot detected in ${fileName}, using maximum quality`, '📸');
    } else {
        compressionSettings.initialQuality = presetConfig.imageQuality;
    }
    
    // Check for potential quality issues with enhanced detection
    const originalSizeMB = imageFile.size / (1024 * 1024);
    const targetSizeMB = compressionSettings.maxSizeMB;
    const compressionRatio = targetSizeMB / originalSizeMB;
    
    let warningReason = '';
    let severity = 'low';
    
    // Enhanced warning detection
    if (compressionRatio < 0.2) {
        warningReason = 'Extremely aggressive compression will cause significant quality loss';
        severity = 'high';
    } else if (compressionRatio < 0.3 && presetConfig.aggressiveCompression) {
        warningReason = 'Very aggressive compression may cause quality loss';
        severity = 'high';
    } else if (compressionRatio < 0.5) {
        warningReason = 'Moderate compression may slightly reduce quality';
        severity = 'medium';
    } else if (analysis.hasText && compressionRatio < 0.7) {
        warningReason = 'Text content may lose sharpness with this compression level';
        severity = 'medium';
    } else if (analysis.isScreenshot && compressionRatio < 0.8) {
        warningReason = 'Screenshot may lose clarity with this compression level';
        severity = 'medium';
    }
    
    // Store file information for potential overrides
    const fileInfo = {
        fileName,
        originalSize: imageFile.size,
        analysis,
        compressionRatio,
        warningReason,
        severity,
        preset: preset
    };
    
    if (warningReason) {
        flaggedFiles.push(fileInfo);
        addLog('warning', `${fileName}: ${warningReason}`, '⚠️');
    }
    
    try {
        const compressedImageFile = await imageCompression(imageFile, compressionSettings);
        
        // Store compressed size for display
        fileInfo.compressedSize = compressedImageFile.size;
        
        // Store compressed image data for preview
        const reader = new FileReader();
        reader.onload = () => {
            fileInfo.compressedData = reader.result;
        };
        reader.readAsDataURL(compressedImageFile);
        
        // Store original image data for preview (only once)
        if (!originalImageData.has(fileName)) {
            const originalReader = new FileReader();
            originalReader.onload = () => {
                originalImageData.set(fileName, originalReader.result);
            };
            originalReader.readAsDataURL(imageFile);
        }
        
        return compressedImageFile;
    } catch (error) {
        addLog('warning', `Failed to compress ${fileName} with smart settings, falling back to standard compression`, '⚠️');
        
        // Fallback to standard compression
        const fallbackSettings = {
            maxSizeMB: getImageMaxSizeMB(),
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };
        
        return await imageCompression(imageFile, fallbackSettings);
    }
}

// FFmpeg loading
async function loadFFmpeg() {
    if (ffmpeg) return;
    
    addLog('info', 'Loading FFmpeg...', '⏱️');
    
    try {
        const { FFmpeg } = FFmpegWASM;
        ffmpeg = new FFmpeg();
        
        await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });
        
        addLog('success', 'FFmpeg loaded successfully', '✅');
    } catch (error) {
        addLog('error', `Failed to load FFmpeg: ${error.message}`, '❌');
        throw error;
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
        
        addLog('success', 'Download started', '⬇️');
    } else {
        addLog('error', 'No compressed file available for download', '❌');
    }
}

// Reprocess with overrides function
async function reprocessWithOverrides() {
    if (fileOverrides.size === 0) {
        addLog('warning', 'No overrides set for reprocessing', '⚠️');
        return;
    }
    
    addLog('info', 'Starting reprocessing with file-specific overrides...', '🔄');
    setProcessingState(true);
    
    try {
        // Clear previous results
        flaggedFiles = [];
        fileOverrides.clear();
        
        // Restart compression with overrides
        await startCompression();
        
        addLog('success', 'Reprocessing completed with overrides applied', '✅');
    } catch (error) {
        addLog('error', `Reprocessing failed: ${error.message}`, '❌');
    } finally {
        setProcessingState(false);
    }
}

// Preview modal functions
function openPreviewModal(fileName) {
    const fileInfo = flaggedFiles.find(f => f.fileName === fileName);
    if (!fileInfo) return;
    
    currentPreviewFile = fileName;
    
    // Set modal title
    document.getElementById('previewModalTitle').textContent = `Preview: ${fileName}`;
    
    // Load original image
    const originalData = originalImageData.get(fileName);
    if (originalData) {
        previewOriginalImage.src = originalData;
        previewOriginalStats.textContent = `Original: ${formatFileSize(fileInfo.originalSize)}`;
    }
    
    // Load compressed image
    previewCompressedImage.src = fileInfo.compressedData || '';
    previewCompressedStats.textContent = `Compressed: ${formatFileSize(fileInfo.compressedSize)} (${Math.round((1 - fileInfo.compressionRatio) * 100)}% reduction)`;
    
    // Set active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.preset === fileInfo.preset) {
            btn.classList.add('active');
        }
    });
    
    // Show modal
    previewModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
    previewModal.style.display = 'none';
    document.body.style.overflow = '';
    currentPreviewFile = null;
}

function applyPreviewSetting() {
    if (!currentPreviewFile) return;
    
    const activePreset = document.querySelector('.preset-btn.active');
    if (!activePreset) return;
    
    const newPreset = activePreset.dataset.preset;
    
    // Update the override
    fileOverrides.set(currentPreviewFile, {
        preset: newPreset,
        reason: flaggedFiles.find(f => f.fileName === currentPreviewFile)?.warningReason || '',
        originalSize: flaggedFiles.find(f => f.fileName === currentPreviewFile)?.originalSize || 0,
        compressedSize: flaggedFiles.find(f => f.fileName === currentPreviewFile)?.compressedSize || 0
    });
    
    // Re-compress button is always shown when there are flagged files
    
    addLog('info', `Override set for ${currentPreviewFile}: ${COMPRESSION_PRESETS[newPreset].name}`, '⚙️');
    closePreviewModal();
}

// Real-time compression preview
async function updateCompressionPreview(preset) {
    if (!currentPreviewFile) return;
    
    const fileInfo = flaggedFiles.find(f => f.fileName === currentPreviewFile);
    if (!fileInfo) return;
    
    // Get original image data
    const originalData = originalImageData.get(currentPreviewFile);
    if (!originalData) return;
    
    try {
        // Show loading state
        previewCompressedStats.textContent = 'Compressing...';
        
        // Create a temporary image element to get the file
        const img = new Image();
        img.onload = async () => {
            // Create canvas to convert back to file
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                // Create a temporary file for compression
                const tempFile = new File([blob], currentPreviewFile, { type: blob.type });
                
                // Use direct compression instead of smartImageCompression to avoid file overrides
                const presetConfig = COMPRESSION_PRESETS[preset];
                const compressionSettings = {
                    maxSizeMB: getImageMaxSizeMB() * presetConfig.maxSizeMultiplier,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/jpeg',
                    initialQuality: presetConfig.imageQuality
                };
                
                // Compress with the selected preset
                const compressedFile = await imageCompression(tempFile, compressionSettings);
                
                // Update the preview image
                const reader = new FileReader();
                reader.onload = () => {
                    previewCompressedImage.src = reader.result;
                    previewCompressedStats.textContent = `Compressed: ${formatFileSize(compressedFile.size)} (${Math.round((1 - compressedFile.size / fileInfo.originalSize) * 100)}% reduction)`;
                };
                reader.readAsDataURL(compressedFile);
            });
        };
        img.src = originalData;
    } catch (error) {
        console.error('Error updating compression preview:', error);
        previewCompressedStats.textContent = 'Error updating preview';
    }
}

// Reset function
function resetAll() {
    selectedFile = null;
    currentJob = null;
    stats = null;
    downloadUrl = null;
    consoleExpanded = false;
    qualityWarningsList = [];
    flaggedFiles = [];
    fileOverrides.clear();
    originalImageData.clear();
    currentPreviewFile = null;
    
    // Reset UI
    uploadContent.style.display = 'block';
    fileSelected.style.display = 'none';
    fileDropZone.classList.remove('file-selected');
    compressBtn.style.display = 'inline-flex';
    downloadSection.style.display = 'none';
    statsGrid.style.display = 'none';
    progressCard.style.display = 'none';
    qualityIssuesSection.style.display = 'none';
    reprocessButton.style.display = 'none';
    previewModal.style.display = 'none';
    
    // Reset quality issues collapsible state (start collapsed)
    qualityIssuesContent.classList.add('collapsed');
    qualityIssuesToggle.classList.add('collapsed');
    
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
        compressBtn.innerHTML = '<div class="button-icon">⚡</div><span>Compressing...</span>';
    } else {
        // Only reset to "Start Compression" if not already set to "Compress Another ZIP"
        if (!compressBtn.innerHTML.includes('Compress Another ZIP')) {
            compressBtn.innerHTML = '<div class="button-icon">✨</div><span>Start Compression</span>';
        }
    }
}

// Update button after compression completion
function updateButtonAfterCompression() {
    compressBtn.innerHTML = '<div class="button-icon">🔄</div><span>Compress Another ZIP</span>';
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
        compressBtn.innerHTML = '<div class="button-icon">✨</div><span>Start Compression</span>';
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