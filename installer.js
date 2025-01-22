console.clear();
console.log('=== INSTALLER SCRIPT STARTING ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking installation state...');
    
    // Check if already installed
    if (localStorage.getItem('appInstalled') === 'true' || window.navigator.standalone) {
        console.log('App detected as installed, redirecting to app');
        window.location.replace('app.html');
        return;
    }

    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');

    if (installButton) {
        installButton.addEventListener('click', function() {
            console.log('Install button clicked');
            // Set flag before showing instructions
            localStorage.setItem('appInstalled', 'true');
            
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
