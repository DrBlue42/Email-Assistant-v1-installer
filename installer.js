console.clear();
console.log('=== INSTALLER SCRIPT STARTING ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking launch mode...');
    
    // Check if we're in standalone mode
    if (window.navigator.standalone === true || 
        window.matchMedia('(display-mode: standalone)').matches || 
        document.referrer.includes('homescreen')) {
        
        console.log('Standalone detected - going to app');
        window.location.replace('app.html');
        return;
    }

    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');

    // If not standalone, show install UI
    if (installButton) {
        installButton.addEventListener('click', function() {
            console.log('Install button clicked');
            const steps = document.createElement('div');
            steps.className = 'install-steps visible';
            steps.innerHTML = `
                <div class="step">
                    <div class="step-number">1</div>
                    <div>Tap the Share button in Safari</div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div>Select "Add to Home Screen"</div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div>Tap "Add"</div>
                </div>
            `;
            
            if (!document.querySelector('.install-steps')) {
                installButton.parentNode.appendChild(steps);
                installButton.textContent = 'Follow Steps Below';
            }
        });
    }
});
