import fs from 'fs';
import path from 'path';
import axios from 'axios';
import papaparse from 'papaparse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
dotenv.config();


dotenv.config(); // Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ✅ Load environment variables from Source/.env
dotenv.config({ path: path.resolve('../.env') });

// Load process names from CSV
const csvFilePath = path.join(__dirname, '../Asset/CSV/ProcessName.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');
const processData = papaparse.parse(csvData, { header: true }).data;

// API endpoint
const url = 'https://perftesting.tst.zingworks.com/flow/2/AcALBWpQxCDN/process';

// Headers
const headers = {
  'Content-Type': 'application/json',
  'X-Access-Key-Id': process.env.ACCESS_KEY_ID,
  'X-Access-Key-Secret': process.env.ACCESS_KEY_SECRET
};

async function createProcess(process) {
  const processName = process['ProcessName'];
  if (!processName) return;

  const payload = {
    _id: processName,
    Type: 'Process',
    Name: processName,
    Status: 'Draft'
  };

  try {
    const res = await axios.post(url, payload, { headers });
    if (res.status === 200 && res.data._id === processName) {
      console.log(`Process created: ${processName} with status ${res.status}`);
    } else {
      console.error(`Failed to create process: ${processName}`, res.data);
    }
  } catch (error) {
    console.error(`Error creating process: ${processName}`, error.message);
  }
}

(async () => {
  for (const process of processData) {
    await createProcess(process);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep 1s
  }
})();
