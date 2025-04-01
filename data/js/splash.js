/**
 * Splash screen animation for XY-SK120
 * Uses anime.js for animations
 * Optimized for offline access and embedded systems
 */

// Import anime.js from local library (not CDN)
import anime from './lib/anime.min.js';

// Configuration options for the splash animation
const SPLASH_CONFIG = {
    duration: 1500,         // Total animation duration
    logoScale: [0.5, 1],    // Logo scale from -> to
    logoOpacity: [0, 1],    // Logo opacity from -> to
    textDelay: 300,         // Delay before text appears
    textDuration: 800,      // Text animation duration
    containerFadeDelay: 2000, // Delay before container fades
    containerFadeDuration: 800 // Container fade duration
};

/**
 * Initialize and run the splash screen animation
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} - Animation timeline that can be controlled
 */
export function initSplashAnimation(options = {}) {
    // Merge default config with any provided options
    const config = { ...SPLASH_CONFIG, ...options };
    
    // Make sure anime.js is available
    if (typeof anime !== 'function') {
        console.error('anime.js library not found. Splash animation will not work.');
        return null;
    }

    // Get the splash screen container
    const splashContainer = document.getElementById('splash-screen');
    if (!splashContainer) {
        console.error('Splash screen container not found. Animation cannot run.');
        return null;
    }

    // Get animation elements
    const boltPath = document.getElementById('bolt-path');
    const title = document.querySelector('#splash-screen h1');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('splash-status');
    
    // Make sure the splash screen is visible
    splashContainer.style.display = 'flex';
    
    // Create animation timeline
    const timeline = anime.timeline({
        easing: 'easeOutExpo',
        complete: function() {
            console.log('Splash animation completed');
            // Dispatch an event to notify other scripts that splash is complete
            document.dispatchEvent(new CustomEvent('splash-animation-complete'));
        }
    });
    
    // Add bolt icon animation to timeline
    if (boltPath) {
        timeline.add({
            targets: boltPath,
            opacity: [0.7, 1],
            scale: config.logoScale,
            easing: 'easeOutCirc',
            duration: config.duration
        });
    }
    
    // Add title animation
    if (title) {
        timeline.add({
            targets: title,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: config.textDuration,
            easing: 'easeOutQuad'
        }, `-=${config.duration - config.textDelay}`);
    }
    
    // Add progress bar animation
    if (progressBar) {
        timeline.add({
            targets: progressBar,
            width: ['30%', '90%'],
            duration: 2000,
            easing: 'easeInOutQuad'
        }, `-=${config.textDuration - 100}`);
    }
    
    // Add status text update
    if (statusText) {
        timeline.add({
            targets: statusText,
            opacity: [0.7, 1],
            duration: 500,
            easing: 'easeInOutQuad',
            begin: function() {
                statusText.textContent = 'Loading application...';
            }
        }, `-=${config.textDuration - 200}`);
    }
    
    // Add final container fade out animation (triggered after a delay)
    timeline.add({
        targets: splashContainer,
        opacity: 0,
        duration: config.containerFadeDuration,
        easing: 'easeInQuad',
        complete: function() {
            // Hide container when animation completes
            splashContainer.style.display = 'none';
            
            // Dispatch an event to notify other scripts that splash is fully hidden
            document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
        }
    }, `+=${config.containerFadeDelay}`);
    
    // Log that animation has started
    console.log('Splash screen animation started');
    
    // Return the timeline for external control
    return timeline;
}

/**
 * Skip the splash animation and hide the splash screen immediately
 */
export function skipSplashAnimation() {
    const splashContainer = document.getElementById('splash-screen');
    if (splashContainer) {
        // Immediately hide the splash screen
        splashContainer.style.opacity = 0;
        splashContainer.style.display = 'none';
        
        // Dispatch events to maintain compatibility
        document.dispatchEvent(new CustomEvent('splash-animation-complete'));
        document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
        
        console.log('Splash animation skipped');
    }
}

/**
 * Update the progress bar in the splash screen
 * @param {number} percent - Progress percentage (0-100)
 */
export function updateSplashProgress(percent) {
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('splash-status');
    const validPercent = Math.min(Math.max(percent, 0), 100);
    
    if (progressBar && typeof anime === 'function') {
        anime({
            targets: progressBar,
            width: `${validPercent}%`,
            duration: 300,
            easing: 'easeOutQuad'
        });
    } else if (progressBar) {
        // Fallback if anime.js isn't loaded
        progressBar.style.width = `${validPercent}%`;
    }
    
    // Optionally update status text if message provided
    if (statusText && arguments.length > 1 && arguments[1]) {
        statusText.textContent = arguments[1];
    }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-start if configured to do so
    const autoStart = localStorage.getItem('skipSplash') !== 'true';
    
    if (autoStart) {
        // Run the animation with a slight delay to let everything render
        setTimeout(() => {
            initSplashAnimation();
        }, 100);
    } else {
        skipSplashAnimation();
    }
});

// Export functions for external use
window.initSplashAnimation = initSplashAnimation;
window.skipSplashAnimation = skipSplashAnimation;
window.updateSplashProgress = updateSplashProgress;
