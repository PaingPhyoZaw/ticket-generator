const sharp = require("sharp");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  try {
    const { registrationID } = req.query;
    if (!registrationID) return res.status(400).send("Missing registration ID");

    console.log("Generating ticket for:", registrationID);

    // Path to the ticket template image
    const ticketTemplatePath = path.join(process.cwd(), "public", "event.jpg");
    if (!fs.existsSync(ticketTemplatePath)) {
      console.error("ERROR: event.jpg missing at", ticketTemplatePath);
      return res.status(500).send("Ticket template not found");
    }

    console.log("event.jpg found, generating QR Code...");

    // Generate QR Code with specific size
    const qrCodeBuffer = await QRCode.toBuffer(registrationID, { width: 250 });

    console.log("Overlaying QR code on ticket...");

    const finalImage = await sharp(ticketTemplatePath)
      .composite([
        {
          input: qrCodeBuffer,
          left: 1620, // Adjust X position (move right or left)
          top: 180, // Adjust Y position (move up or down)
        },
      ])
      .toBuffer();

    console.log("Ticket generated successfully!");
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(finalImage);
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).send("Server error: " + error.message);
  }
};
