/**
 * Animated Splash Screen using anime.js
 * Creates dynamic loading animations for the XY-SK120 splash screen
 * This is the ONLY splash animation file - consolidating all functionality
 */

// Define the bolt animation globally so it can be referenced later
let boltAnimation = null;

// Configuration for splash animation
const SPLASH_CONFIG = {
    minDisplayTime: 2000,      // Minimum time splash is shown (ms)
    fadeOutDuration: 500,      // Duration of fade out animation (ms)
    progressStartWidth: 30,    // Starting width for progress bar (%)
    progressEndWidth: 100      // Final width for progress bar (%)
};

// Track when the splash screen was first shown
const splashStartTime = Date.now();

// Setup splash animation immediately
(function() {
    console.log("Splash animation immediate setup");
    
    // Ensure the splash screen is visible before any component loading
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.style.opacity = '1';
        splashScreen.style.visibility = 'visible';
    }
    
    // Make sure global app loading state object exists
    window.appLoadingState = window.appLoadingState || {
        componentsLoaded: false,
        coreScriptsLoaded: false,
        connectionEstablished: false,
        animationComplete: false
    };

    // Track when the splash screen was first shown
    window.splashStartTime = Date.now();
    
    // Minimum display time in milliseconds
    window.splashMinDisplayTime = 3000;
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log("Splash animation module loaded");
    
    // Check if anime.js is loaded
    if (typeof anime === 'undefined') {
        console.error('Anime.js is not loaded! Using fallback animations');
        setupFallbackAnimations();
    } else {
        // Initialize the animations
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
});

// Setup fallback animations using CSS if anime.js fails to load
function setupFallbackAnimations() {
    // Add fallback CSS classes to the elements
    const boltIcon = document.getElementById('bolt-icon');
    const statusText = document.getElementById('splash-status');
    const progressBar = document.getElementById('progress-bar');
    
    if (boltIcon) boltIcon.classList.add('fallback-fade-in');
    if (statusText) statusText.classList.add('fallback-fade-in');
    
    // Add basic CSS animation for progress bar
    if (progressBar) {
        progressBar.classList.add('fallback-progress');
    }
    
    // Still dispatch the animation complete event
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('splash-animation-complete'));
        window.appLoadingState.animationComplete = true;
    }, 1000);
}

// Initialize bolt animation with power colors
function animateBolt() {
    // Only run if anime.js is available
    if (typeof anime === 'undefined') {
        console.warn('anime.js not available, skipping bolt animation');
        return null;
    }
    
    // Create the bolt animation timeline
    boltAnimation = anime.timeline({
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate'
    });
    
    // Add animation sequences
    boltAnimation
        .add({
            targets: '#bolt-path',
            strokeWidth: [1.5, 2.5],
            fill: [
                { value: 'url(#boltGradient)' },
                { value: '#b73dff', duration: 800 }
            ],
            stroke: [
                { value: '#b73dff' },
                { value: '#64ff00', duration: 1200 }
            ],
            opacity: [0.8, 1],
            scale: [1, 1.05],
            duration: 3000
        })
        .add({
            targets: '#bolt-icon',
            rotate: [-5, 5],
            duration: 3000
        }, '-=3000');
    
    return boltAnimation;
}

