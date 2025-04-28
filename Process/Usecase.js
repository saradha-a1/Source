import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables
if (!process.env.DOMAIN_NAME) {
  throw new Error('DOMAIN_NAME is not defined in .env file');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in .env file');
}

const DOMAIN_NAME = process.env.DOMAIN_NAME.trim();
const USE_CASE_COUNT = parseInt(process.env.USE_CASE_COUNT) || 10;
const API_KEY = process.env.OPENAI_API_KEY.trim();

// File paths
const assetsPath = path.join(__dirname, '../Assets');
const csvPath = path.join(assetsPath, 'CSV');
const domainUseCasePath = path.join(csvPath, 'Domain_usecase.csv');
const archivePath = path.join(csvPath, 'Archived');
const consolidatedArchivePath = path.join(archivePath, 'Usecase_archive.csv');

// Ensure directories exist
[assetsPath, csvPath, archivePath].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const openai = new OpenAI({ apiKey: API_KEY });

// CSV header configuration
const csvHeader = [
  { id: 'Domain', title: 'Domain' },
  { id: 'Category', title: 'Category' },
  { id: 'Subcategory', title: 'Subcategory' },
  { id: 'Description', title: 'Description' }
];

/**
 * Load records from archive CSV to check for duplicates
 */
function loadArchiveRecords() {
  if (!fs.existsSync(consolidatedArchivePath)) return { records: [], fingerprints: new Set() };
  
  const content = fs.readFileSync(consolidatedArchivePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const records = [];
  const fingerprints = new Set();

  // Skip header line if exists
  let startIndex = 0;
  while (startIndex < lines.length && isHeaderLine(lines[startIndex])) {
    startIndex++;
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const record = parseCSVLine(lines[i]);
    if (record) {
      records.push(record);
      fingerprints.add(createFingerprint(record));
    }
  }

  return { records, fingerprints };
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
 * Create a unique fingerprint for a record
 */
function createFingerprint(record) {
  return `${record.Domain.toLowerCase()}_${record.Category.toLowerCase()}_${record.Subcategory.toLowerCase()}_${record.Description.toLowerCase()}`
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Generate new unique use cases
 */
async function generateNewUseCases(existingFingerprints) {
  const prompt = `Generate exactly ${USE_CASE_COUNT} unique ${DOMAIN_NAME} use cases in CSV format.
  Each use case should be completely different from existing patterns.
  
  Required CSV format (without header):
  "${DOMAIN_NAME}","category","subcategory","specific use case description"
  "${DOMAIN_NAME}","another category","subcategory","different description"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { 
        role: "system", 
        content: `You are a ${DOMAIN_NAME} domain expert generating exactly ${USE_CASE_COUNT} unique use cases in perfect CSV format without header.` 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.9,
    max_tokens: 3000
  });

  const content = response.choices[0].message.content;
  const newRecords = parseCSVContent(content);
  
  // Filter out duplicates and ensure we have exactly USE_CASE_COUNT unique records
  const uniqueRecords = [];
  const usedFingerprints = new Set();
  
  for (const record of newRecords) {
    if (uniqueRecords.length >= USE_CASE_COUNT) break;
    
    const fp = createFingerprint(record);
    if (!existingFingerprints.has(fp) && !usedFingerprints.has(fp)) {
      uniqueRecords.push(record);
      usedFingerprints.add(fp);
    }
  }

  // If we didn't get enough unique records, generate more
  if (uniqueRecords.length < USE_CASE_COUNT) {
    const additionalNeeded = USE_CASE_COUNT - uniqueRecords.length;
    console.log(`⚠️ Only got ${uniqueRecords.length} unique records, generating ${additionalNeeded} more`);
    const additionalRecords = await generateNewUseCases(new Set([...existingFingerprints, ...usedFingerprints]));
    return [...uniqueRecords, ...additionalRecords.slice(0, additionalNeeded)];
  }

  return uniqueRecords;
}

/**
 * Parse CSV content from OpenAI response, skipping any headers
 */
function parseCSVContent(content) {
  return content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !isHeaderLine(line))
    .map(parseCSVLine)
    .filter(record => record);
}

/**
 * Save records to CSV with single header
 */
async function saveRecords(records, filePath) {
  // Always create fresh file with single header
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: csvHeader,
    alwaysQuote: true
  });

  await csvWriter.writeRecords(records);
  console.log(`✅ Saved ${records.length} records to ${path.basename(filePath)}`);
}

/**
 * Add records to archive
 */
async function addToArchive(newRecords) {
  if (newRecords.length === 0) return;

  // Read existing archive records if file exists
  let allRecords = [];
  const existingFingerprints = new Set();
  
  if (fs.existsSync(consolidatedArchivePath)) {
    const content = fs.readFileSync(consolidatedArchivePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    let startIndex = 0;
    while (startIndex < lines.length && isHeaderLine(lines[startIndex])) {
      startIndex++;
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const record = parseCSVLine(lines[i]);
      if (record) {
        allRecords.push(record);
        existingFingerprints.add(createFingerprint(record));
      }
    }
  }

  // Filter out any duplicates from newRecords
  const uniqueNewRecords = newRecords.filter(record => {
    const fp = createFingerprint(record);
    return !existingFingerprints.has(fp);
  });

  if (uniqueNewRecords.length === 0) {
    console.log('ℹ️ No new unique records to add to archive');
    return;
  }

  // Combine with existing records
  allRecords = [...allRecords, ...uniqueNewRecords];

  // Save with single header
  await saveRecords(allRecords, consolidatedArchivePath);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`🏷️ Domain: ${DOMAIN_NAME}`);
    console.log(`🔢 Use Case Count: ${USE_CASE_COUNT}`);

    // Load archive data to check for duplicates
    const { fingerprints: archiveFingerprints } = loadArchiveRecords();
    console.log(`🔍 Found ${archiveFingerprints.size} existing use cases in archive`);

    // Generate new unique cases
    const newRecords = await generateNewUseCases(archiveFingerprints);
    console.log(`✨ Generated ${newRecords.length} new unique use cases`);

    if (newRecords.length === 0) {
      console.log('ℹ️ No new unique use cases generated');
      return;
    }

    // Save new records to Domain_usecase.csv
    await saveRecords(newRecords, domainUseCasePath);

    // Add new records to archive
    await addToArchive(newRecords);
    
    console.log('🎉 Process completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();