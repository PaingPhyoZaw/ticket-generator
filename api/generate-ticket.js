const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const QRCode = require("qrcode");

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

    return response.data.records[0]; // Fetch the latest submitted record
  } catch (error) {
    console.error("Error fetching Airtable data:", error);
    return null;
  }
}

module.exports = async (req, res) => {
  try {
    const latestRecord = await getLatestSubmission();
    if (!latestRecord)
      return res.status(500).send("No records found in Airtable");

    const registrationID = latestRecord.fields["Name"]; // Use "Name" instead of "ID"

    console.log("Generating ticket for:", registrationID);

    const ticketTemplatePath = path.join(process.cwd(), "public", "event.jpg");
    if (!fs.existsSync(ticketTemplatePath)) {
      console.error("ERROR: event.jpg missing");
      return res.status(500).send("Ticket template not found");
    }

    const qrCodeBuffer = await QRCode.toBuffer(registrationID, { width: 180 });

    const finalImage = await sharp(ticketTemplatePath)
      .composite([{ input: qrCodeBuffer, left: 1680, top: 250 }])
      .toBuffer();

    console.log("Ticket generated successfully!");
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(finalImage);
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).send("Server error: " + error.message);
  }
};
