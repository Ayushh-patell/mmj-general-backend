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
        }
    } catch (e) {
        console.error("RC: Auth Error", e.message);
        // If the token is expired/invalid, force a new login
        await platform.login({ jwt: process.env.RC_JWT });
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
            text: ` From Website:\n Customer:-${customerPhone} \n Message:- ${message}`
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



module.exports = router;