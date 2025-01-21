document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js starting');
    const appContainer = document.getElementById('emailAssistant');
    const statusMessage = document.getElementById('status');

    const emailAssistant = {
        initialized: false,

        updateStatus(message) {
            console.log('Status update:', message);
            if (statusMessage) {
                statusMessage.textContent = message;
            }
        },

        validateEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        },

        async checkMailAccess() {
            const script = `
                tell application "Mail"
                    try
                        return true
                    on error
                        return false
                    end try
                end tell
            `;
            
            try {
                const result = await this.executeAppleScript(script);
                return {
                    success: result,
                    message: result ? 'Mail.app accessible' : 'Mail.app not accessible'
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Unable to access Mail.app'
                };
            }
        },

        executeAppleScript: async function(script) {
    console.log('Attempting to execute AppleScript:', script);
    try {
        const result = await window.webkit.messageHandlers.apple.postMessage(script);
        console.log('AppleScript result:', result);
        return result;
    } catch (error) {
        console.error('AppleScript execution error:', error);
        // For now, return mock data to test the interface
        return [{
            subject: "Test Email",
            sender: "test@example.com",
            dateReceived: new Date(),
            preview: "This is a test email to verify the display"
        }];
    }
},

        async authenticateWithMail(credentials) {
            try {
                const mailCheck = await this.checkMailAccess();
                if (!mailCheck.success) {
                    return {
                        success: false,
                        message: 'Unable to connect to Mail app. Please ensure Mail is set up.'
                    };
                }

                // Simulate authentication for now
                if (credentials.email && credentials.password) {
                    return {
                        success: true,
                        message: 'Authentication successful'
                    };
                }
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            } catch (error) {
                console.error('Auth error:', error);
                return {
                    success: false,
                    message: 'Authentication failed'
                };
            }
        },

        showLoginInterface() {
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

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                });
            });
        },

        async handleLogin(credentials) {
            try {
                this.updateStatus('Connecting to email...');
                
                if (!this.validateEmail(credentials.email)) {
                    this.updateStatus('Please enter a valid email address');
                    return;
                }

                const authResult = await this.authenticateWithMail(credentials);
                
                if (authResult.success) {
                    await this.storeCredentials(credentials);
                    await this.initializeEmailInterface();
                } else {
                    this.updateStatus(authResult.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                this.updateStatus('Login failed. Please try again.');
            }
        },

        async storeCredentials(credentials) {
            localStorage.setItem('emailAssistantCredentials', 
                JSON.stringify(credentials)
            );
        },

        async checkStoredCredentials() {
            try {
                const stored = localStorage.getItem('emailAssistantCredentials');
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        },

        async initializeEmailInterface() {
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

       // Other methods above...

       refreshEmails: async function() {
    try {
        this.updateStatus('Connecting to Mail.app...');
        console.log('Starting email refresh');
        
        const mailScript = `
            tell application "Mail"
                try
                    set messageList to {}
                    set unreadMessages to (messages of inbox whose read status is false)
                    log "Found " & (count of unreadMessages) & " unread messages"
                    repeat with theMessage in unreadMessages
                        log "Processing message: " & subject of theMessage
                        set messageData to {|
                            subject: subject of theMessage,
                            sender: sender of theMessage,
                            dateReceived: date received of theMessage,
                            preview: extract name from theMessage
                        |}
                        copy messageData to end of messageList
                    end repeat
                    return messageList
                on error errorMessage
                    log "Error: " & errorMessage
                    return "Error: " & errorMessage
                end try
            end tell
        `;

        console.log('Executing mail script');
        const result = await this.executeAppleScript(mailScript);
        console.log('Mail script result:', result);

        let emailListHTML = '';
        if (Array.isArray(result) && result.length > 0) {
            console.log('Processing email array');
            emailListHTML = result.map(email => `
                <div class="email-item">
                    <div class="email-header">
                        <span class="email-sender">${email.sender}</span>
                        <span class="email-date">${new Date(email.dateReceived).toLocaleString()}</span>
                    </div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-preview">${email.preview}</div>
                </div>
            `).join('');
        } else {
            console.log('No emails found or invalid result:', result);
            emailListHTML = '<div class="no-emails">No unread emails found (Debug: Check console for details)</div>';
        }

        document.getElementById('emailList').innerHTML = emailListHTML;
        this.updateStatus('Ready');
        
    } catch (error) {
        console.error('Email refresh error:', error);
        this.updateStatus('Error loading emails: ' + error.message);
        document.getElementById('emailList').innerHTML = `
            <div class="email-error">
                Unable to load emails. Error: ${error.message}
            </div>
        `;
    }
},

        // Make sure there's a comma here if there are more methods after
 

        async initializeApp() {
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

    // Start the app
    emailAssistant.initializeApp();
});
