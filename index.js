require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");

const app = express();
const PORT = 5000;
console.log(Math.round(500))
// Load Google Sheets API credentials
const auth = new google.auth.GoogleAuth({
  keyFile: "google-key.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function fetchSheetData() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: process.env.RANGE,
    });
    return res.data.values;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

app.get("/raw-data", async (req, res) => {
  const rawData = await fetchSheetData();

  if (!rawData || rawData.length < 2) {
    return res.json({ message: "No data found" });
  }

  res.json(rawData);
});

app.get("/formatted-data", async (req, res) => {
  const rawData = await fetchSheetData();

  if (!rawData || rawData.length < 2) {
    return res.json({ message: "No data found" });
  }

  const formattedData = rawData.slice(1).map((row) => ({
    name: row[0] || "N/A",
    column_values: {
      due_date: row[1] || "N/A",
      budget: {
        value: row[2] ? parseFloat(row[2].replace("$", "")) : 0.0,
        type: "currency",
      },
      progress: row[3] ? parseInt(row[3].replace("%", ""), 10) : 0,
      timeline: {
        start_date: row[4] ? row[4].split(" - ")[0] : "N/A",
        end_date: row[4] ? row[4].split(" - ")[1] : "N/A",
      },
      description: row[5] || "N/A",
    },
  }));

  res.json(formattedData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
