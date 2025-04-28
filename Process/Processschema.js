import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the script's current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define paths - changed to point to Processed folder
const processedDir = path.join(__dirname, '../Asset/CSV/Processed');

// Debug: Check processed folder path
console.log(`Looking for processed JSONs in: ${processedDir}`);

// Ensure the directory exists
if (!fs.existsSync(processedDir)) {
    console.error(`Processed directory not found: ${processedDir}`);
    process.exit(1);
}

// API configuration
const BASE_URL = process.env.BASE_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const headers = {
    'X-Access-Key-Id': process.env.ACCESS_KEY_ID,
    'X-Access-Key-Secret': process.env.ACCESS_KEY_SECRET,
    'Content-Type': 'application/json'
};

// Function to send PUT request to API
async function sendMetadataPayload(processName, payload) {
    const url = `${BASE_URL}/metadata/2/${ACCOUNT_ID}/process/${processName}/draft`;

    console.log(`Sending to URL: ${url}`);
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes');

    try {
        const response = await axios.put(url, payload, { 
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity 
        });
        console.log(`✅ Success for ${processName}:`, response.status, response.statusText);
        return true;
    } catch (error) {
        console.error(`❌ Failed for ${processName}:`, error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
        return false;
    }
}

// Process all JSON files in the Processed directory
async function processAllJsonFiles() {
    const files = fs.readdirSync(processedDir)
        .filter(file => file.endsWith('.json'))
        .sort(); // Process in alphabetical order

    if (files.length === 0) {
        console.log('No JSON files found in the processed directory.');
        return;
    }

    console.log(`Found ${files.length} JSON files to process`);

    // Process files sequentially with delay between requests
    for (const file of files) {
        const filePath = path.join(processedDir, file);
        const processName = path.basename(file, '.json');
        
        console.log(`\nProcessing ${processName}...`);

        try {
            const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            await sendMetadataPayload(processName, payload);
            
            // Add delay between requests (optional)
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }
}

// Run with error handling
(async () => {
    try {
        await processAllJsonFiles();
        console.log('\nAll files processed!');
    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
})();