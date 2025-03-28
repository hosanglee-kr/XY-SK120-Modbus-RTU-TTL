// Consolidated splash screen and utility scripts

document.addEventListener('DOMContentLoaded', function() {
    // Splash screen handling
    const splashScreen = document.getElementById('splash-screen');
    const container = document.querySelector('.container');
    
    // Track start time for minimum display duration
    const startTime = Date.now();
    const minDisplayTime = 1500; // 1.5 seconds minimum
    
    // Fade in splash screen immediately
    setTimeout(() => splashScreen.classList.add('fade-in'), 10);
    
    // Function to handle resources loaded
    const checkResourcesLoaded = function() {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        if (document.readyState === 'complete') {
            // Wait for minimum display time before fading out
            setTimeout(() => {
                // Show main content with fade-in
                container.style.opacity = '1';
                
                // Hide splash screen
                splashScreen.classList.remove('fade-in');
                splashScreen.classList.add('fade-out');
                
                // Remove splash after animation completes
                setTimeout(() => splashScreen.style.display = 'none', 500);
            }, remainingTime);
            
            // Remove listener
            window.removeEventListener('load', checkResourcesLoaded);
        }
    };
    
    // Listen for window load event
    window.addEventListener('load', checkResourcesLoaded);
    
    // Fallback to hide splash screen after 8 seconds
    setTimeout(() => {
        container.style.opacity = '1';
        splashScreen.classList.remove('fade-in');
        splashScreen.classList.add('fade-out');
        setTimeout(() => splashScreen.style.display = 'none', 500);
    }, 8000);
    
    // Backup script to ensure page loads even if main.js fails
    setTimeout(() => {
        const psuVoltage = document.getElementById('psu-voltage');
        if (psuVoltage && psuVoltage.textContent === '--') {
            console.log('Main script may not have loaded properly, manually fetching data');
            fetch('/api/data')
                .then(response => response.json())
                .then(data => {
                    // Update power supply values
                    if (psuVoltage && data.voltage !== undefined) {
                        psuVoltage.textContent = parseFloat(data.voltage).toFixed(2);
                    }
                    
                    const psuCurrent = document.getElementById('psu-current');
                    const psuPower = document.getElementById('psu-power');
                    const outputStatus = document.getElementById('output-status');
                    
                    if (psuCurrent && data.current !== undefined) {
                        psuCurrent.textContent = parseFloat(data.current).toFixed(3);
                    }
                    
                    if (psuPower && data.power !== undefined) {
                        psuPower.textContent = parseFloat(data.power).toFixed(1);
                    }
                    
                    if (outputStatus && data.outputEnabled !== undefined) {
                        outputStatus.textContent = data.outputEnabled ? "ON" : "OFF";
                        outputStatus.className = data.outputEnabled ? "status-value on" : "status-value off";
                    }
                })
                .catch(error => console.error('Backup fetch error:', error));
        }
    }, 2000);
    
    // iOS touch optimization
    const iOSDevice = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (iOSDevice) {
        // Smooth scrolling fixes
        document.addEventListener('touchmove', e => {
            if (document.body.classList.contains('swiping') && e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add momentum scrolling for cards
        document.querySelectorAll('.card').forEach(card => {
            card.style.WebkitOverflowScrolling = 'touch';
        });
    }
    
    // Add touch feedback to buttons
    document.querySelectorAll('button').forEach(button => {
        ['touchstart', 'touchend', 'touchcancel'].forEach(event => {
            button.addEventListener(event, () => {
                if (event === 'touchstart') {
                    button.classList.add('touch-active');
                } else {
                    button.classList.remove('touch-active');
                }
            });
        });
    });
});
