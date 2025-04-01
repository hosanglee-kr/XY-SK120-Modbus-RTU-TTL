/**
 * Component Initializer
 * Loads HTML components and injects them into the page
 */

document.addEventListener('DOMContentLoaded', function() {
    // First, try to load components that are immediately visible
    const componentsToLoadFirst = document.querySelectorAll('[data-component="splash-screen"], [data-component="navbar"], [data-component="power-supply-readings"]');
    
    // Then load the rest of the components
    const allComponents = document.querySelectorAll('[data-component]');
    
    // Track how many components we've loaded
    let loadedCount = 0;
    const totalCount = allComponents.length;
    
    // Show loading indicator for components
    function showLoadingStatus() {
        // Update splash screen progress if it exists
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const percent = Math.min(30 + (loadedCount / totalCount * 70), 100); // Start at 30%, go to 100%
            progressBar.style.width = `${percent}%`;
        }
    }
    
    // Show error status for component loading
    function showErrorStatus(componentName, errorMessage) {
        console.error(`Failed to load component: ${componentName}`, errorMessage);
        
        // Create error placeholder with helpful message
        const errorElement = document.createElement('div');
        errorElement.className = 'rounded-md bg-red-50 dark:bg-red-900/20 p-4 mt-2 mb-4';
        errorElement.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Failed to load component: ${componentName}</h3>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">${errorMessage}</div>
                </div>
            </div>
        `;
        
        return errorElement;
    }
    
    // Load a single component
    function loadComponent(component) {
        const componentName = component.getAttribute('data-component');
        const componentPath = `components/${componentName}.html`;
        
        return fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Insert component HTML
                component.innerHTML = html;
                component.classList.remove('hidden');
                
                // Mark as loaded and update counter
                component.setAttribute('data-loaded', 'true');
                loadedCount++;
                showLoadingStatus();
                
                return true;
            })
            .catch(error => {
                console.error(`Error loading component ${componentName}:`, error);
                component.appendChild(showErrorStatus(componentName, error.message));
                
                // Count as loaded even though it failed
                loadedCount++;
                showLoadingStatus();
                
                return false;
            });
    }
    
    // Load priority components first (visible ones)
    const priorityPromises = Array.from(componentsToLoadFirst).map(component => {
        return loadComponent(component);
    });
    
    // Then load the rest of the components
    Promise.all(priorityPromises).then(() => {
        const remainingComponents = Array.from(allComponents).filter(component => {
            return !component.hasAttribute('data-loaded');
        });
        
        // Load remaining components
        const remainingPromises = remainingComponents.map(component => {
            return loadComponent(component);
        });
        
        // When all components are loaded
        Promise.all(remainingPromises).then(() => {
            // Dispatch event that all components are loaded
            document.dispatchEvent(new Event('components-loaded'));
            console.log('All components loaded');
        });
    });
});
