console.clear(); // Clear previous messages
console.log('=== INSTALLER SCRIPT STARTING ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    const installButton = document.getElementById('installButton');
    console.log('Install button found:', !!installButton);
    const container = document.querySelector('.install-container');
    console.log('Container found:', !!container);
    
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Standalone mode detected');
        window.location.href = 'app.html';
        return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log('iOS device detected:', isIOS);
    
    if (!isIOS) {
        container.innerHTML = '<h1>iOS Required</h1><p>Please open this page on your iPad or iPhone to install.</p>';
        return;
    }

    if (installButton) {
        console.log('Adding click handler to install button');
        installButton.addEventListener('click', function() {
            console.log('Button clicked!');
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
                console.log('Installation steps displayed');
            }
        });
    } else {
        console.error('Install button not found');
    }
});
