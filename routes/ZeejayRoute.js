const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');

// Configure Multer for memory storage (easiest for small email attachments)
const storage = multer.memoryStorage();
const upload = multer.single('image'); // 'image' matches payload.append("image", ...)

// ─── EMAIL CONFIGURATION ──────────────────────────────────────────
// Replace with your actual SMTP details
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD, // Use a Gmail App Password, not your login pass
  },
});

router.post('/booking', upload, async (req, res) => {
  try {
    const data = req.body;
    
    // Parse the services string back into an object
    const servicesObj = data.services ? JSON.parse(data.services) : {};
    
    // Format Services for HTML
    let servicesHtml = "";
    for (const [category, list] of Object.entries(servicesObj)) {
      servicesHtml += `<li><strong>${category}:</strong> ${list.join(', ')}</li>`;
    }

    // ─── HTML EMAIL TEMPLATE ────────────────────────────────────────
    const htmlContent = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #0284c7;">New Service Booking Request</h2>
        <hr />
        <p><strong>Customer:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        
        <h3 style="color: #0284c7;">Address</h3>
        <p>${data.street}, Unit ${data.unit || 'N/A'}<br>${data.city}, ${data.state} ${data.code}<br>${data.country}</p>
        
        <h3 style="color: #0284c7;">Selected Services</h3>
        <ul>${servicesHtml}</ul>
        
        <p><strong>Additional Details:</strong><br>${data.additionalDetails || 'None'}</p>
        
        ${req.file ? '<p style="color: #666;"><i>(An image was attached to this request)</i></p>' : ''}
      </div>
    `;

    // ─── SEND MAIL ──────────────────────────────────────────────────
    const mailOptions = {
      from: `"ZeeJay service Booking" ${process.env.GMAIL_USER}`,
      to: 'ayush.patel.code@gmail.com',
      subject: `New Service Booking Request from ${data.firstName}`,
      html: htmlContent,
    };

    // Attach image if it exists
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Booking received and email sent!" });

  } catch (error) {
    console.error("Booking API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;