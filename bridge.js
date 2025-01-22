const MailBridge = {
    executeAppleScript: function(script) {
        console.log('Bridge: Beginning Mail.app communication');
        
        return new Promise((resolve, reject) => {
            const mailScript = `
                tell application "Mail"
                    try
                        set unreadList to {}
                        set unreadMessages to (messages of inbox whose read status is false)
                        
                        repeat with currentMessage in unreadMessages
                            set msgData to {|
                                id: id of currentMessage,
                                subject: subject of currentMessage,
                                sender: (sender of currentMessage as string),
                                preview: (extract address from currentMessage),
                                dateReceived: (date received of currentMessage as string)
                            |}
                            set end of unreadList to msgData
                        end repeat
                        
                        return unreadList
                    on error errMsg
                        log "Error: " & errMsg
                        return {}
                    end try
                end tell
            `;
            
            console.log('Attempting to execute Mail.app script');
            
            // Temporary: Return both mock and intended script for testing
            console.log('Script to be executed:', mailScript);
            
            // For testing: Show one real-format message while we implement Mail access
            const testMessages = [{
                id: "test-msg-1",
                subject: "Mail.app Integration Test",
                sender: localStorage.getItem('emailAssistantCredentials') ? 
                    JSON.parse(localStorage.getItem('emailAssistantCredentials')).email : 
                    "user@example.com",
                preview: "Preparing to fetch your actual unread messages...",
                dateReceived: new Date().toISOString()
            }];
            
            resolve(testMessages);
        });
    }
};

window.MailBridge = MailBridge;
