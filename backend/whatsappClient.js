const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { execSync } = require('child_process');

const puppeteerOptions = {
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ]
};

if (process.platform === 'win32') {
    puppeteerOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
} else {
    // On Linux (Render/Railway): use the Chrome that puppeteer downloaded, or environment variable
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
        try {
            // Try to find the system chromium installed by Nixpacks
            const chromiumPath = execSync('which chromium').toString().trim();
            if (chromiumPath) {
                puppeteerOptions.executablePath = chromiumPath;
            }
        } catch (err) {
            try {
                const puppeteer = require('puppeteer');
                puppeteerOptions.executablePath = puppeteer.executablePath();
            } catch (e) {
                console.warn('puppeteer package not found and system chromium not found. Defaulting.');
                puppeteerOptions.executablePath = '/usr/bin/google-chrome-stable';
            }
        }
    }
}

const client = new Client({
    authStrategy: new LocalAuth(), // Saves the session so you don't have to scan every time
    puppeteer: puppeteerOptions
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n\n======================================================');
    console.log('📱 PLEASE SCAN THIS QR CODE WITH YOUR WHATSAPP APP 📱');
    console.log('   (Go to Settings > Linked Devices > Link a Device)');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is READY! Your backend can now send messages.\n');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('WhatsApp Client Authenticated successfully.');
});

client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure:', msg);
});

// Wrap initialize in a try/catch so Chrome failures don't crash the server
try {
    client.initialize().catch(err => {
        console.warn('⚠️ WhatsApp client failed to initialize (Chrome may be unavailable):', err.message);
        console.warn('   Orders will still work. WhatsApp notifications are disabled.');
    });
} catch (err) {
    console.warn('⚠️ WhatsApp client failed to start:', err.message);
}

// Safety net: prevent any unhandled WhatsApp/Puppeteer crash from killing the server
process.on('unhandledRejection', (reason) => {
    if (reason && reason.message && reason.message.includes('browser')) {
        console.warn('⚠️ Caught unhandled WhatsApp/browser rejection:', reason.message);
    } else {
        console.error('Unhandled Rejection:', reason);
    }
});

async function sendWhatsAppMessage(toPhone, message) {
    if (!isReady) {
        console.log('WhatsApp client not ready yet. Skipping message.');
        return;
    }
    try {
        // Format phone to whatsapp id (e.g. 919840462831@c.us)
        const chatId = `${toPhone}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`WhatsApp message successfully sent to ${toPhone}`);
    } catch (err) {
        console.error('Failed to send WhatsApp message via whatsapp-web.js:', err);
    }
}

module.exports = {
    sendWhatsAppMessage
};
