/**
 * Component Loader
 * Dynamically loads HTML components into the page
 */

document.addEventListener('DOMContentLoaded', function() {
    loadComponents();
});

// Load components from the components directory
async function loadComponents() {
    console.log("Starting component loading...");
    const componentPlaceholders = document.querySelectorAll('[data-component]');
    
    if (componentPlaceholders.length === 0) {
        console.log("No components to load");
        return;
    }
    
    console.log(`Found ${componentPlaceholders.length} components to load`);
    let loadedCount = 0;
    
    const loadPromises = Array.from(componentPlaceholders).map(async placeholder => {
        const componentName = placeholder.getAttribute('data-component');
        
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
                
                loadedCount++;
                console.log(`Component loaded (${loadedCount}/${componentPlaceholders.length}): ${componentName}`);
                return true;
            } else {
                console.error(`Failed to load component: ${componentName} (Status: ${response.status})`);
                placeholder.innerHTML = `<div class="p-4 text-red-500">Failed to load ${componentName}</div>`;
                return false;
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            placeholder.innerHTML = `<div class="p-4 text-red-500">Error loading ${componentName}</div>`;
            return false;
        }
    });
    
    // Wait for all components to load
    await Promise.all(loadPromises);
    
    console.log("All components loaded, processing...");
    
    // Give a short delay to ensure DOM is updated before firing the event
    setTimeout(() => {
        // Dispatch an event when all components are loaded
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
