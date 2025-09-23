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
                    
                    // SIMPLIFIED: Just use eval approach for scripts - more compatible
                    try {
                        // Execute scripts in component
                        const scripts = placeholder.querySelectorAll('script');
                        scripts.forEach(script => {
                            // Don't try to reexecute external scripts with src
                            if (!script.src && script.textContent) {
                                const scriptContent = script.textContent.trim();
                                
                                // Skip empty scripts
                                if (!scriptContent) return;
                                
                                // Special handling for known problematic components
                                if (componentName === 'log-viewer') {
                                    console.log("Using special handler for log-viewer component");
                                    
                                    // For log-viewer, use the external script instead
                                    if (typeof window.setupLogViewer === 'function') {
                                        console.log("Setting up log viewer using external script");
                                        try {
                                            window.setupLogViewer();
                                        } catch (e) {
                                            console.error("Error in external setupLogViewer:", e);
                                        }
                                        return; // Skip further execution of this script
                                    }
                                }
                                
                                try {
                                    // First try: Direct execution with Function constructor (safest)
                                    new Function(scriptContent)();
                                } catch (firstError) {
                                    console.warn(`First execution attempt failed for ${componentName}:`, firstError);
                                    
                                    // Debug output for problem scripts
                                    if (componentName === 'log-viewer' || componentName === 'navbar') {
                                        console.debug(`Original problematic script in ${componentName}:`, scriptContent);
                                    }
                                    
                                    try {
                                        // Second try: Check and repair syntax
                                        const syntaxReport = validateAndRepairScript(scriptContent, componentName);
                                        
                                        if (syntaxReport.needsRepair) {
                                            console.warn(`Syntax issues in ${componentName} script: ${syntaxReport.issues.join(', ')}`);
                                            
                                            // Execute the repaired script
                                            try {
                                                new Function(syntaxReport.repairedScript)();
                                                console.log(`Successfully executed repaired script for ${componentName}`);
                                            } catch (repairExecError) {
                                                console.error(`Failed to execute repaired script for ${componentName}:`, repairExecError);
                                                // Last attempt: Try to extract and run individual functions/blocks
                                                extractAndRunFunctions(syntaxReport.repairedScript, componentName);
                                            }
                                        }
                                    } catch (repairError) {
                                        console.error(`Script repair failed for ${componentName}:`, repairError);
                                        
                                        // Last resort: Execute in global context with more robust error handling
                                        try {
                                            // A more careful approach - execute line by line if needed
                                            executeScriptSafely(scriptContent, componentName);
                                        } catch (finalError) {
                                            console.error(`All script execution methods failed for ${componentName}`, finalError);
                                        }
                                    }
                                }
                            }
                        });
                    } catch (scriptExecError) {
                        console.error(`Failed to process scripts for ${componentName}:`, scriptExecError);
                    }
                    
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

/**
 * More comprehensive script validation and repair
 * @param {string} script The script content to validate and repair
 * @param {string} componentName The name of the component (for component-specific fixes)
 * @return {object} Report with validation and repair info
 */
