const express = require('express');
const router = express.Router();
require('dotenv').config();
const SDK = require('@ringcentral/sdk').SDK;
// Initialize RingCentral SDK
const rcsdk = new SDK({
    server: process.env.RC_SERVER_URL,
    clientId: process.env.RC_CLIENT_ID,
    clientSecret: process.env.RC_CLIENT_SECRET
});

const platform = rcsdk.platform();

/**
 * Authentication Helper
 * We use JWT to ensure the backend is always "logged in" 
 * to send/receive messages on behalf of the business.
 */

let isSubscribed = false;

async function subscribeToWebhooks(publicUrl) {
    if (isSubscribed) return; 
    
    try {
        // Optional: You could fetch existing subscriptions here to be extra safe
        await platform.post('/restapi/v1.0/subscription', {
            eventFilters: ['/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS'],
            deliveryMode: {
                transportType: 'WebHook',
                address: `${publicUrl}/zeejay/webhook` // Ensure this matches your route mount point
            },
            expiresIn: 315360000 
        });
        isSubscribed = true;
        console.log("RC: Webhook Subscription Active");
    } catch (e) {
        console.error("RC: Subscription Error:", e.message);
    }
}

const ensureAuthenticated = async () => {
    try {
        const authData = await platform.auth().data();
        
        // In v4, we check if the token is valid
        if (!authData.access_token) {
            console.log("RC: No active session. Logging in with JWT...");
            await platform.login({
                jwt: process.env.RC_JWT
            });
            console.log("RC: JWT Login Successful");
            
            // Re-subscribe to webhooks after a fresh login
            await subscribeToWebhooks('https://mmj-general-backend.onrender.com');
        }
    } catch (e) {
        console.error("RC: Auth Error", e.message);
        // If the token is expired/invalid, force a new login
        await platform.login({ jwt: process.env.RC_JWT });
        await subscribeToWebhooks('https://mmj-general-backend.onrender.com');
    }
};
/**
 * POST /zeejay/send
 */
router.post('/send', async (req, res) => {
    let { customerPhone, message } = req.body;

    if (!customerPhone || !message) {
        return res.status(400).json({ error: "Missing phone or message" });
    }

    // CLEANUP: Ensure phone starts with + (RingCentral requirement)
    if (!customerPhone.startsWith('+')) {
        customerPhone = `+${customerPhone.replace(/\D/g, '')}`; 
    }

    try {
        await ensureAuthenticated();

        const response = await platform.post('/restapi/v1.0/account/~/extension/~/sms', {
            from: { phoneNumber: process.env.RC_BUSINESS_NUMBER },
            to: [{ phoneNumber: process.env.RC_BUSINESS_NUMBER }],
            text: ` From Website:\n Customer:-${customerPhone} \n Message:- ${message}` // The "Thread" is handled automatically by RC via the phone number
        });

        const data = await response.json();
        
        res.status(200).json({ success: true, messageId: data.id });
    } catch (error) {
        console.error("RC Error:", error.message);
        res.status(500).json({ error: "Failed to send" });
    }
});


router.get('/check-numbers', async (req, res) => {
    try {
        await ensureAuthenticated();
        // This lists all phone numbers assigned to the current authorized user
        const response = await platform.get('/restapi/v1.0/account/~/extension/~/phone-number');
        const data = await response.json();
        
        // Look for numbers where features include "SmsSender"
        const smsNumbers = data.records.filter(nr => nr.features.includes('SmsSender'));
        
        res.json({ 
            all_numbers: data.records,
            use_one_of_these_for_sms: smsNumbers.map(n => n.phoneNumber)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /zeejay/webhook
 * RingCentral calls this whenever an event (like a new SMS) occurs.
 */
router.post('/webhook', async (req, res) => {
    // 1. THE HANDSHAKE (MANDATORY)
    // When you first register the webhook, RC sends a validation token.
    // You MUST return this in the header to activate the webhook.
    const validationToken = req.headers['validation-token'];
    if (validationToken) {
        res.setHeader('Validation-Token', validationToken);
        return res.status(200).send();
    }

    // 2. EXTRACT NOTIFICATION BODY
    const notification = req.body;

    // 3. FILTER FOR INBOUND SMS
    // body.direction === 'Inbound' ensures we only react to the OWNER'S reply, 
    // and not the message our own backend just sent to RC.
    if (
        notification &&
        notification.body &&
        notification.body.direction === 'Inbound' &&
        notification.body.messageStatus === 'Received'
    ) {
        const replyText = notification.body.subject; // The text the owner typed
        const senderPhone = notification.body.from.phoneNumber; // The Business Number
        const customerPhone = notification.body.to[0].phoneNumber; // The User's Number

        console.log(`New Reply from Owner to ${customerPhone}: ${replyText}`);

        /**
         * 4. PUSH TO FRONTEND
         * If you are using Socket.io, you can access it via the app object:
         */
        const io = req.app.get('socketio'); 
        if (io) {
            io.emit('rc_message', {
                text: replyText,
                sender: 'business',
                timestamp: new Date().toISOString()
            });
        }
    }

    // 5. ALWAYS respond with 200 OK immediately
    res.status(200).json({ status: 'Success' });
});

module.exports = router;