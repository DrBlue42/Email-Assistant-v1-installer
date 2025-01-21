console.clear();
console.log('=== INSTALLER SCRIPT STARTING ===');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');
    
    // Enhanced standalone detection
    const isStandalone = () => {
        return (
            window.navigator.standalone || // iOS
            window.matchMedia('(display-mode: standalone)').matches || // Android
            document.referrer.includes('ios-app://')
        );
    };

    console.log('Standalone check:', isStandalone());
    
    if (isStandalone()) {
        console.log('Standalone mode detected - redirecting to app');
        window.location.replace('app.html');
        return;
    }

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
                installButton.parentNode.appendChild(steps);
                installButton.textContent = 'Follow Steps Below';
                console.log('Steps displayed');
                // Enhanced standalone detection
    const isStandalone = () => {
        console.log('Navigator standalone:', window.navigator.standalone);
        console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
        console.log('Window mode:', window.hasOwnProperty('standalone'));
        
        // Try to read from localStorage to detect if we've been launched from home screen
        const launchedFromHomeScreen = localStorage.getItem('launchedFromHomeScreen');
        console.log('Launch flag:', launchedFromHomeScreen);

        return window.navigator.standalone || 
               window.matchMedia('(display-mode: standalone)').matches ||
               launchedFromHomeScreen === 'true';
    };
            }
        });
    }
});