// Initialize the splash screen animation
function initSplashAnimation() {
    console.log("Initializing splash animations with anime.js");
    
    // Start the bolt animation
    const animation = animateBolt();
    
    // Don't animate the bolt path again - it was already animated in the initial inline script
    // Just animate the extra details
    
    // Create the missing elements for advanced animation if they don't exist yet
    addAdvancedAnimationElements();
    
    // Pulsating rings animation
    const ringsAnimation = anime({
        targets: ['#voltage-ring', '#current-ring'],
        scale: [0.8, 1.1],
        opacity: [0, 0.5, 0],
        easing: 'easeInOutSine',
        duration: 2000,
        delay: anime.stagger(500),
        loop: true,
        direction: 'alternate'
    });
    
    // Power circle animations
    const powerCirclesAnimation = anime({
        targets: ['#power-circle-1', '#power-circle-2', '#power-circle-3', '#power-circle-4'],
        opacity: [0, 1],
        scale: [0, 1],
        easing: 'easeOutElastic(1, .6)',
        duration: 1200,
        delay: anime.stagger(200, {start: 1000}),
        endDelay: 500
    });
    
    // Electricity particles animation
    const particlesAnimation = anime({
        targets: '.electricity-particle',
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        translateX: () => anime.random(-15, 15),
        translateY: () => anime.random(-15, 15),
        easing: 'easeOutExpo',
        duration: 1500,
        delay: anime.stagger(200),
        loop: true,
        direction: 'alternate',
        loopBegin: function(anim) {
            document.querySelectorAll('.electricity-particle').forEach(particle => {
                particle.style.transformOrigin = '32px 32px';
                particle.setAttribute('cx', anime.random(10, 54));
                particle.setAttribute('cy', anime.random(10, 54));
            });
        }
    });
    
    // Animated counter values
    let voltageValue = { value: 0 };
    let currentValue = { value: 0 };
    let powerValue = { value: 0 };
    
    const counterAnimation = anime({
        targets: [voltageValue, currentValue, powerValue],
        value: function(target, i) {
            if (i === 0) return 30; // Voltage max
            if (i === 1) return 5; // Current max
            return 120; // Power max
        },
        round: function(target, i) {
            if (i === 0 || i === 1) return 100; // 2 decimal places for voltage and current
            return 10; // 1 decimal place for power
        },
        easing: 'easeInOutExpo',
        duration: 3000,
        update: function() {
            document.getElementById('voltage-value').innerText = 
                (voltageValue.value / 100).toFixed(2) + 'V';
            document.getElementById('current-value').innerText = 
                (currentValue.value / 100).toFixed(2) + 'A';
            document.getElementById('power-value').innerText = 
                (powerValue.value / 10).toFixed(1) + 'W';
        }
    });
    
    // Progress bar animation
    const progressAnimation = anime({
        targets: '#progress-bar',
        width: ['0%', '100%'],
        easing: 'easeInOutQuart',
        duration: 4000,
        direction: 'normal'
    });
    
    // Timeline to synchronize all animations
    const timeline = anime.timeline({
        easing: 'easeOutExpo',
        duration: 1000,
        complete: function() {
            console.log('Initial splash animation complete');
            // Dispatch event that splash animation is ready for content to load
            document.dispatchEvent(new CustomEvent('splash-animation-complete'));
            window.appLoadingState.animationComplete = true;
            updateProgress();
        }
    });
    
    // Add all animations to the timeline
    timeline
        .add({
            targets: '#bolt-icon',
            scale: [0.5, 1],
            opacity: [0, 1],
            easing: 'easeOutElastic(1, .8)',
            duration: 1200
        })
        .add({
            targets: '#splash-status',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800
        }, '-=800');
    
    // Update status text periodically
    const statusMessages = [
        "Initializing system...",
        "Loading components...",
        "Establishing connection...",
        "Calibrating...",
        "Almost ready..."
    ];
    
    let messageIndex = 0;
    const statusInterval = setInterval(() => {
        if (messageIndex < statusMessages.length) {
            updateSplashStatus(statusMessages[messageIndex]);
            messageIndex++;
        } else {
            clearInterval(statusInterval);
        }
    }, 800);
    
    // Expose the animation instances for external control
    window.splashAnimations = {
        bolt: boltAnimation,
        rings: ringsAnimation,
        powerCircles: powerCirclesAnimation,
        particles: particlesAnimation,
        counter: counterAnimation,
        progress: progressAnimation,
        timeline: timeline,
        pauseAll: function() {
            anime.running.forEach(anim => anim.pause());
        },
        resumeAll: function() {
            anime.running.forEach(anim => anim.play());
        }
    };
}

