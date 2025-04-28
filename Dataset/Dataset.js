import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  // Access keys and configurations from environment variables
  const { ACCESS_KEY_ID, ACCESS_KEY_SECRET, BASE_URL, ACCOUNT_ID } = process.env;

  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !BASE_URL || !ACCOUNT_ID) {
    console.error('❌ Missing required environment variables. Check your .env file.');
    return;
  }

  // Headers for API requests
  const headers = {
    'Content-Type': 'application/json',
    'X-Access-Key-Id': ACCESS_KEY_ID,
    'X-Access-Key-Secret': ACCESS_KEY_SECRET
  };

  // Read and parse the JSON file
  const filePath = path.resolve(__dirname, '../Asset/CSV/Dataset_list.json');
  let jsonData;
  try {
    const data = await fs.readFile(filePath, 'utf8');
    jsonData = JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading or parsing JSON file:', error);
    return;
  }

  // Iterate over each process in the JSON data
  for (const process of jsonData) {
    if (!process.Datasets) continue;

    const datasets = process.Datasets;

    // Iterate over each dataset
    for (const dataset of datasets) {
      const datasetName = dataset.datasetName;

      const postData = {
        _id: datasetName, // Using datasetName as ID
        Type: 'Dataset',
        Name: datasetName,
        Status: 'Live'
      };

      // Construct API endpoint using BASE_URL and ACCOUNT_ID
      const apiEndpoint = `${BASE_URL}/flow/2/${ACCOUNT_ID}/dataset`;

      // Send POST request using axios
      try {
        const response = await axios.post(apiEndpoint, postData, { headers });
        console.log(`✅ Successfully created dataset: ${response.data.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create dataset ${datasetName}:`, error.message);
      }
    }
  }
})();
