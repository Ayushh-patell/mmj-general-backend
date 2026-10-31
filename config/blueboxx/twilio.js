const twilio = require('twilio');

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Create Twilio REST client
module.exports.client = twilio(accountSid, authToken);