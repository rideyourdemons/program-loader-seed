/**
 * Anchor Detection Utility
 * Checks if all 12 anchor/gate cards are rendered in the DOM
 * 
 * Usage:
 *   - In browser console: window.RYD_checkAnchors()
 *   - Or load this script and it auto-runs
 */

(function() {
    'use strict';
    
    function findMyAnchors() {
    'use strict';
    
    // Look for gate cards specifically (class="gate-card" from gates-renderer.hardened.js)
    const gateContainer = document.getElementById('gatesContainer') || 
                         document.querySelector('.gates-section') ||
                         document.querySelector('[id*="gate"]');
    
    const gateCards = document.querySelectorAll('.gate-card');
    const gatesGrid = document.querySelector('.gates-grid');
    const anchorLinks = document.querySelectorAll('a[href*="/gates"], a[href*="gate"]');
    
    const results = [];
    
    console.log("🔍 Searching for 12 anchor/gate cards...");
    console.log(`   Container (#gatesContainer): ${gateContainer ? 'YES' : 'NO'}`);
    console.log(`   Gates grid (.gates-grid): ${gatesGrid ? 'YES' : 'NO'}`);
    console.log(`   Gate cards (.gate-card): ${gateCards.length}`);
    console.log(`   Anchor links: ${anchorLinks.length}`);
    console.log('');
    
    // Check gate cards
    gateCards.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const isHidden = style.display === 'none' || 
                        style.visibility === 'hidden' || 
                        style.opacity === '0' ||
                        el.offsetParent === null;
        
        const id = el.id || el.getAttribute('data-gate-id') || `gate-${index}`;
        const text = el.innerText?.trim().substring(0, 50) || el.textContent?.trim().substring(0, 50) || "Empty Text";
        
        results.push({
            index: index + 1,
            id: id,
            text: text,
            visible: !isHidden,
            reason: isHidden ? "CSS is hiding this!" : "Should be visible",
            element: el.tagName
        });
    });
    
    // Check anchor links if gate cards not found
    if (gateCards.length === 0 && anchorLinks.length > 0) {
        anchorLinks.forEach((el, index) => {
            const style = window.getComputedStyle(el);
            const isHidden = style.display === 'none' || 
                            style.visibility === 'hidden' || 
                            style.opacity === '0' ||
                            el.offsetParent === null;
            
            results.push({
                index: index + 1,
                id: el.id || el.href || "No ID",
                text: el.innerText?.trim().substring(0, 50) || "Empty Text",
                visible: !isHidden,
                reason: isHidden ? "CSS is hiding this!" : "Should be visible",
                element: el.tagName
            });
        });
    }

    console.table(results);
    console.log('');
    
    if (results.length < 12) {
        console.error(`🚨 Only found ${results.length} anchors. Expected 12.`);
        console.error('   The gates-renderer might not be loading or gates data is missing.');
        console.log('');
        console.log('💡 Debug steps:');
        console.log('   1. Check if gates-renderer.hardened.js loaded');
        console.log('   2. Check if gates data is available (window.MatrixExpander)');
        console.log('   3. Check browser console for errors');
        console.log('   4. Check if #gatesContainer exists in DOM');
    } else if (results.length === 12) {
        const visibleCount = results.filter(r => r.visible).length;
        if (visibleCount < 12) {
            console.warn(`⚠️  Found ${results.length} anchors, but only ${visibleCount} are visible.`);
            console.warn('   Check CSS: display, visibility, opacity, z-index');
        } else {
            console.log("✅ All 12 anchors are in the DOM and visible!");
        }
    } else {
        console.warn(`⚠️  Found ${results.length} anchors (expected 12).`);
    }
    
    return results;
    }
    
    // Auto-run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', findMyAnchors);
    } else {
        // DOM already loaded, run immediately
        findMyAnchors();
    }
    
    // Expose as window function for manual execution
    window.RYD_checkAnchors = findMyAnchors;
})();
