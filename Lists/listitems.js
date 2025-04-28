import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Read and parse Dataset_list.json
const datasetFilePath = path.resolve(__dirname, '../Asset/CSV/Dataset_list.json');

let datasetData;
try {
    const rawData = fs.readFileSync(datasetFilePath, 'utf-8');
    datasetData = JSON.parse(rawData);
} catch (error) {
    console.error("❌ Error reading Dataset_list.json:", error.message);
    process.exit(1);
}

// Extract the "Lists" attribute dynamically
let lists = [];
for (const process of datasetData) {
    if (Array.isArray(process.Lists)) {
        lists.push(...process.Lists);
    }
}

// Validate lists data
if (!Array.isArray(lists) || lists.length === 0) {
    console.error("🚨 No lists found in Dataset_list.json! Check file structure.");
    process.exit(1);
}

// Login credentials
const LOGIN_URL = 'https://perftesting.tst.zingworks.com/view/login';
const EMAIL = process.env.EMAIL || 'saradha@kissflow.com';
const PASSWORD = process.env.PASSWORD || 'Saradha@1228';

async function main() {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null, args: ['--start-maximized'] });
    const page = await browser.newPage();

    try {
        // Step 1: Log in to the application
        console.log('🔐 Logging into the application...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        await page.type('#email', EMAIL, { delay: 100 });
        await page.type('#password', PASSWORD, { delay: 100 });
        await page.click('button[data-component="button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log('✅ Logged in successfully.');

        // Step 2: Iterate over lists
        for (const listData of lists) {
            const listName = listData.listName; // Fixed field reference
            const listValues = listData.values; // Fixed field reference

            console.log(`🚀 Navigating to list: ${listName}`);
            const listURL = `https://perftesting.tst.zingworks.com/view/list/${listName}/`;

            // Navigate to the list page
            await page.goto(listURL, { waitUntil: 'networkidle0' });
            console.log(`✅ Loaded list: ${listName}`);

            // Step 3: Add values to the list
            for (let i = 0; i < listValues.length; i++) {
                try {
                    const selector = `.cell--b8d5b0dad357[data-column-type='text'][data-row='${i}']`;
                    await page.waitForSelector(selector, { timeout: 4000 });
                    await page.click(selector);
                    await page.focus(selector);
                    await delay(6000);
                    await page.keyboard.type(listValues[i], { delay: 400 });
                    await page.keyboard.press('Enter');
                    console.log(`✍️ Typed '${listValues[i]}' into row ${i}`);
                } catch (error) {
                    console.error(`⚠️ Could not type in row ${i} for list '${listName}':`, error.message);
                }
            }

            console.log(`✅ Completed list: ${listName}`);
        }

        console.log('🎉 All lists processed successfully!');
    } catch (error) {
        console.error("❌ General error occurred:", error.message);
    } finally {
        await browser.close();
    }
}

// Execute the script
main();
