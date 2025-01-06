// First, create a file named emailOrganizer.js
// This will be our main application code

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const applescript = require('applescript');

// Import our EmailOrganizer class (from previous artifact)
const { EmailOrganizer } = require('./organizer');

// Create the main application window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

// Initialize our email organizer
const organizer = new EmailOrganizer();

// Handle Apple Mail integration
async function getAppleMailEmails() {
  const script = `
    tell application "Mail"
      set selectedMessages to selection
      set messageList to {}
      
      repeat with theMessage in selectedMessages
        set messageData to {|
          subject: subject of theMessage,
          sender: sender of theMessage,
          content: content of theMessage,
          date: date received of theMessage,
          messageId: message id of theMessage
        |}
        copy messageData to end of messageList
      end repeat
      
      return messageList
    end tell
  `;

  return new Promise((resolve, reject) => {
    applescript.execString(script, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Handle moving emails to folders
async function moveEmailToFolder(messageId, folderName) {
  const script = `
    tell application "Mail"
      set theMessage to first message of inbox whose message id = "${messageId}"
      set targetMailbox to mailbox "${folderName}"
      move theMessage to targetMailbox
    end tell
  `;

  return new Promise((resolve, reject) => {
    applescript.execString(script, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Set up our IPC handlers
ipcMain.handle('get-selected-emails', async () => {
  return await getAppleMailEmails();
});

ipcMain.handle('process-emails', async (event, emails) => {
  return await organizer.processBatch(emails, true);
});

ipcMain.handle('move-email', async (event, { messageId, category }) => {
  return await moveEmailToFolder(messageId, category);
});

ipcMain.handle('learn-from-email', async (event, { email, category }) => {
  organizer.learn(email, category);
  return organizer.getStats();
});

// Start the application
app.whenReady().then(createWindow);

// Create a file named index.html
/*
<!DOCTYPE html>
<html>
<head>
    <title>Email Organizer</title>
    <style>
        /* Add your styles here */
    </style>
</head>
<body>
    <div id="app">
        <div class="controls">
            <button onclick="getSelectedEmails()">Process Selected Emails</button>
            <button onclick="showStats()">Show Statistics</button>
        </div>
        <div id="emailList"></div>
        <div id="stats"></div>
    </div>
    <script src="renderer.js"></script>
</body>
</html>
*/

// Create a file named renderer.js
/*
const { ipcRenderer } = require('electron');

async function getSelectedEmails() {
    const emails = await ipcRenderer.invoke('get-selected-emails');
    const results = await ipcRenderer.invoke('process-emails', emails);
    displayResults(results);
}

function displayResults(results) {
    const container = document.getElementById('emailList');
    container.innerHTML = '';

    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'email-item';
        
        if (result.status === 'needs_training') {
            div.innerHTML = `
                <h3>${result.email.subject}</h3>
                <p>From: ${result.email.sender}</p>
                <div class="category-buttons">
                    <button onclick="categorizeEmail('${result.email.messageId}', 'commercial')">Commercial</button>
                    <button onclick="categorizeEmail('${result.email.messageId}', 'political')">Political</button>
                    <button onclick="categorizeEmail('${result.email.messageId}', 'aiNewsletters')">AI Newsletter</button>
                    <button onclick="categorizeEmail('${result.email.messageId}', 'personal')">Personal</button>
                    <button onclick="categorizeEmail('${result.email.messageId}', 'business')">Business</button>
                </div>
            `;
        } else {
            div.innerHTML = `
                <h3>${result.email.subject}</h3>
                <p>From: ${result.email.sender}</p>
                <p>Suggested category: ${result.prediction}</p>
                <button onclick="confirmCategory('${result.email.messageId}', '${result.prediction}')">Confirm</button>
                <button onclick="showCategoryOptions('${result.email.messageId}')">Choose Different</button>
            `;
        }
        
        container.appendChild(div);
    });
}

async function categorizeEmail(messageId, category) {
    const email = /* get email by messageId */;
    await ipcRenderer.invoke('learn-from-email', { email, category });
    await ipcRenderer.invoke('move-email', { messageId, category });
    // Update UI
}

async function showStats() {
    const stats = await ipcRenderer.invoke('get-stats');
    const container = document.getElementById('stats');
    container.innerHTML = `
        <h2>Statistics</h2>
        <p>Total Processed: ${stats.totalProcessed}</p>
        <p>Training Size: ${stats.trainingSize}</p>
        <p>Confidence: ${stats.confidence}</p>
        <h3>Category Counts:</h3>
        <ul>
            ${Object.entries(stats.categoryCounts).map(([cat, count]) => 
                `<li>${cat}: ${count}</li>`
            ).join('')}
        </ul>
    `;
}
*/

// Create a package.json file:
/*
{
  "name": "email-organizer",
  "version": "1.0.0",
  "main": "emailOrganizer.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron": "^latest",
    "applescript": "^latest"
  }
}
*/

Version 2 of 2
