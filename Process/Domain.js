import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const inputPath = path.join(__dirname, '../Assets/CSV/Domain_usecase.csv');
const outputPath = path.join(__dirname, '../Asset/CSV/ProcessName.csv');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Transform Domain_usecase data to ProcessName format
 */
function transformData() {
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Domain_usecase.csv not found at:', inputPath);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const records = [];

  // Skip header line
  let startIndex = 0;
  while (startIndex < lines.length && isHeaderLine(lines[startIndex])) {
    startIndex++;
  }

  // Process each record
  for (let i = startIndex; i < lines.length; i++) {
    const record = parseCSVLine(lines[i]);
    if (record) {
      records.push({
        Domain: record.Domain,
        ProcessName: record.Subcategory,
        UseCase: record.Description
      });
    }
  }

  return records;
}

/**
 * Check if a line is a header line
 */
function isHeaderLine(line) {
  return line.trim() === '"Domain","Category","Subcategory","Description"';
}

/**
 * Parse a single CSV line
 */
function parseCSVLine(line) {
  const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/);
  if (!match) return null;
  
  return {
    Domain: match[1].trim(),
    Category: match[2].trim(),
    Subcategory: match[3].trim(),
    Description: match[4].trim()
  };
}

/**
 * Save transformed data to ProcessName.csv
 */
async function saveTransformedData(records) {
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'Domain', title: 'Domain' },
      { id: 'ProcessName', title: 'ProcessName' },
      { id: 'UseCase', title: 'UseCase' }
    ],
    alwaysQuote: true
  });

  await csvWriter.writeRecords(records);
  console.log(`✅ Saved ${records.length} records to ${path.basename(outputPath)}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const transformedRecords = transformData();
    if (transformedRecords.length === 0) {
      console.log('ℹ️ No records found to transform');
      return;
    }
    
    await saveTransformedData(transformedRecords);
    console.log('🎉 Transformation completed successfully!');
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();