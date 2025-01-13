```javascript
document.addEventListener('DOMContentLoaded', function() {
    const appContainer = document.getElementById('emailAssistant');
    const statusMessage = document.getElementById('status');

    class EmailAssistant {
        constructor() {
            this.initialized = false;
            this.initializeApp();
        }

        async initializeApp() {
            try {
                // Update status
                this.updateStatus('Checking authentication...');

                // Check if we have stored credentials
                const credentials = await this.checkStoredCredentials();
                
                if (!credentials) {
                    // Show login interface if no stored credentials
                    this.showLoginInterface();
                } else {
                    // Initialize email interface
                    await this.initializeEmailInterface();
                }

                this.initialized = true;

            } catch (error) {
                console.error('Initialization error:', error);
                this.updateStatus('Error initializing app. Please try again.');
            }
        }

        updateStatus(message) {
            statusMessage.textContent = message;
        }

        showLoginInterface() {
            appContainer.innerHTML = `
                <div class="login-container">
                    <h2>Welcome to Email Assistant</h2>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" required>
                        </div>
                        <button type="submit" class="login-button">Connect to Email</button>
                    </form>
                </div>
            `;

            document.getElementById('loginForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                });
            });
        }

        async handleLogin(credentials) {
            try {
                this.updateStatus('Connecting to email...');
                // Store credentials securely
                await this.storeCredentials(credentials);
                // Initialize email interface
                await this.initializeEmailInterface();
            } catch (error) {
                console.error('Login error:', error);
                this.updateStatus('Login failed. Please try again.');
            }
        }

        async checkStoredCredentials() {
            try {
                const stored = localStorage.getItem('emailAssistantCredentials');
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        }

        async storeCredentials(credentials) {
            // In a real app, use more secure storage
            localStorage.setItem('emailAssistantCredentials', 
                JSON.stringify(credentials)
            );
        }

        async initializeEmailInterface() {
            this.updateStatus('Loading email interface...');
            
            // Initial email interface
            appContainer.innerHTML = `
                <div class="email-interface">
                    <div class="header">
                        <h2>Email Assistant</h2>
                        <button id="refreshButton" class="refresh-button">Refresh</button>
                    </div>
                    <div id="emailList" class="email-list">
                        Loading your emails...
                    </div>
                </div>
            `;

            // Add refresh button handler
            document.getElementById('refreshButton')?.addEventListener('click', () => {
                this.refreshEmails();
            });

            // Initial email load
            await this.refreshEmails();
        }

        async refreshEmails() {
            try {
                this.updateStatus('Refreshing emails...');
                // Here we'll add the actual email fetching logic
                // For now, just show a placeholder
                document.getElementById('emailList').innerHTML = `
                    <div class="email-item">
                        <p>Email integration coming in next step...</p>
                    </div>
                `;
                this.updateStatus('Ready');
            } catch (error) {
                console.error('Refresh error:', error);
                this.updateStatus('Error refreshing emails. Please try again.');
            }
        }
    }

    // Initialize the app
    new EmailAssistant();
});
```
