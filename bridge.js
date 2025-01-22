const MailBridge = {
    executeAppleScript: async function(script) {
        console.log('Bridge: Beginning Mail.app communication');
        
        try {
            // Create a webkit message handler for Mail.app
            const mailHandler = {
                name: 'mailAccess',
                postMessage: async function(message) {
                    // Log the attempt to access Mail.app
                    console.log('Attempting Mail.app access with:', message);
                    
                    const mailScript = `
                        tell application "Mail"
                            try
                                set unreadList to {}
                                set unreadMessages to (messages of inbox whose read status is false)
                                repeat with msg in unreadMessages
                                    set msgDict to {|
                                        subject: subject of msg,
                                        sender: sender of msg as string,
                                        dateReceived: date received of msg as string,
                                        messageId: message id of msg,
                                        preview: (extract address from msg)
                                    |}
                                    set end of unreadList to msgDict
                                end repeat
                                return unreadList
                            on error errStr
                                return "Error: " & errStr
                            end try
                        end tell
                    `;
                    
                    // Log the actual script we're trying to execute
                    console.log('Executing Mail.app script:', mailScript);
                    
                    // Handle Mail.app response
                    try {
                        if (window.webkit && window.webkit.messageHandlers) {
                            const result = await window.webkit.messageHandlers.apple.postMessage(mailScript);
                            console.log('Mail.app response:', result);
                            return result;
                        } else {
                            throw new Error('Mail.app access not available');
                        }
                    } catch (error) {
                        console.error('Mail.app access error:', error);
                        throw error;
                    }
                }
            };

            // Register the mail handler
            if (!window.webkit) {
                window.webkit = { messageHandlers: {} };
            }
            window.webkit.messageHandlers.mailAccess = mailHandler;

            // Attempt to fetch emails
            const result = await mailHandler.postMessage('fetchEmails');
            console.log('Fetch result:', result);

            return result || [];

        } catch (error) {
            console.error('Mail bridge error:', error);
            return [{
                subject: "Mail Access Error",
                sender: "system",
                dateReceived: new Date().toISOString(),
                preview: `Error accessing Mail.app: ${error.message}. Please check Mail.app permissions.`
            }];
        }
    }
};

window.MailBridge = MailBridge;
