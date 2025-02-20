const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const QRCode = require("qrcode");

// Load environment variables
require("dotenv").config();

const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.AIRTABLE_TABLE_NAME;
const airtableToken = process.env.AIRTABLE_ACCESS_TOKEN;

async function getLatestSubmission() {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${baseId}/${tableName}?sort[0][field]=Created&sort[0][direction]=desc&maxRecords=1`,
      {
        headers: { Authorization: `Bearer ${airtableToken}` },
      }
    );

    console.log(
      "🔍 Airtable API Response:",
      JSON.stringify(response.data, null, 2)
    ); // Debugging

    if (!response.data.records || response.data.records.length === 0) {
      console.warn("⚠️ No records found in Airtable.");
      return null;
    }

    return response.data.records[0]; // Return the latest record
  } catch (error) {
    console.error(
      "🚨 Error fetching Airtable data:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

module.exports = async (req, res) => {
  try {
    const latestRecord = await getLatestSubmission();
    if (!latestRecord) {
      console.warn("⚠️ No attendees found in Airtable.");
      return res.status(200).send("⚠️ No attendees registered yet.");
    }

    // 🔹 Use Auto-Increment Custom ID for the ticket
    const registrationID = latestRecord.fields["Custom ID"]; // Make sure this matches your Airtable column name

    console.log("✅ Registration ID:", registrationID);

    if (!registrationID || typeof registrationID !== "string") {
      console.error("🚨 ERROR: Registration ID is missing.");
      return res.status(500).send("Server error: Registration ID is invalid.");
    }

    // 🔹 Path to ticket template image
    const ticketTemplatePath = path.join(process.cwd(), "public", "event.jpg");
    if (!fs.existsSync(ticketTemplatePath)) {
      console.error("🚨 ERROR: event.jpg is missing in /public.");
      return res.status(500).send("Ticket template not found.");
    }

    // 🔹 Generate QR Code with the Registration ID
    const qrCodeBuffer = await QRCode.toBuffer(registrationID.toString(), {
      width: 180,
    });

    // 🔹 Overlay QR Code on the ticket template
    const finalImage = await sharp(ticketTemplatePath)
      .composite([{ input: qrCodeBuffer, left: 1680, top: 250 }]) // Adjust QR code position as needed
      .toBuffer();

    console.log("✅ Ticket generated successfully!");
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(finalImage);
  } catch (error) {
    console.error("🚨 Error generating ticket:", error);
    res.status(500).send("Server error: " + error.message);
  }
};
