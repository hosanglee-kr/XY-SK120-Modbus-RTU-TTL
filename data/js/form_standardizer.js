/**
 * Form Standardizer
 * Ensures consistent form element styling with Tailwind CSS
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Form standardizer loaded");
    standardizeFormElements();
    
    // Add a mutation observer to handle dynamically added elements
    observeDOMChanges();
});

/**
 * Apply standardized Tailwind classes to all form elements
 */
function standardizeFormElements() {
    // Update all text/number/email/password inputs
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]')
        .forEach(input => {
            // Skip inputs inside specific components that have custom styling
            if (input.closest('.toggle-switch')) return;
            
            // Apply standardized Tailwind classes
            if (!hasFormClasses(input)) {
                const currentClass = input.className;
                // Keep existing border radius if specified
                const borderRadius = currentClass.match(/rounded-[^\s]+/)?.[0] || 'rounded-md';
                
                input.className = `w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 ${borderRadius} text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary ${currentClass}`;
            }
        });
    
    // Update all select dropdowns
    document.querySelectorAll('select').forEach(select => {
        // Apply standardized Tailwind classes if not already styled
        if (!hasFormClasses(select)) {
            const currentClass = select.className;
            
            // Extract width and other utility classes we want to preserve
            const utilities = extractUtilities(currentClass);
            
            // Apply Tailwind select styling
            select.className = `w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary appearance-none ${utilities}`;
            
            // Add select arrow for dropdown appearance
            addSelectArrow(select);
        }
    });
    
    // Update checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        // Skip toggle switch checkboxes
        if (checkbox.closest('.toggle-switch')) return;
        
        // Apply Tailwind checkbox styling
        if (!hasFormClasses(checkbox)) {
            checkbox.className = `rounded border-gray-300 text-secondary focus:ring-secondary ${checkbox.className}`;
        }
    });
    
    // Update labels
    document.querySelectorAll('label').forEach(label => {
        // Skip toggle switch labels
        if (label.className.includes('toggle-switch')) return;
        
        // Apply label styling
        if (!hasFormClasses(label) && !label.className.includes('inline-flex')) {
            label.className = `block text-sm font-medium text-gray-700 dark:text-gray-300 ${label.className}`;
        }
    });
}

/**
 * Check if element already has form-specific Tailwind classes
 */
function hasFormClasses(element) {
    const classStr = element.className;
    return classStr.includes('focus:ring') || 
           classStr.includes('focus:border-') || 
           classStr.includes('dark:bg-gray');
}

/**
 * Extract utility classes that should be preserved
 */
function extractUtilities(classStr) {
    const utilities = [];
    
    // Width classes
    const widthMatch = classStr.match(/w-\d+|w-full|w-auto/);
    if (widthMatch) utilities.push(widthMatch[0]);
    
    // Margin classes
    const marginMatches = classStr.match(/(m[trblxy]?-\d+)/g);
    if (marginMatches) utilities.push(marginMatches.join(' '));
    
    // Height classes
    const heightMatch = classStr.match(/h-\d+|h-full|h-auto/);
    if (heightMatch) utilities.push(heightMatch[0]);
    
    return utilities.join(' ');
}

/**
 * Add background SVG arrow for selects
 */
function addSelectArrow(select) {
    // Set the background image for the select arrow
    select.style.backgroundImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
    select.style.backgroundPosition = 'right 0.5rem center';
    select.style.backgroundRepeat = 'no-repeat';
    select.style.backgroundSize = '1.5em 1.5em';
    select.style.paddingRight = '2.5rem';
}

/**
 * Observe DOM changes to apply styling to dynamically added elements
 */
function observeDOMChanges() {
    // Create an observer instance
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if any added nodes have form elements that need standardization
                mutation.addedNodes.forEach(node => {
                    // Only process element nodes
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is a form element
                        if (node.tagName === 'SELECT' || node.tagName === 'INPUT' || node.tagName === 'LABEL') {
                            standardizeNode(node);
                        }
                        
                        // Check for form elements within the added node
                        const formElements = node.querySelectorAll('select, input, label');
                        formElements.forEach(standardizeNode);
                    }
                });
            }
        });
    });
    
    // Start observing the document body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Standardize a single form element node with Tailwind classes
 */
function standardizeNode(node) {
    if (node.tagName === 'SELECT') {
        if (!hasFormClasses(node)) {
            const utilities = extractUtilities(node.className);
            node.className = `w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary appearance-none ${utilities}`;
            addSelectArrow(node);
        }
    } else if (node.tagName === 'INPUT') {
        if (node.type === 'checkbox' && !node.closest('.toggle-switch')) {
            if (!hasFormClasses(node)) {
                node.className = `rounded border-gray-300 text-secondary focus:ring-secondary ${node.className}`;
            }
        } else if (['text', 'number', 'email', 'password'].includes(node.type) && !node.closest('.toggle-switch')) {
            if (!hasFormClasses(node)) {
                const borderRadius = node.className.match(/rounded-[^\s]+/)?.[0] || 'rounded-md';
                node.className = `w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 ${borderRadius} text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary ${node.className}`;
            }
        }
    } else if (node.tagName === 'LABEL' && !node.className.includes('toggle-switch') && !node.className.includes('inline-flex')) {
        if (!hasFormClasses(node)) {
            node.className = `block text-sm font-medium text-gray-700 dark:text-gray-300 ${node.className}`;
        }
    }
}

// Make functions available globally
window.standardizeFormElements = standardizeFormElements;
window.standardizeNode = standardizeNode;