function validateAndRepairScript(script, componentName) {
    const result = {
        needsRepair: false,
        repairedScript: script,
        issues: []
    };
    
    // Component-specific fixes (applied before general fixes)
    if (componentName === 'log-viewer') {
        // For log-viewer, try a more aggressive repair approach
        result.needsRepair = true;
        result.issues.push('Applied component-specific fix for log-viewer');
        
        // If we have log_viewer.js loaded, we can skip the embedded script completely
        if (typeof window.setupLogViewer === 'function') {
            result.repairedScript = "// Using external log_viewer.js instead";
            return result;
        }
    }
    
    // Look for common syntax errors
    
    // 1. Check for mismatched brackets/braces/parentheses
    const openBraces = (script.match(/{/g) || []).length;
    const closeBraces = (script.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        result.needsRepair = true;
        result.issues.push(`Mismatched braces (${openBraces} open, ${closeBraces} close)`);
        
        // Add or remove braces as needed
        if (openBraces > closeBraces) {
            result.repairedScript += '}'.repeat(openBraces - closeBraces);
        } else if (script.lastIndexOf('}') !== -1) {
            // Remove extra closing braces - careful approach
            const extraBraces = closeBraces - openBraces;
            let finalScript = result.repairedScript;
            for (let i = 0; i < extraBraces; i++) {
                const lastBracePos = finalScript.lastIndexOf('}');
                if (lastBracePos !== -1) {
                    finalScript = finalScript.substring(0, lastBracePos) + 
                                  finalScript.substring(lastBracePos + 1);
                }
            }
            result.repairedScript = finalScript;
        }
    }
    
    // 2. Check for mismatched parentheses
    const openParens = (script.match(/\(/g) || []).length;
    const closeParens = (script.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
        result.needsRepair = true;
        result.issues.push(`Mismatched parentheses (${openParens} open, ${closeParens} close)`);
        
        // Add or remove parentheses as needed
        if (openParens > closeParens) {
            result.repairedScript += ')'.repeat(openParens - closeParens);
        } else {
            // Try to remove extra parentheses - safer to just add comment noting the issue
            result.repairedScript += `\n// Note: Had ${closeParens-openParens} extra closing parentheses`;
        }
    }
    
    // 3. Check for mismatched brackets
    const openBrackets = (script.match(/\[/g) || []).length;
    const closeBrackets = (script.match(/\]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
        result.needsRepair = true;
        result.issues.push(`Mismatched brackets (${openBrackets} open, ${closeBrackets} close)`);
        
        // Add or remove brackets as needed
        if (openBrackets > closeBrackets) {
            result.repairedScript += ']'.repeat(openBrackets - closeBrackets);
        } else {
            // Just add a note
            result.repairedScript += `\n// Note: Had ${closeBrackets-openBrackets} extra closing brackets`;
        }
    }
    
    // 4. Check for compound expression errors - when a } appears where ) is expected
    // This is a more complex case that often requires manual fixing
    if (result.repairedScript.includes('})')) {
        result.needsRepair = true;
        result.issues.push('Possible compound expression error (})');
        
        // Try a basic fix - replace }) with ))
        result.repairedScript = result.repairedScript.replace(/\}\)/g, '))');
    }
    
    // Enhanced compound expression error detection
    const braceParenPatterns = [
        { pattern: /\}\)/g, replacement: '))', issue: 'Misplaced closing brace before closing parenthesis (})' },
        { pattern: /\)\}/g, replacement: '))', issue: 'Misplaced closing parenthesis before closing brace (})' },
        { pattern: /\{\(/g, replacement: '(', issue: 'Misplaced opening brace before opening parenthesis ({)' }
    ];
    
    for (const { pattern, replacement, issue } of braceParenPatterns) {
        if (result.repairedScript.match(pattern)) {
            result.needsRepair = true;
            result.issues.push(issue);
            result.repairedScript = result.repairedScript.replace(pattern, replacement);
        }
    }
    
    return result;
}

/**
 * Execute a script safely, trying multiple approaches
 * @param {string} script The script to execute
 * @param {string} componentName The name of the component
 */
function executeScriptSafely(script, componentName) {
    try {
        // Try to identify and execute individual statements
        const statements = script.split(';').filter(s => s.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
            try {
                const statement = statements[i].trim();
                if (statement) {
                    // Skip lines that are likely to cause errors in isolation
                    if (statement.includes('function(') || 
                        statement.includes('{') ||
                        statement.startsWith('else') ||
                        statement.startsWith('catch') ||
                        statement.startsWith('finally')) {
                        continue;
                    }
                    
                    // Try to execute the statement
                    eval(statement);
                }
            } catch (stmtError) {
                console.debug(`Skipping problematic statement in ${componentName}:`, statements[i]);
            }
        }
    } catch (error) {
        console.error(`Failed to safely execute script for ${componentName}:`, error);
    }
}

/**
 * Extract and run individual functions/blocks from a script
 * @param {string} script The script to extract functions from
 * @param {string} componentName The name of the component
 */
function extractAndRunFunctions(script, componentName) {
    console.log(`Attempting to extract functions from ${componentName} script`);
    
    // For log-viewer component, we already have external functions defined in log_viewer.js
    if (componentName === 'log-viewer' && typeof window.setupLogViewer === 'function') {
        console.log('Using existing setupLogViewer function instead of embedded script');
        window.setupLogViewer();
        return;
    }
    
    try {
        // Try to find event listeners and execute them separately
        const listenerRegex = /addEventListener\(['"]([^'"]+)['"]\s*,\s*function/g;
        let match;
        
        while ((match = listenerRegex.exec(script)) !== null) {
            const eventType = match[1];
            console.log(`Found event listener for '${eventType}' in ${componentName}`);
        }
        
        // Try to find global function assignments and execute them
        const funcRegex = /window\.([a-zA-Z0-9_]+)\s*=\s*function/g;
        while ((match = funcRegex.exec(script)) !== null) {
            const funcName = match[1];
            console.log(`Found global function '${funcName}' in ${componentName}`);
            
            // These functions are likely defined in the actual JS file, so we don't need to
            // extract and execute them from the component script
        }
    } catch (error) {
        console.error(`Error extracting functions from ${componentName} script:`, error);
    }
}
