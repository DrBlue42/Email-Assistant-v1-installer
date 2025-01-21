handleLogin: async function(credentials) {
    try {
        this.updateStatus('Connecting to email...');
        
        // Validate email format
        if (!this.validateEmail(credentials.email)) {
            this.updateStatus('Please enter a valid email address');
            return;
        }

        // Attempt to connect to Mail.app
        const authResult = await this.authenticateWithMail(credentials);
        
        if (authResult.success) {
            await this.storeCredentials(credentials);
            await this.initializeEmailInterface();
        } else {
            this.updateStatus(authResult.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        this.updateStatus('Login failed. Please try again.');
    }
},

validateEmail: function(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
},

authenticateWithMail: async function(credentials) {
    try {
        // First check if Mail.app is accessible
        const mailCheck = await this.checkMailAccess();
        if (!mailCheck.success) {
            return {
                success: false,
                message: 'Unable to connect to Mail app. Please ensure Mail is set up on your device.'
            };
        }

        // Attempt to authenticate
        const authScript = `
            tell application "Mail"
                try
                    set accountList to every account
                    repeat with theAccount in accountList
                        if email address of theAccount is "${credentials.email}" then
                            return true
                        end if
                    end repeat
                    return false
                on error
                    return false
                end try
            end tell
        `;

        const result = await this.executeAppleScript(authScript);
        if (result) {
            return {
                success: true,
                message: 'Authentication successful'
            };
        } else {
            return {
                success: false,
                message: 'Email account not found in Mail.app'
            };
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'Unable to verify email credentials'
        };
    }
},

checkMailAccess: async function() {
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
    // We'll need to implement this to bridge between web and native
    // For now, return a mock success
    console.log('Would execute AppleScript:', script);
    // Simulate a delay for testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
}
