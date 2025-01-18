```javascript
document.addEventListener('DOMContentLoaded', function() {
    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');
    
    console.log('Script loaded'); // Debug line
    
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        // Launch email assistant interface instead of showing install page
        console.log('Standalone mode detected'); // Debug line
        window.location.href = 'app.html';
        return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
        container.innerHTML = '<h1>iOS Required</h1><p>Please open this page on your iPad or iPhone to install.</p>';
        return;
    }

    // Add click handler with debug
    installButton.addEventListener('click', function() {
        console.log('Button clicked'); // Debug line
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
            installButton.textContent = 'Follow Steps Above';
        }
    });
});
