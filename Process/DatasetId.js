import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Validate required environment variables
const BASE_URL = process.env.BASE_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

if (!BASE_URL || !ACCOUNT_ID) {
  console.error('Error: Missing required environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('BASE_URL=https://perftesting.tst.zingworks.com');
  console.log('ACCOUNT_ID=AcALBWpQxCDN');
  process.exit(1);
}

// Path configuration
const DATASET_LIST_PATH = path.join(__dirname, '../Asset/CSV/Dataset_list.json');
const OUTPUT_PATH = path.join(__dirname, '../Asset/json/Dataset.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all dataset names from the Dataset_list.json
function getDatasetNames() {
  try {
    const data = fs.readFileSync(DATASET_LIST_PATH, 'utf8');
    const processes = JSON.parse(data);
    
    const datasetNames = [];
    processes.forEach(process => {
      if (process.Datasets && Array.isArray(process.Datasets)) {
        process.Datasets.forEach(dataset => {
          if (dataset.datasetName) {
            datasetNames.push(dataset.datasetName);
          }
        });
      }
    });
    
    if (datasetNames.length === 0) {
      throw new Error('No dataset names found in the file');
    }
    
    return datasetNames;
  } catch (error) {
    console.error('Error reading dataset list:', error.message);
    console.log('Please verify the structure and location of Dataset_list.json');
    process.exit(1);
  }
}

// Fetch data for a single dataset
async function fetchDatasetData(datasetName) {
  try {
    const url = `${BASE_URL}/dataset/2/${ACCOUNT_ID}/${datasetName}/list?page_number=1&page_size=50&apply_preference=true`;
    
    console.log(`Fetching data for: ${datasetName}`);
    console.log(`Using URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key-Id': process.env.ACCESS_KEY_ID,
         'X-Access-Key-Secret': process.env.ACCESS_KEY_SECRET,
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data) {
      throw new Error('Empty response received');
    }
    
    return {
      success: true,
      datasetName,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching ${datasetName}:`, error.message);
    return {
      success: false,
      datasetName,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Main function to process all datasets
async function processAllDatasets() {
  const datasetNames = getDatasetNames();
  console.log(`\nFound ${datasetNames.length} datasets to process:`);
  console.log(datasetNames.map(name => `- ${name}`).join('\n'));
  
  const allData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      accountId: ACCOUNT_ID,
      sourceFile: DATASET_LIST_PATH
    },
    datasets: {}
  };
  
  console.log('\nStarting data fetch...');
  
  for (const datasetName of datasetNames) {
    const result = await fetchDatasetData(datasetName);
    allData.datasets[datasetName] = result.success ? result.data : {
      error: result.error,
      status: result.status
    };
  }
  
  // Save combined data to JSON file
  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
    console.log(`\nSuccess! All data saved to:\n${OUTPUT_PATH}`);
    
    // Print summary
    const successCount = Object.values(allData.datasets).filter(d => !d.error).length;
    const errorCount = datasetNames.length - successCount;
    
    console.log(`\nSummary:`);
    console.log(`✅ ${successCount} successful fetches`);
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} failed fetches`);
      console.log('\nFailed datasets:');
      Object.entries(allData.datasets).forEach(([name, data]) => {
        if (data.error) {
          console.log(`- ${name}: ${data.error} (status: ${data.status || 'N/A'})`);
        }
      });
    }
  } catch (writeError) {
    console.error('Failed to save output file:', writeError.message);
    process.exit(1);
  }
  
  return allData;
}

// Run the script
processAllDatasets().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});