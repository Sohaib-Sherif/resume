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

// DOM Elements - Desktop
const fullResumeBtnDesktop = document.getElementById('full-resume-btn-desktop');
const condensedResumeBtnDesktop = document.getElementById('condensed-resume-btn-desktop');
const zoomInDesktop = document.getElementById('zoom-in-desktop');
const zoomOutDesktop = document.getElementById('zoom-out-desktop');
const zoomLevelDesktop = document.getElementById('zoom-level-desktop');
const prevPageDesktop = document.getElementById('prev-page-desktop');
const nextPageDesktop = document.getElementById('next-page-desktop');
const currentPageDesktop = document.getElementById('current-page-desktop');
const totalPagesDesktop = document.getElementById('total-pages-desktop');
const downloadBtnDesktop = document.getElementById('download-btn-desktop');

// DOM Elements - Mobile
const fullResumeBtnMobile = document.getElementById('full-resume-btn-mobile');
const condensedResumeBtnMobile = document.getElementById('condensed-resume-btn-mobile');
const zoomInMobile = document.getElementById('zoom-in-mobile');
const zoomOutMobile = document.getElementById('zoom-out-mobile');
const zoomLevelMobile = document.getElementById('zoom-level-mobile');
const prevPageMobile = document.getElementById('prev-page-mobile');
const nextPageMobile = document.getElementById('next-page-mobile');
const currentPageMobile = document.getElementById('current-page-mobile');
const totalPagesMobile = document.getElementById('total-pages-mobile');
const downloadBtnMobile = document.getElementById('download-btn-mobile');

// Common DOM Elements
const downloadFullBtn = document.getElementById('download-full-btn');
const downloadCondensedBtn = document.getElementById('download-condensed-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const pdfContainer = document.querySelector('.pdf-container');
const loadingIndicator = document.querySelector('.loading-indicator');

// Initialize the viewer
document.addEventListener('DOMContentLoaded', () => {
    // Update zoom level display to match initial scale
    updateZoomLevels();
    
    // Set the download button href to the default resume
    downloadBtnDesktop.href = resumePaths.full;
    downloadBtnMobile.href = resumePaths.full;
    
    // Load the default resume (full version)
    loadPdf(resumePaths.full);
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Update all zoom level displays
 */
function updateZoomLevels() {
    const zoomPercent = `${Math.round(scale * 100)}%`;
    zoomLevelDesktop.textContent = zoomPercent;
    zoomLevelMobile.textContent = zoomPercent;
}

/**
 * Update all page number displays
 */
function updatePageNumbers() {
    currentPageDesktop.textContent = pageNum;
    currentPageMobile.textContent = pageNum;
}

/**
 * Update all total pages displays
 */
function updateTotalPages(total) {
    totalPagesDesktop.textContent = total;
    totalPagesMobile.textContent = total;
}

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
        updateTotalPages(pdf.numPages);
        
        // Set download links
        downloadBtnDesktop.href = url;
        downloadBtnMobile.href = url;
        
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
            
            // Update current page display on both navbars
            updatePageNumbers();
            
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
    updateZoomLevels();
    queueRenderPage(pageNum);
}

/**
 * Zoom out the PDF
 */
function zoomOutHandler() {
    if (scale <= 0.5) return; // Allow lower minimum zoom
    scale -= 0.2;
    updateZoomLevels();
    queueRenderPage(pageNum);
}

/**
 * Toggle between full and condensed resume
 * @param {boolean} isCondensed - Whether to show the condensed resume
 */
function toggleResume(isCondensed) {
    const resumePath = isCondensed ? resumePaths.condensed : resumePaths.full;
    
    // Update active button styling for both desktop and mobile
    if (isCondensed) {
        // Desktop buttons
        fullResumeBtnDesktop.classList.remove('toggle-button-active');
        condensedResumeBtnDesktop.classList.add('toggle-button-active');
        
        // Mobile buttons
        fullResumeBtnMobile.classList.remove('toggle-button-active');
        condensedResumeBtnMobile.classList.add('toggle-button-active');
        
        // Update download button titles
        downloadBtnDesktop.setAttribute('title', 'Download Condensed Resume');
        downloadBtnMobile.setAttribute('title', 'Download Condensed Resume');
    } else {
        // Desktop buttons
        fullResumeBtnDesktop.classList.add('toggle-button-active');
        condensedResumeBtnDesktop.classList.remove('toggle-button-active');
        
        // Mobile buttons
        fullResumeBtnMobile.classList.add('toggle-button-active');
        condensedResumeBtnMobile.classList.remove('toggle-button-active');
        
        // Update download button titles
        downloadBtnDesktop.setAttribute('title', 'Download Full Resume');
        downloadBtnMobile.setAttribute('title', 'Download Full Resume');
    }
    
    // Reset page number
    pageNum = 1;
    
    // Update download buttons in the controls
    downloadBtnDesktop.href = resumePath;
    downloadBtnMobile.href = resumePath;
    
    // Load the selected resume
    loadPdf(resumePath);
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Resume toggle buttons - Desktop
    fullResumeBtnDesktop.addEventListener('click', () => toggleResume(false));
    condensedResumeBtnDesktop.addEventListener('click', () => toggleResume(true));
    
    // Resume toggle buttons - Mobile
    fullResumeBtnMobile.addEventListener('click', () => toggleResume(false));
    condensedResumeBtnMobile.addEventListener('click', () => toggleResume(true));
    
    // Zoom controls - Desktop
    zoomInDesktop.addEventListener('click', zoomInHandler);
    zoomOutDesktop.addEventListener('click', zoomOutHandler);
    
    // Zoom controls - Mobile
    zoomInMobile.addEventListener('click', zoomInHandler);
    zoomOutMobile.addEventListener('click', zoomOutHandler);
    
    // Page navigation - Desktop
    prevPageDesktop.addEventListener('click', prevPageHandler);
    nextPageDesktop.addEventListener('click', nextPageHandler);
    
    // Page navigation - Mobile
    prevPageMobile.addEventListener('click', prevPageHandler);
    nextPageMobile.addEventListener('click', nextPageHandler);
    
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
                updateZoomLevels();
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
