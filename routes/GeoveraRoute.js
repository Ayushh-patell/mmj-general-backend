const express = require("express");
const { sendEmail } = require("../utils/emailService");

const router = express.Router();

const RECEIVER_EMAIL = 'ayush.patel.code@gmail.com';


// Helper: Generate email template
const generateEmailTemplate = (title, subtitle, fields) => {
  const rows = Object.entries(fields)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0; width: 35%;">
            ${label}
          </td>
          <td style="padding: 12px 16px; color: #1e293b; font-size: 14px; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
            ${value || "Not provided"}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body style="margin: 0; padding: 30px 15px; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif;">

      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">

        <div style="background: #1e293b; padding: 28px 24px;">
          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">
            New Enquiry
          </p>

          <h2 style="margin: 0; color: #ffffff; font-size: 22px;">
            ${title}
          </h2>

          <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 14px;">
            ${subtitle}
          </p>
        </div>

        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${rows}
          </table>

          <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
            This enquiry was submitted through your website.
          </p>
        </div>

      </div>

    </body>
    </html>
  `;
};


// Helper: Escape HTML to prevent HTML injection
const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


// Helper: Validate required fields
const validateFields = (body, requiredFields) => {
  return requiredFields.every(
    (field) =>
      typeof body[field] === "string" &&
      body[field].trim().length > 0
  );
};


// DEALER ENQUIRY
router.post("/dealer-enquiry", async (req, res) => {
  try {
    const {
      fullName,
      businessName,
      phoneNumber,
      email,
      businessType,
      location,
      details,
    } = req.body;

    const requiredFields = [
      "fullName",
      "businessName",
      "phoneNumber",
      "email",
      "businessType",
      "location",
      "details",
    ];

    if (!validateFields(req.body, requiredFields)) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const fields = {
      "Full Name": escapeHtml(fullName.trim()),
      "Business Name": escapeHtml(businessName.trim()),
      "Phone Number": escapeHtml(phoneNumber.trim()),
      "Email Address": escapeHtml(email.trim()),
      "Business Type": escapeHtml(businessType.trim()),
      "Location": escapeHtml(location.trim()),
      "Additional Details": escapeHtml(details.trim()),
    };

    const html = generateEmailTemplate(
      "Dealer Enquiry",
      "A new dealer partnership enquiry has been received.",
      fields
    );

    const text = Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    await sendEmail({
      to: RECEIVER_EMAIL,
      subject: `New Dealer Enquiry - ${businessName}`,
      text,
      html,
      replyTo: email.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Dealer enquiry submitted successfully.",
    });

  } catch (err) {
    console.error("Dealer enquiry error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


// FARMER ENQUIRY
router.post("/farmer-enquiry", async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      crop,
      cropStage,
      location,
      requirement,
    } = req.body;

    const requiredFields = [
      "fullName",
      "phoneNumber",
      "crop",
      "cropStage",
      "location",
      "requirement",
    ];

    if (!validateFields(req.body, requiredFields)) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const fields = {
      "Full Name": escapeHtml(fullName.trim()),
      "Phone Number": escapeHtml(phoneNumber.trim()),
      "Crop": escapeHtml(crop.trim()),
      "Crop Stage": escapeHtml(cropStage.trim()),
      "Location": escapeHtml(location.trim()),
      "Requirement": escapeHtml(requirement.trim()),
    };

    const html = generateEmailTemplate(
      "Farmer Enquiry",
      "A new farmer assistance enquiry has been received.",
      fields
    );

    const text = Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    await sendEmail({
      to: RECEIVER_EMAIL,
      subject: `New Farmer Enquiry - ${fullName}`,
      text,
      html,
      replyTo: RECEIVER_EMAIL,
    });

    return res.status(200).json({
      success: true,
      message: "Farmer enquiry submitted successfully.",
    });

  } catch (err) {
    console.error("Farmer enquiry error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


module.exports = router;