// Add advanced animation elements if they don't exist
function addAdvancedAnimationElements() {
    const boltIcon = document.getElementById('bolt-icon');
    
    // Check if electricity particles exist
    if (!document.getElementById('electricity-particles')) {
        // Create the particles group
        const particlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        particlesGroup.setAttribute('id', 'electricity-particles');
        
        // Create particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            particle.setAttribute('class', 'electricity-particle');
            particle.setAttribute('cx', 20 + i * 5);
            particle.setAttribute('cy', 20 + i * 3);
            particle.setAttribute('r', 0.8 + Math.random() * 0.5);
            particle.setAttribute('fill', i % 2 === 0 ? '#64ff00' : '#fff500');
            particle.setAttribute('opacity', '0');
            
            // Fix: Add particle to the group
            particlesGroup.appendChild(particle);
        }
        
        // Fix: Add the group to the SVG
        if (boltIcon) {
            boltIcon.appendChild(particlesGroup);
        }
    }
    
    // Check if power circles exist
    if (!document.getElementById('power-circle-1')) {
        const circles = [
            {id: 'power-circle-1', cx: 32, cy: 10, r: 2},
            {id: 'power-circle-2', cx: 32, cy: 54, r: 2},
            {id: 'power-circle-3', cx: 10, cy: 32, r: 2},
            {id: 'power-circle-4', cx: 54, cy: 32, r: 2}
        ];
        
        circles.forEach(circle => {
            const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circleEl.setAttribute('id', circle.id);
            circleEl.setAttribute('cx', circle.cx);
            circleEl.setAttribute('cy', circle.cy);
            circleEl.setAttribute('r', circle.r);
            circleEl.setAttribute('fill', '#b73dff');
            circleEl.setAttribute('opacity', '0');
            boltIcon.appendChild(circleEl);
        });
    }
    
    // Check if voltage/current rings exist
    const splashScreenDiv = document.getElementById('splash-screen');
    const boltIconParent = boltIcon.parentElement;
    
    if (!document.getElementById('voltage-ring')) {
        const voltageRing = document.createElement('div');
        voltageRing.setAttribute('id', 'voltage-ring');
        voltageRing.setAttribute('class', 'absolute inset-0 border-4 border-blue-500 rounded-full opacity-0');
        boltIconParent.appendChild(voltageRing);
    }
    
    if (!document.getElementById('current-ring')) {
        const currentRing = document.createElement('div');
        currentRing.setAttribute('id', 'current-ring');
        currentRing.setAttribute('class', 'absolute inset-0 border-4 border-yellow-400 rounded-full opacity-0');
        boltIconParent.appendChild(currentRing);
    }
    
    // Check if the measurement values exist
    if (!document.getElementById('voltage-value')) {
        // Create the measurement values container
        const measurementsDiv = document.createElement('div');
        measurementsDiv.setAttribute('class', 'flex items-center justify-center space-x-6 mb-6');
        
        // Add voltage measurement
        const voltageDiv = document.createElement('div');
        voltageDiv.setAttribute('class', 'flex flex-col items-center');
        const voltageValue = document.createElement('span');
        voltageValue.setAttribute('id', 'voltage-value');
        voltageValue.setAttribute('class', 'text-xl font-mono text-blue-500');
        voltageValue.textContent = '0.00V';
        const voltageLabel = document.createElement('span');
        voltageLabel.setAttribute('class', 'text-xs text-gray-500 dark:text-gray-400');
        voltageLabel.textContent = 'Voltage';
        voltageDiv.appendChild(voltageValue);
        voltageDiv.appendChild(voltageLabel);
        
        // Add divider
        const divider1 = document.createElement('div');
        divider1.setAttribute('class', 'h-8 w-px bg-gray-300 dark:bg-gray-700');
        
        // Add current measurement
        const currentDiv = document.createElement('div');
        currentDiv.setAttribute('class', 'flex flex-col items-center');
        const currentValue = document.createElement('span');
        currentValue.setAttribute('id', 'current-value');
        currentValue.setAttribute('class', 'text-xl font-mono text-yellow-500');
        currentValue.textContent = '0.00A';
        const currentLabel = document.createElement('span');
        currentLabel.setAttribute('class', 'text-xs text-gray-500 dark:text-gray-400');
        currentLabel.textContent = 'Current';
        currentDiv.appendChild(currentValue);
        currentDiv.appendChild(currentLabel);
        
        // Add divider
        const divider2 = document.createElement('div');
        divider2.setAttribute('class', 'h-8 w-px bg-gray-300 dark:bg-gray-700');
        
        // Add power measurement
        const powerDiv = document.createElement('div');
        powerDiv.setAttribute('class', 'flex flex-col items-center');
        const powerValue = document.createElement('span');
        powerValue.setAttribute('id', 'power-value');
        powerValue.setAttribute('class', 'text-xl font-mono text-purple-500');
        powerValue.textContent = '0.0W';
        const powerLabel = document.createElement('span');
        powerLabel.setAttribute('class', 'text-xs text-gray-500 dark:text-gray-400');
        powerLabel.textContent = 'Power';
        powerDiv.appendChild(powerValue);
        powerDiv.appendChild(powerLabel);
        
        // Assemble the measurements container
        measurementsDiv.appendChild(voltageDiv);
        measurementsDiv.appendChild(divider1);
        measurementsDiv.appendChild(currentDiv);
        measurementsDiv.appendChild(divider2);
        measurementsDiv.appendChild(powerDiv);
        
        // Insert before the progress bar
        const progressBarContainer = document.querySelector('.w-64.bg-gray-200');
        splashScreenDiv.insertBefore(measurementsDiv, progressBarContainer);
    }
}

