import axios from 'axios';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { finished } from 'stream/promises';

// Setup paths and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('✅ Script loaded and running...');

// Load .env variables
const API_BASE_URL = process.env.BASE_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.ACCESS_KEY_SECRET;
const NUM_PROCESSES = parseInt(process.env.NUM_PROCESSES);

const CSV_FILE_PATH = path.join(__dirname, '../Asset/CSV/ProcessName.csv');
const OUTPUT_DIR = path.join(__dirname, 'responses');

// Validate .env
if (!API_BASE_URL || !ACCOUNT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.table({ API_BASE_URL, ACCOUNT_ID, ACCESS_KEY_ID, ACCESS_KEY_SECRET });
  process.exit(1);
}

// Ensure output folder exists
async function ensureOutputDir() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
}

// ✅ FIXED: Read only NUM_PROCESSES from CSV
async function getProcessNames() {
  return new Promise((resolve, reject) => {
    const processNames = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const processName = row["ProcessName"];
        if (processName && processName.trim()) {
          const trimmed = processName.trim();
          console.log(`✅ Found ProcessName: ${trimmed}`);
          processNames.push(trimmed);
        }
      })
      .on('end', () => resolve(processNames))
      .on('error', reject);
  });
}

// Call API for each process
async function callProcessAPI(processName, processId) {
  const url = `${API_BASE_URL}/process/2/${ACCOUNT_ID}/${processName}`;
  const headers = {
    'X-Access-Key-Id': ACCESS_KEY_ID,
    'X-Access-Key-Secret': ACCESS_KEY_SECRET,
    'Content-Type': 'application/json'
  };

  console.log(`➡️ [${processId}] Calling API: ${url}`);

  try {
    const response = await axios.post(url, {}, { headers });
    console.log(`✅ [${processId}] Success! Status: ${response.status}`);
    return {
      success: true,
      processId,
      processName,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error(`❌ [${processId}] Failed:`, error.response?.data || error.message);
    return {
      success: false,
      processId,
      processName,
      error: error.response?.data || error.message,
      status: error.response?.status || 'unknown'
    };
  }
}

// Save response JSON (append multiple runs to same file)
async function saveResponse(processName, response) {
  const safeName = processName.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = path.join(OUTPUT_DIR, `response_${safeName}.json`);

  let existing = [];

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    if (content.trim()) {
      existing = JSON.parse(content);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`⚠️ Could not read/parse existing JSON: ${filePath}`);
      console.error(err);
    }
  }

  existing.push(response);

  await fs.promises.writeFile(filePath, JSON.stringify(existing, null, 2));
  console.log(`📁 Saved response for "${processName}" → ${filePath}`);
}


// Main runner
async function main() {
  try {
    console.log('🔍 Gathering process names...');
    await ensureOutputDir();

    const processNames = await getProcessNames();
    console.log(`🚀 Running each process ${NUM_PROCESSES} time(s) for ${processNames.length} process(es)...`);

    for (let i = 0; i < processNames.length; i++) {
      const processName = processNames[i];

      for (let j = 0; j < NUM_PROCESSES; j++) {
        const processId = `process_${i + 1}_run_${j + 1}`;

        console.log(`🟡 [${processId}] Calling "${processName}" (Run ${j + 1})`);
        const result = await callProcessAPI(processName, processId);
        await saveResponse(processName, result);

        await new Promise(resolve => setTimeout(resolve, 500)); // optional delay
      }
    }

    console.log('\n✅ All process calls completed! Check the "responses" folder.');
  } catch (err) {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
  }
}

main();
