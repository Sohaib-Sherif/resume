// PDF.js variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
// Set a much larger default scale for better readability
let scale = window.innerWidth < 768 ? 1.8 : 2.2;
let canvas = document.getElementById('pdf-render');
let ctx = canvas.getContext('2d');
let pdfViewport = null; // Store the viewport for reference

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

// Initialize the viewer
document.addEventListener('DOMContentLoaded', () => {
    // Update zoom level display to match initial scale
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    
    // Set the download button href to the default resume
    downloadBtn.href = resumePaths.full;
    
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
        pdfViewport = page.getViewport({ scale });
        canvas.height = pdfViewport.height;
        canvas.width = pdfViewport.width;
        
        // Render the PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport: pdfViewport
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
    if (scale >= 4.0) return; // Allow higher maximum zoom
    scale += 0.2;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    queueRenderPage(pageNum);
}

/**
 * Zoom out the PDF
 */
function zoomOutHandler() {
    if (scale <= 0.5) return; // Allow lower minimum zoom
    scale -= 0.2;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    queueRenderPage(pageNum);
}

/**
 * Toggle between full and condensed resume
 */
function toggleResume() {
    const isCondensed = resumeSwitch.checked;
    const resumePath = isCondensed ? resumePaths.condensed : resumePaths.full;
    
    // Reset page number
    pageNum = 1;
    
    // Update download button in the controls
    downloadBtn.href = resumePath;
    
    // Update hidden download links
    if (isCondensed) {
        downloadBtn.setAttribute('title', 'Download Condensed Resume');
    } else {
        downloadBtn.setAttribute('title', 'Download Full Resume');
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
            // Adjust scale based on screen width but preserve user's zoom level
            const currentZoomPercent = Math.round(scale * 100);
            const defaultZoom = window.innerWidth < 768 ? 1.8 : 2.2;
            const defaultZoomPercent = Math.round(defaultZoom * 100);
            
            // Only reset to default if user hasn't manually zoomed
            if (currentZoomPercent === defaultZoomPercent || 
                (window.innerWidth < 768 && currentZoomPercent > 220) || 
                (window.innerWidth >= 768 && currentZoomPercent < 180)) {
                scale = defaultZoom;
                zoomLevel.textContent = `${Math.round(scale * 100)}%`;
                queueRenderPage(pageNum);
            }
        }
    });
    
    // Add mouse wheel zoom support
    pdfContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomInHandler();
            } else {
                zoomOutHandler();
            }
        }
    }, { passive: false });
}