// Update splash status text with animation
function updateSplashStatus(message) {
    const statusEl = document.getElementById('splash-status');
    if (!statusEl) return;
    
    if (typeof anime !== 'undefined') {
        anime({
            targets: statusEl,
            opacity: [1, 0.3, 1],
            translateY: [0, -5, 0],
            easing: 'easeInOutQuad',
            duration: 500,
            complete: function() {
                statusEl.textContent = message;
            }
        });
    } else {
        // Fallback if anime.js isn't loaded
        statusEl.textContent = message;
    }
}

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

// Function to hide splash screen with animation
function hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (!splashScreen) return;
    
    console.log("Hiding splash screen");
    
    // Use anime.js for a more elegant exit animation if available
    if (typeof anime !== 'undefined') {
        // Pause any running animations
        if (window.splashAnimations && typeof window.splashAnimations.pauseAll === 'function') {
            window.splashAnimations.pauseAll();
        }
        
        // Final animation sequence
        anime({
            targets: splashScreen,
            opacity: [1, 0],
            scale: [1, 1.05],
            easing: 'easeOutQuad',
            duration: 600,
            complete: function() {
                splashScreen.style.display = 'none';
                
                // Fire an event indicating splash screen is hidden
                document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
            }
        });
    } else {
        // Fallback to CSS transitions
        splashScreen.style.transition = `opacity ${SPLASH_CONFIG.fadeOutDuration}ms ease-out`;
        splashScreen.style.opacity = "0";
        
        // Hide completely after animation finishes
        setTimeout(() => {
            splashScreen.style.display = "none";
            // Fire an event indicating splash screen is hidden
            document.dispatchEvent(new CustomEvent('splash-screen-hidden'));
        }, SPLASH_CONFIG.fadeOutDuration);
    }
}

// Function to update splash progress percentage
function updateSplashProgress(percent, message) {
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('splash-status');
    
    // Validate percentage
    const validPercent = Math.min(Math.max(percent, 0), 100);
    
    // Update progress bar width
    if (progressBar) {
        if (typeof anime !== 'undefined') {
            anime({
                targets: progressBar,
                width: `${validPercent}%`,
                easing: 'easeInOutQuad',
                duration: 300
            });
        } else {
            progressBar.style.transition = "width 0.3s ease-out";
            progressBar.style.width = `${validPercent}%`;
        }
    }
    
    // Update status message if provided
    if (statusText && message) {
        statusText.textContent = message;
    }
}

// Skip the splash animation
function skipSplashAnimation() {
    hideSplashScreen();
}

// Make functions globally available
window.initSplashAnimation = initSplashAnimation;
window.updateSplashStatus = updateSplashStatus;
window.hideSplashScreen = hideSplashScreen;
window.updateSplashProgress = updateSplashProgress;
window.skipSplashAnimation = skipSplashAnimation;
