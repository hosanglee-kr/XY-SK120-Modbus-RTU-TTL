/**
 * Component Loader
 * Dynamically loads HTML components into the page
 */

document.addEventListener('DOMContentLoaded', function() {
    loadComponents();
});

// Load components from the components directory
async function loadComponents() {
    const componentPlaceholders = document.querySelectorAll('[data-component]');
    
    for (const placeholder of componentPlaceholders) {
        const componentName = placeholder.getAttribute('data-component');
        
        try {
            const response = await fetch(`/components/${componentName}.html`);
            if (response.ok) {
                const html = await response.text();
                placeholder.outerHTML = html;
            } else {
                console.error(`Failed to load component: ${componentName}`);
                placeholder.outerHTML = `<div class="p-4 text-red-500">Failed to load ${componentName}</div>`;
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            placeholder.outerHTML = `<div class="p-4 text-red-500">Error loading ${componentName}</div>`;
        }
    }
    
    // Reinitialize scripts that depend on newly loaded components
    if (typeof initAllTabGroups === 'function') initAllTabGroups();
    if (typeof setupLogViewer === 'function') setupLogViewer();
}
