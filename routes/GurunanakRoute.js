

const express = require("express");
const axios = require("axios");
const express = require('express');
const router = express.Router();
require("dotenv").config();
const nodemailer = require('nodemailer');


// Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD, // Use an "App Password" here
  },
});


const ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN_GURUNANAK;
const ACCOUNT_ID = process.env.ACCOUNT_ID_GURUNANAK;
const LOCATION_ID = process.env.LOCATION_ID_GURUNANAK;

// GET REVIEWS
router.get("/reviews", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.app.outscraper.com/maps/reviews-v3",
      {
        params: {
          query: "Guru Nanak Bakery Edmonton",
          reviews_limit: 20,
        },
        headers: {
          "X-API-KEY": process.env.OUTSCRAPER_KEY,
        },
      }
    );

    const reviews = response.data?.data?.[0]?.reviews_data || [];

    const formatted = reviews.map((r) => ({
      name: r.author_title,
      rating: r.rating,
      comment: r.review_text,
      time: r.review_datetime_utc,
      source: "outscraper",
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


router.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Basic Validation
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #fffaf5;
          color: #3f3f46;
          line-height: 1.6;
        }

        .container {
          max-width: 600px;
          margin: 20px auto;
          border: 1px solid #f3e8ff;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .header {
          background: linear-gradient(135deg, #f97316, #ec4899);
          color: white;
          padding: 24px;
          text-align: center;
        }

        .content {
          padding: 24px;
        }

        .field {
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f4f4f5;
        }

        .label {
          font-size: 12px;
          text-transform: uppercase;
          color: #a1a1aa;
          font-weight: bold;
        }

        .value {
          font-size: 16px;
          color: #18181b;
          margin-top: 4px;
        }

        .message-box {
          background: #fff7ed;
          border-left: 4px solid #f97316;
          padding: 14px;
          border-radius: 8px;
          white-space: pre-line;
        }

        .footer {
          background: #fafafa;
          text-align: center;
          padding: 14px;
          font-size: 12px;
          color: #a1a1aa;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          background: #f97316;
          color: white;
          margin-top: 6px;
        }
      </style>
    </head>

    <body>
      <div class="container">

        <div class="header">
          <h2 style="margin:0;">New Bakery Inquiry 🍰</h2>
          <p style="margin:6px 0 0 0;">Order / Custom Cake Request Received or general inquiry</p>
        </div>

        <div class="content">

          <div class="field">
            <div class="label">Customer Name</div>
            <div class="value">${name}</div>
          </div>

          <div class="field">
            <div class="label">Contact Details</div>
            <div class="value">${email} ${phone ? `| ${phone}` : ""}</div>
          </div>

          <div class="field">
            <div class="label">Message / Order Details</div>
            <div class="message-box">
              ${message}
            </div>
          </div>

          <div class="field">
            <div class="label">Source</div>
            <div class="value">Website Contact Form</div>
          </div>

        </div>

        <div class="footer">
          © ${new Date().getFullYear()} Guru Nanak Bakery 
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Guru Nanak Bakery Website" <${process.env.GMAIL_USER}>`,
      to: 'ayush.patel.code@gmail.com',
      subject: `New Bakery Inquiry from ${name}`,
      html: htmlContent,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Mail Error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;