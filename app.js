document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js starting');
    const appContainer = document.getElementById('emailAssistant');
    const statusMessage = document.getElementById('status');

    // Create email assistant object using function instead of class
    function createEmailAssistant() {
        const assistant = {
            initialized: false,

            updateStatus: function(message) {
                console.log('Status update:', message);
                if (statusMessage) {
                    statusMessage.textContent = message;
                }
            },

            showLoginInterface: function() {
                console.log('Showing login interface');
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

                document.getElementById('loginForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    assistant.handleLogin({
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    });
                });
            },

            handleLogin: async function(credentials) {
                try {
                    this.updateStatus('Connecting to email...');
                    await this.storeCredentials(credentials);
                    await this.initializeEmailInterface();
                } catch (error) {
                    console.error('Login error:', error);
                    this.updateStatus('Login failed. Please try again.');
                }
            },

            checkStoredCredentials: async function() {
                try {
                    const stored = localStorage.getItem('emailAssistantCredentials');
                    return stored ? JSON.parse(stored) : null;
                } catch {
                    return null;
                }
            },

            storeCredentials: async function(credentials) {
                localStorage.setItem('emailAssistantCredentials', 
                    JSON.stringify(credentials)
                );
            },

            initializeEmailInterface: async function() {
                this.updateStatus('Loading email interface...');
                
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

                document.getElementById('refreshButton')?.addEventListener('click', () => {
                    this.refreshEmails();
                });

                await this.refreshEmails();
            },

            refreshEmails: async function() {
                try {
                    this.updateStatus('Refreshing emails...');
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
            },

            initializeApp: async function() {
                try {
                    this.updateStatus('Checking authentication...');
                    const credentials = await this.checkStoredCredentials();
                    
                    if (!credentials) {
                        this.showLoginInterface();
                    } else {
                        await this.initializeEmailInterface();
                    }

                    this.initialized = true;
                } catch (error) {
                    console.error('Initialization error:', error);
                    this.updateStatus('Error initializing app. Please try again.');
                }
            }
        };

        return assistant;
    }

    // Initialize and start the app
    const emailAssistant = createEmailAssistant();
    emailAssistant.initializeApp();
});
