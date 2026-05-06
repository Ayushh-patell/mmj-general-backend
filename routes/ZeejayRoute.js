const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Article = require('../schema/ZeejayBlogs');
require('dotenv').config();
const crypto = require('crypto');
const SECRET = 'aseo_wh_9238ce876814e35653d2e69ff001bbd6';
const SDK = require('@ringcentral/sdk').SDK;
// Initialize RingCentral SDK
const rcsdk = new SDK({
    server: process.env.RC_SERVER_URL,
    clientId: process.env.RC_CLIENT_ID,
    clientSecret: process.env.RC_CLIENT_SECRET
});

const platform = rcsdk.platform();

// Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD, // Use an "App Password" here
  },
});

function verifySignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

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


router.post('/contact', async (req, res) => {
  const { name, email, phone, service, urgency, message } = req.body;

  // Basic Validation
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Define amber/red colors based on urgency
  const isUrgent = urgency === 'urgent';
  const highlightColor = isUrgent ? '#ef4444' : '#f59e0b'; // Red-500 or Amber-500
  const bgColor = isUrgent ? '#fef2f2' : '#fffbeb'; // Red-50 or Amber-50

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; color: #334155; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background-color: ${highlightColor}; color: white; padding: 24px; text-align: center; }
        .content { padding: 24px; background-color: #ffffff; }
        .field-group { margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #64748b; }
        .value { font-size: 16px; color: #1e293b; }
        .urgency-badge { 
          display: inline-block; padding: 4px 12px; border-radius: 20px; 
          font-weight: bold; font-size: 12px; background-color: ${bgColor}; color: ${highlightColor};
          border: 1px solid ${highlightColor};
        }
        .message-box { background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid ${highlightColor}; }
        .footer { background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">New Service Request</h2>
          <p style="margin:4px 0 0 0;">${isUrgent ? '🚨 URGENT ACTION REQUIRED' : 'New Inquiry Received'}</p>
        </div>
        <div class="content">
          <div class="field-group">
            <div class="label">Urgency Status</div>
            <div class="urgency-badge">${urgency.toUpperCase()}</div>
          </div>
          <div style="display: flex; gap: 20px;">
            <div class="field-group" style="flex:1;">
              <div class="label">Customer Name</div>
              <div class="value">${name}</div>
            </div>
            <div class="field-group" style="flex:1;">
              <div class="label">Requested Service</div>
              <div class="value">${service.replace('-', ' ').toUpperCase()}</div>
            </div>
          </div>
          <div class="field-group">
            <div class="label">Contact Info</div>
            <div class="value">${email} | ${phone}</div>
          </div>
          <div class="label">Customer Message:</div>
          <div class="message-box">
            ${message}
          </div>
        </div>
        <div class="footer">
          Sent from your website contact form.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Zeejay Mechanical WEbsite" <${process.env.GMAIL_USER}>`,
      to: 'info@zeejaymechanical.com',
      subject: `${isUrgent ? '[URGENT] ' : ''}New ${service} Request from ${name}`,
      html: htmlContent,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Mail Error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});


/**
 * 1. WEBHOOK: Receive and Save/Update Blog Data
 * Triggered by your external publishing event
 */
router.post('/webhook/publish', async (req, res) => {

const sig = req.headers['x-autoseo-signature'];
if (!verifySignature(req.rawBody, sig)) {
  return res.status(401).send('Invalid signature');
}
    try {
        const data = req.body;

        // Upsert (Update if exists by externalId, otherwise Insert)
        const article = await Article.findOneAndUpdate(
            { externalId: data.id }, 
            {
                externalId: data.id,
                title: data.title,
                slug: data.slug,
                published_url: data.published_url,
                metaDescription: data.metaDescription,
                content_html: data.content_html,
                content_markdown: data.content_markdown,
                heroImageUrl: data.heroImageUrl,
                heroImageAlt: data.heroImageAlt,
                infographicImageUrl: data.infographicImageUrl,
                keywords: data.keywords,
                metaKeywords: data.metaKeywords,
                wordpressTags: data.wordpressTags,
                faqSchema: data.faqSchema,
                languageCode: data.languageCode,
                status: data.status,
                publishedAt: data.publishedAt,
                updatedAt: data.updatedAt,
                createdAt: data.createdAt
            },
            { upsert: true, new: true }
        );

        console.log(`Article "${article.title}" processed via webhook.`);
        res.status(200).json({ success: true, url:`https://zeejaymechanical.com/blog/${data.slug}`, message: "Article synced successfully" });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Internal server error during sync" });
    }
});


router.get('/articles', async (req, res) => {
    try {
        // We only select specific fields to keep the response light
        const articles = await Article.find({ status: 'published' })
            .select('title slug heroImageUrl metaDescription publishedAt')
            .sort({ publishedAt: -1 }); // Newest first

        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch articles" });
    }
});

/**
 * Fetch a single article by its slug
 */
router.get('/articles/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({ 
            slug: req.params.slug, 
            status: 'published' 
        });

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        res.json(article);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch article details" });
    }
});


module.exports = router;