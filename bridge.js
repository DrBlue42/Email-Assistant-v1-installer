const MailBridge = {
    executeAppleScript: function(script) {
        console.log('Bridge: Attempting to execute AppleScript');
        
        return new Promise(function(resolve) {
            setTimeout(function() {
                const mockEmails = [
                    {
                        subject: "Important Update",
                        sender: "work@example.com",
                        dateReceived: new Date(),
                        preview: "Latest project status..."
                    },
                    {
                        subject: "Meeting Tomorrow",
                        sender: "team@example.com",
                        dateReceived: new Date(),
                        preview: "Agenda for tomorrow's meeting..."
                    }
                ];
                resolve(mockEmails);
            }, 1000);
        });
    }
};

window.MailBridge = MailBridge;
