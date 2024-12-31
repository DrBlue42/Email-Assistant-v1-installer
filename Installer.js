```javascript
document.addEventListener('DOMContentLoaded', function() {
    const installButton = document.getElementById('installButton');
    const container = document.querySelector('.install-container');
    
    if (window.navigator.standalone) {
        container.innerHTML = '<h1>Already Installed!</h1><p>Open Email Assistant from your home screen.</p>';
        return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
        container.innerHTML = '<h1>iOS Required</h1><p>Please open this page on your iPad or iPhone to install.</p>';
        return;
    }
});
```
