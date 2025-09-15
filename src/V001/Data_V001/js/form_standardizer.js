/**
 * Form Standardizer
 * Ensures consistent form element styling across the app
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
            
            // Apply standardized class
            const currentClass = input.className;
            if (!currentClass.includes('form-input')) {
                input.className = 'form-input ' + 
                    // Keep border radius classes if they exist
                    (currentClass.includes('rounded-') ? currentClass.match(/rounded-[^\s]+/)?.[0] || '' : '');
            }
        });
    
    // Update all select dropdowns - with improved priority handling
    document.querySelectorAll('select').forEach(select => {
        // Apply standardized class if not already applied
        if (!select.className.includes('form-select')) {
            const currentClass = select.className;
            // Extract width and other utility classes we want to preserve
            const widthClass = currentClass.match(/w-\d+/)?.[0] || '';
            const heightClass = currentClass.match(/h-\d+/)?.[0] || '';
            const marginClass = currentClass.match(/(m[trblxy]?-\d+)/g)?.join(' ') || '';
            
            // Apply the form-select class with preserved utilities
            select.className = `form-select ${widthClass} ${heightClass} ${marginClass}`.trim();
        }
        
        // Force the proper custom appearance for key elements
        if (select.id === 'device-selector' || select.id === 'refresh-interval') {
            select.classList.add('form-select');
            
            // Make sure any inline styles that might override our CSS are removed
            select.style.appearance = '';
            select.style.backgroundImage = '';
        }
    });
    
    // Update checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        // Skip toggle switch checkboxes
        if (checkbox.closest('.toggle-switch')) return;
        
        // Apply standardized class
        if (!checkbox.className.includes('form-checkbox')) {
            checkbox.className = 'form-checkbox ' + checkbox.className;
        }
    });
    
    // Update labels
    document.querySelectorAll('label').forEach(label => {
        // Skip toggle switch labels
        if (label.className.includes('toggle-switch')) return;
        
        // Apply standardized class if it's a normal label
        if (!label.className.includes('form-label') && 
            !label.className.includes('toggle-switch')) {
            label.className = 'form-label';
        }
    });
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
 * Standardize a single form element node
 */
function standardizeNode(node) {
    if (node.tagName === 'SELECT') {
        if (!node.className.includes('form-select')) {
            const widthClass = node.className.match(/w-\d+/)?.[0] || '';
            node.className = `form-select ${widthClass}`.trim();
        }
    } else if (node.tagName === 'INPUT') {
        if (node.type === 'checkbox' && !node.closest('.toggle-switch')) {
            if (!node.className.includes('form-checkbox')) {
                node.className = 'form-checkbox ' + node.className;
            }
        } else if (['text', 'number', 'email', 'password'].includes(node.type) && !node.closest('.toggle-switch')) {
            if (!node.className.includes('form-input')) {
                node.className = 'form-input ' + 
                    (node.className.includes('rounded-') ? node.className.match(/rounded-[^\s]+/)?.[0] || '' : '');
            }
        }
    } else if (node.tagName === 'LABEL' && !node.className.includes('toggle-switch')) {
        if (!node.className.includes('form-label')) {
            node.className = 'form-label';
        }
    }
}

// Make functions available globally
window.standardizeFormElements = standardizeFormElements;
window.standardizeNode = standardizeNode;
