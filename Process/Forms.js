import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processCsvPath = path.resolve(__dirname, '../Asset/CSV/ProcessName.csv');
const baseJsonCsvPath = path.resolve(__dirname, '../Asset/CSV/Base_json.csv');
const outputJsonPath = path.resolve(__dirname, '../Asset/CSV/output.json');
const allFieldsJsonPath = path.resolve(__dirname, '../Asset/CSV/all_fields.json');

// Load existing results if any
let existingFields = {};
if (fs.existsSync(allFieldsJsonPath)) {
  try {
    const existingData = fs.readFileSync(allFieldsJsonPath, 'utf-8');
    existingFields = JSON.parse(existingData);
    console.log(`✅ Loaded ${Object.keys(existingFields).length} existing records from all_fields.json`);
  } catch (err) {
    console.error('⚠️ Error reading all_fields.json:', err);
  }
}

// Read Base JSON and Prompt from CSV
async function getBaseJsonAndPromptByCategory() {
  const category = process.env.CATEGORY;
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(baseJsonCsvPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const match = rows.find(r => r.Category?.trim() === category);
        if (!match) return reject(`Category "${category}" not found in Base_json.csv`);
        try {
          const json = JSON.parse(match['Sample Json']);
          const prompt = match['Prompt'] || '';
          resolve({ sampleJson: json, prompt });
        } catch (err) {
          reject(`Error parsing Sample Json: ${err.message}`);
        }
      });
  });
}

function generateUniqueName(baseName, usedNames) {
  let name = baseName;
  let i = 1;
  while (usedNames.has(name)) {
    name = `${baseName}_${i++}`;
  }
  usedNames.add(name);
  return name;
}

async function generateFormData(processName, sampleJson, promptText) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `Use this sample JSON strictly as a template: ${JSON.stringify(sampleJson)}`
        },
        {
          role: 'user',
          content: `Generate a JSON for the process name "${processName}". ${promptText} Ensure the structure follows the sample strictly. Output only valid JSON.`
        }
      ]
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No valid JSON found in response');

    const parsed = JSON.parse(match[0]);
    parsed.ProcessName = processName;

    const usedNames = new Set();
    parsed.Datasets?.forEach(ds => ds.datasetName = generateUniqueName(ds.datasetName, usedNames));
    parsed.Lists?.forEach(lst => lst.listName = generateUniqueName(lst.listName, usedNames));

    return parsed;
  } catch (err) {
    console.error(`❌ Failed for "${processName}":`, err.message);
    return { ProcessName: processName, Fields: [] };
  }
}

function saveToJsonFile(data, filePath) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${Object.keys(data).length} records to ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`❌ Error saving ${filePath}:`, err);
  }
}

// Main function
async function main() {
  try {
    if (!fs.existsSync(processCsvPath)) throw new Error('ProcessName.csv not found');

    const { sampleJson, prompt } = await getBaseJsonAndPromptByCategory();
    const newResults = {};
    const allResults = { ...existingFields }; // Start with existing data

    const processNames = [];

    // Read all rows from CSV and collect valid process names
    await new Promise((resolve, reject) => {
      fs.createReadStream(processCsvPath)
        .pipe(csv())
        .on('data', (row) => {
          const processName = row.ProcessName?.trim();
          if (processName) processNames.push(processName);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    for (const processName of processNames) {
      // Skip if we already have this process in existing data
      if (existingFields[processName]) {
        console.log(`ℹ️ Skipping already processed: ${processName}`);
        continue;
      }

      console.log(`🚀 Generating JSON for: ${processName}`);
      const generated = await generateFormData(processName, sampleJson, prompt);

      newResults[processName] = generated;
      allResults[processName] = generated; // Add to combined results
    }

    // Save only new results to output.json
    saveToJsonFile(newResults, outputJsonPath);
    
    // Save combined results (existing + new) to all_fields.json
    saveToJsonFile(allResults, allFieldsJsonPath);

    console.log(`🎉 Completed! Generated ${Object.keys(newResults).length} new records, total records: ${Object.keys(allResults).length}`);

  } catch (err) {
    console.error('❌ Error in main():', err.stack || err);
  }
}

main();