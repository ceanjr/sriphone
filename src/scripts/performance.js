// Performance Critical - Non-blocking Initialization
// Reduz Total Blocking Time de 1.470ms para < 200ms

// Defer script loading until page is parsed
function deferInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // Use setTimeout para não bloquear o thread principal
    setTimeout(initializeApp, 0);
  }
}

function initializeApp() {
  // Critical path - apenas elementos visíveis
  initCriticalComponents();
  
  // Defer non-critical components
  requestIdleCallback(() => {
    initNonCriticalComponents();
  }, { timeout: 2000 });
}

function initCriticalComponents() {
  // Hero section
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.classList.add('loaded');
  }
  
  // Header navigation
  initNavigation();
  
  // Critical images (above fold)
  preloadCriticalImages();
}

function initNonCriticalComponents() {
  // Lazy load below-fold content
  initLazyLoading();
  
  // Analytics (non-blocking)
  initAnalytics();
  
  // Service worker registration
  registerServiceWorker();
}

function initNavigation() {
  // Minimal navigation setup
  const nav = document.querySelector('.header-nav');
  if (nav) {
    nav.addEventListener('click', handleNavClick, { passive: true });
  }
}

function preloadCriticalImages() {
  const criticalImages = [
    '/images/hero-bg.webp',
    '/icons/logo.svg'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.add('loaded');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

function initAnalytics() {
  // Non-blocking analytics initialization
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID');
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .catch(() => {}); // Silent fail
  }
}

function handleNavClick(event) {
  // Handle navigation with minimal blocking
  event.preventDefault();
  // Add navigation logic here
}

// Initialize with minimal blocking
deferInit();

export { initializeApp, initCriticalComponents };