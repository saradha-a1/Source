import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Load API credentials from .env
const BASE_URL = process.env.BASE_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.ACCESS_KEY_SECRET;

// Validate environment variables
if (!BASE_URL || !ACCOUNT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
  console.error("❌ Missing required environment variables in .env file.");
  process.exit(1);
}

// Construct API endpoint
const API_URL = `${BASE_URL}/flow/2/${ACCOUNT_ID}/list`;

// Headers for API requests
const headers = {
  "Content-Type": "application/json",
  "X-Access-Key-Id": ACCESS_KEY_ID,
  "X-Access-Key-Secret": ACCESS_KEY_SECRET,
};

// Read and parse Dataset_list.json
const datasetFilePath = path.resolve(__dirname, "../Asset/CSV/Dataset_list.json");

let datasetData;
try {
  const rawData = fs.readFileSync(datasetFilePath, "utf-8");
  datasetData = JSON.parse(rawData);
} catch (error) {
  console.error("❌ Error reading Dataset_list.json:", error.message);
  process.exit(1);
}

// Extract lists dynamically from all processes
let allLists = [];
for (const process of datasetData) {
  if (Array.isArray(process.Lists)) {
    allLists.push(...process.Lists);
  }
}

// Validate lists data
if (!Array.isArray(allLists) || allLists.length === 0) {
  console.error("🚨 No valid lists found in Dataset_list.json! Check file structure.");
  process.exit(1);
}

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    for (const listData of allLists) {
      const listName = listData.listName; // Correct field reference
      console.log(`📌 Checking existence for list: ${listName}`);

      try {
        const checkURL = `${API_URL}/${listName}`;
        await axios.get(checkURL, { headers });
        console.log(`⚠️ List '${listName}' already exists. Skipping creation.`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`🚀 Creating list: ${listName}`);
          try {
            const postResponse = await axios.post(
              API_URL,
              {
                _id: listName,
                Type: "List",
                Name: listName,
                Status: "Live",
              },
              { headers }
            );
            console.log(`✅ POST Success for '${listName}':`, postResponse.data);
          } catch (creationError) {
            console.error(
              `❌ Error creating list '${listName}':`,
              creationError.response?.data || creationError.message
            );
          }
        } else {
          console.error(
            `❌ Error checking existence of list '${listName}':`,
            error.response?.data || error.message
          );
        }
      }
    }

    console.log("🎉 All lists processed successfully!");
  } catch (error) {
    console.error("❌ General error occurred:", error.message);
  } finally {
    await browser.close();
  }
}

// Execute the script
main();
