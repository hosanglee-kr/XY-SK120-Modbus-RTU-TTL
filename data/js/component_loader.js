/**
 * Component Loader
 * Loads HTML components into placeholders
 */

// Ensure splash screen is visible during component loading
(function() {
    // Ensure the splash screen is visible
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && !splashScreen.style.opacity) {
        splashScreen.style.opacity = '1';
    }
})();

// Wait for DOM content to be loaded before loading components
document.addEventListener('DOMContentLoaded', function() {
    // Track loaded components
    const componentPlaceholders = document.querySelectorAll('[data-component]');
    const totalComponents = componentPlaceholders.length;
    let loadedComponents = 0;
    
    // Update the splash screen with component loading progress
    function updateLoadingProgress() {
        if (window.updateSplashStatus) {
            window.updateSplashStatus(`Loading components (${loadedComponents}/${totalComponents})...`);
        }
        
        // Update progress bar if it exists
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const initialProgress = 30; // Starting progress percentage
            const progressPerComponent = (70 - initialProgress) / totalComponents;
            const currentProgress = initialProgress + (progressPerComponent * loadedComponents);
            
            if (typeof anime !== 'undefined') {
                anime({
                    targets: progressBar,
                    width: `${currentProgress}%`,
                    easing: 'easeInOutQuad',
                    duration: 300
                });
            } else {
                progressBar.style.width = `${currentProgress}%`;
            }
        }
    }
    
    // Load each component
    componentPlaceholders.forEach(function(placeholder) {
        const componentName = placeholder.getAttribute('data-component');
        
        (async function() {
            try {
                console.log(`Loading component: ${componentName}`);
                // Fix the path to components - using relative path to current domain
                const response = await fetch(`components/${componentName}.html`);
                if (response.ok) {
                    const html = await response.text();
                    placeholder.innerHTML = html;
                    
                    // Execute any scripts that might be in the component
                    const scripts = placeholder.querySelectorAll('script');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        Array.from(script.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        newScript.textContent = script.textContent;
                        script.parentNode.replaceChild(newScript, script);
                    });
                    
                    loadedComponents++;
                    updateLoadingProgress();
                    
                    console.log(`Component loaded (${loadedComponents}/${totalComponents}): ${componentName}`);
                    
                    // If all components are loaded, dispatch the event
                    if (loadedComponents === totalComponents) {
                        setTimeout(() => {
                            console.log("Firing components-loaded event");
                            document.dispatchEvent(new CustomEvent('components-loaded'));
                            
                            // Reinitialize scripts that depend on newly loaded components
                            if (typeof initAllTabGroups === 'function') {
                                console.log("Initializing tab groups");
                                initAllTabGroups();
                            }
                            
                            if (typeof setupLogViewer === 'function') {
                                console.log("Setting up log viewer");
                                setupLogViewer();
                            }
                        }, 200);
                    }
                } else {
                    console.error(`Failed to load component: ${componentName} (Status: ${response.status})`);
                    placeholder.innerHTML = `<div class="p-4 text-red-500">Failed to load ${componentName}</div>`;
                }
            } catch (error) {
                console.error(`Error loading component ${componentName}:`, error);
                placeholder.innerHTML = `<div class="p-4 text-red-500">Error loading ${componentName}</div>`;
            }
        })();
    });
});
