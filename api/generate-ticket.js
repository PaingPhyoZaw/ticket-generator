const sharp = require("sharp");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

module.exports = async (req, res) => {
  const { registrationID } = req.query;

  try {
    if (!registrationID) {
      return res.status(400).send("Missing registration ID");
    }

    // Path to the ticket template (uploaded in Vercel's `public` folder)
    const ticketTemplatePath = path.join(process.cwd(), "public", "event.jpg");

    // Generate QR code dynamically as a buffer
    const qrCodeBuffer = await QRCode.toBuffer(registrationID, {
      width: 200,
      margin: 2,
    });

    // Load ticket template and overlay the QR code at a fixed position
    const finalImageBuffer = await sharp(ticketTemplatePath)
      .composite([
        {
          input: qrCodeBuffer,
          left: 1450, // Adjust X position
          top: 180, // Adjust Y position
        },
      ])
      .toBuffer();

    // Set response headers and send image
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(finalImageBuffer);
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).send("Error processing ticket image");
  }
};
