// bridge.js
const MailBridge = {
    async executeAppleScript: function(script) {
        console.log('Bridge: Attempting to execute AppleScript');
        
        // For development/testing, return mock data
        return new Promise((resolve) => {
            setTimeout(() => {
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
