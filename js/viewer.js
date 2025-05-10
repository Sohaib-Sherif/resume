// PDF.js variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
// Set a larger default scale for better readability
let scale = window.innerWidth < 768 ? 1.2 : 1.5;
let canvas = document.getElementById('pdf-render');
let ctx = canvas.getContext('2d');

// Resume paths
const resumePaths = {
    full: 'resume.pdf',
    condensed: 'resume_condensed.pdf'
};

// DOM Elements
const resumeSwitch = document.getElementById('resume-switch');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');
const zoomLevel = document.getElementById('zoom-level');
const prevPage = document.getElementById('prev-page');
const nextPage = document.getElementById('next-page');
const currentPage = document.getElementById('current-page');
const totalPages = document.getElementById('total-pages');
const downloadBtn = document.getElementById('download-btn');
const downloadFullBtn = document.getElementById('download-full-btn');
const downloadCondensedBtn = document.getElementById('download-condensed-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const pdfContainer = document.querySelector('.pdf-container');
const loadingIndicator = document.querySelector('.loading-indicator');
const currentYear = document.getElementById('current-year');

// Initialize the viewer
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Update zoom level display to match initial scale
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    
    // Set the full resume button as active by default
    downloadFullBtn.classList.add('active');
    
    // Load the default resume (full version)
    loadPdf(resumePaths.full);
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Load a PDF file
 * @param {string} url - The URL of the PDF file to load
 */
function loadPdf(url) {
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Load the PDF
    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDoc = pdf;
        totalPages.textContent = pdf.numPages;
        
        // Set download link
        downloadBtn.href = url;
        
        // Render the first page
        renderPage(pageNum);
    }).catch(error => {
        console.error('Error loading PDF:', error);
        loadingIndicator.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c;"></i>
                <p>Failed to load the PDF. Please try again later.</p>
            </div>
        `;
    });
}

/**
 * Render a specific page of the PDF
 * @param {number} num - The page number to render
 */
function renderPage(num) {
    pageRendering = true;
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Get the page
    pdfDoc.getPage(num).then(page => {
        // Adjust canvas size based on the PDF page and scale
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // Wait for rendering to finish
        renderTask.promise.then(() => {
            pageRendering = false;
            loadingIndicator.style.display = 'none';
            
            // Update current page display
            currentPage.textContent = num;
            
            // Check if there's a pending page
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

/**
 * Queue a page for rendering
 * @param {number} num - The page number to queue
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

/**
 * Go to the previous page
 */
function prevPageHandler() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

/**
 * Go to the next page
 */
function nextPageHandler() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

/**
 * Zoom in the PDF
 */
function zoomInHandler() {
    if (scale >= 2.0) return;
    scale += 0.1;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    queueRenderPage(pageNum);
}

/**
 * Zoom out the PDF
 */
function zoomOutHandler() {
    if (scale <= 0.5) return;
    scale -= 0.1;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    queueRenderPage(pageNum);
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    pdfContainer.classList.toggle('fullscreen-mode');
    
    if (pdfContainer.classList.contains('fullscreen-mode')) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Fullscreen';
    }
    
    // Re-render the current page to adjust to the new container size
    queueRenderPage(pageNum);
}

/**
 * Toggle between full and condensed resume
 */
function toggleResume() {
    const isCondensed = resumeSwitch.checked;
    const resumePath = isCondensed ? resumePaths.condensed : resumePaths.full;
    
    // Reset page number and scale
    pageNum = 1;
    
    // Update download button in the controls
    downloadBtn.href = resumePath;
    
    // Add visual indication of which version is active
    if (isCondensed) {
        downloadFullBtn.classList.remove('active');
        downloadCondensedBtn.classList.add('active');
    } else {
        downloadFullBtn.classList.add('active');
        downloadCondensedBtn.classList.remove('active');
    }
    
    // Load the selected resume
    loadPdf(resumePath);
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Resume toggle
    resumeSwitch.addEventListener('change', toggleResume);
    
    // Zoom controls
    zoomIn.addEventListener('click', zoomInHandler);
    zoomOut.addEventListener('click', zoomOutHandler);
    
    // Page navigation
    prevPage.addEventListener('click', prevPageHandler);
    nextPage.addEventListener('click', nextPageHandler);
    
    // Fullscreen toggle
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevPageHandler();
        } else if (e.key === 'ArrowRight') {
            nextPageHandler();
        } else if (e.key === '+') {
            zoomInHandler();
        } else if (e.key === '-') {
            zoomOutHandler();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (pdfDoc) {
            // Adjust scale based on screen width
            if (window.innerWidth < 768 && scale > 1.3) {
                scale = 1.2;
                zoomLevel.textContent = `${Math.round(scale * 100)}%`;
            } else if (window.innerWidth >= 768 && scale < 1.3) {
                scale = 1.5;
                zoomLevel.textContent = `${Math.round(scale * 100)}%`;
            }
            queueRenderPage(pageNum);
        }
    });
}
