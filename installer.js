console.clear();
console.log('=== INSTALLER SCRIPT STARTING ===');

document.addEventListener('DOMContentLoaded', function() {
    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');
    
    // Enhanced standalone detection
    const isStandalone = () => {
        const standalone = window.navigator.standalone;
        const urlParams = new URLSearchParams(window.location.search);
        const fromHomeScreen = urlParams.get('source') === 'homescreen' || 
                             localStorage.getItem('launchedFromHomeScreen') === 'true';
        
        console.log('Standalone check:', {
            standalone,
            fromHomeScreen,
            navigator: window.navigator,
            location: window.location.href
        });
        
        return standalone || fromHomeScreen;
    };

    if (isStandalone()) {
        console.log('Standalone mode detected - redirecting to app');
        localStorage.setItem('launchedFromHomeScreen', 'true');
        window.location.replace('app.html');
        return;
    }

    // Rest of your installer.js code...

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    console.log('iOS check:', isIOS);

    if (!isIOS) {
        console.log('Not iOS - showing requirement message');
        container.innerHTML = '<h1>iOS Required</h1><p>Please open this page on your iPad or iPhone to install.</p>';
        return;
    }

    if (installButton) {
        console.log('Adding click handler');
        installButton.addEventListener('click', function() {
            console.log('Button clicked');
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
                // Set flag before adding to home screen
                localStorage.setItem('launchedFromHomeScreen', 'true');
                installButton.parentNode.appendChild(steps);
                installButton.textContent = 'Follow Steps Below';
                console.log('Steps displayed');
            }
        });
    }
});
