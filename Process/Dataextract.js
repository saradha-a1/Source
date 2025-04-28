import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_FILE = path.join(__dirname, '../Asset/json/Dataset.json');
const OUTPUT_DIR = path.join(__dirname, '../Asset/CSV/ExtractedData');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to convert JSON data to CSV
function jsonToCsv(data) {
  if (!data || data.length === 0) return '';

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';

  // Add each row
  data.forEach(item => {
    const row = headers.map(header => {
      // Escape quotes and wrap in quotes if contains commas
      let value = item[header] !== undefined ? item[header] : '';
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
        if (value.includes(',')) {
          value = `"${value}"`;
        }
      }
      return value;
    });
    csv += row.join(',') + '\n';
  });

  return csv;
}

// Main processing function
function processDatasetFile() {
  try {
    // Read the input file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const dataset = JSON.parse(rawData);

    // Process each dataset
    Object.entries(dataset.datasets).forEach(([datasetName, datasetData]) => {
      if (datasetData.error) {
        console.warn(`⚠️ Skipping ${datasetName} (error: ${datasetData.error})`);
        return;
      }

      if (!datasetData.Data || datasetData.Data.length === 0) {
        console.warn(`⚠️ No data found for ${datasetName}`);
        return;
      }

      // Convert to CSV
      const csvData = jsonToCsv(datasetData.Data);
      
      // Save to file
      const outputFile = path.join(OUTPUT_DIR, `${datasetName}.csv`);
      fs.writeFileSync(outputFile, csvData);
      console.log(`✅ Saved ${datasetName} (${datasetData.Data.length} records) to ${outputFile}`);
    });

    console.log('\n🎉 Extraction complete!');
  } catch (error) {
    console.error('❌ Error processing dataset file:', error.message);
    process.exit(1);
  }
}

// Run the script
processDatasetFile();