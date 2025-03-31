/**
 * Splash Screen functionality
 * Handles loading state and transitions with anime.js animations
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Splash screen module loaded");
    
    // Initialize splash screen
    initSplashScreen();
});

// Initialize splash screen functionality
function initSplashScreen() {
    // Make sure global app loading state object exists
    window.appLoadingState = window.appLoadingState || {
        componentsLoaded: false,
        coreScriptsLoaded: false,
        connectionEstablished: false,
        animationComplete: false
    };

    // Track when the splash screen was first shown
    window.splashStartTime = Date.now();
    
    // Minimum display time in milliseconds (2 seconds)
    window.splashMinDisplayTime = 3000;

    // The splash screen is already showing, we don't need to load it from components
    // Just initialize the animations on the existing splash screen
    if (typeof initSplashAnimation === 'function') {
        initSplashAnimation();
    }

    // Listen for component loading completion
    document.addEventListener('components-loaded', function() {
        console.log('All components loaded, updating splash screen');
        updateSplashStatus("UI components loaded");
        window.appLoadingState.componentsLoaded = true;
        updateProgress();
        checkAndHideSplashScreen();
    });
    
    // Listen for core script loading completion
    document.addEventListener('core-scripts-loaded', function() {
        console.log('Core scripts loaded, updating splash screen');
        updateSplashStatus("Core scripts loaded");
        window.appLoadingState.coreScriptsLoaded = true;
        updateProgress();
        checkAndHideSplashScreen();
    });
    
    // Listen for WebSocket connection
    document.addEventListener('websocket-connected', function() {
        console.log('WebSocket connected, updating splash screen');
        updateSplashStatus("Connected to device");
        window.appLoadingState.connectionEstablished = true;
        updateProgress();
    });
    
    // Listen for splash animation completion
    document.addEventListener('splash-animation-complete', function() {
        console.log('Splash animation complete');
        window.appLoadingState.animationComplete = true;
        updateProgress();
    });
    
    // Update progress based on loading state
    function updateProgress() {
        let progress = 30; // Start at 30% (initial animation already showed this)
        
        // Calculate progress based on loading state
        if (window.appLoadingState.animationComplete) progress += 10;
        if (window.appLoadingState.componentsLoaded) progress += 30;
        if (window.appLoadingState.coreScriptsLoaded) progress += 20;
        if (window.appLoadingState.connectionEstablished) progress += 10;
        
        // Cap at 100%
        progress = Math.min(progress, 100);
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar && typeof anime !== 'undefined') {
            anime({
                targets: progressBar,
                width: progress + '%',
                easing: 'easeInOutQuad',
                duration: 300
            });
        } else if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }
    
    // Set a maximum time for the splash screen (failsafe)
    setTimeout(function() {
        forceHideSplashScreen();
    }, 10000); // Force hide after 10 seconds max
}

// Update the splash screen status message with animation
window.updateSplashStatus = function(message) {
    if (window.updateSplashStatusWithAnimation) {
        window.updateSplashStatusWithAnimation(message);
    } else {
        const statusEl = document.getElementById('splash-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
};

// Check conditions and hide splash screen if appropriate
function checkAndHideSplashScreen() {
    if (window.appLoadingState.componentsLoaded && 
        window.appLoadingState.coreScriptsLoaded) {
        
        updateSplashStatus("Application ready!");
        
        // Calculate how long the splash screen has been displayed
        const currentTime = Date.now();
        const elapsedTime = currentTime - window.splashStartTime;
        
        // If we haven't displayed for minimum time, wait until we have
        if (elapsedTime < window.splashMinDisplayTime) {
            const remainingTime = window.splashMinDisplayTime - elapsedTime;
            console.log(`Splash screen displayed for ${elapsedTime}ms, waiting another ${remainingTime}ms to meet minimum time`);
            setTimeout(hideSplashScreen, remainingTime);
        } else {
            // We've already shown the splash screen for the minimum time
            console.log(`Splash screen already displayed for ${elapsedTime}ms, can hide now`);
            setTimeout(hideSplashScreen, 200); // Small delay for visual smoothness
        }
    }
}

// Hide the splash screen with animation
function hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        // Use anime.js for a more elegant exit animation if available
        if (typeof anime !== 'undefined') {
            // Pause any running animations
            if (window.splashAnimations) {
                window.splashAnimations.pauseAll();
            }
            
            // Final animation sequence
            anime({
                targets: splashScreen,
                opacity: [1, 0],
                scale: [1, 1.05],
                easing: 'easeOutQuad',
                duration: 1000,
                complete: function() {
                    splashScreen.classList.add('hidden');
                    
                    // Optional: Dispatch event that splash screen is hidden
                    document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
                }
            });
        } else {
            // Fallback to CSS transitions
            splashScreen.classList.add('opacity-0');
            setTimeout(function() {
                splashScreen.classList.add('hidden');
                
                // Optional: Dispatch event that splash screen is hidden
                document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
            }, 500);
        }
    }
}

// Force hide the splash screen regardless of loading state
function forceHideSplashScreen() {
    // Calculate how long the splash screen has been displayed
    const currentTime = Date.now();
    const elapsedTime = currentTime - window.splashStartTime;
    
    // Still respect the minimum display time
    if (elapsedTime < window.splashMinDisplayTime) {
        const remainingTime = window.splashMinDisplayTime - elapsedTime;
        console.log(`Force hide requested but waiting ${remainingTime}ms to meet minimum display time`);
        setTimeout(function() {
            console.log("Force hiding splash screen after minimum time");
            updateSplashStatus("Starting application...");
            hideSplashScreen();
        }, remainingTime);
    } else {
        console.log("Force hiding splash screen (timeout)");
        updateSplashStatus("Starting application...");
        hideSplashScreen();
    }
}

// Export functions for external use
window.updateSplashStatus = updateSplashStatus;
window.hideSplashScreen = hideSplashScreen;
window.forceHideSplashScreen = forceHideSplashScreen;
