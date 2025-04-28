import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LOGIN_URL = process.env.BASE_URL;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

if (!LOGIN_URL || !EMAIL || !PASSWORD) {
    console.error('❌ Missing environment variables! Check .env file.');
    process.exit(1);
}

// Function to read datasets from Dataset_list.json
async function readDatasets() {
    const filePath = path.resolve(__dirname, '../Asset/CSV/Dataset_list.json');
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const datasetList = JSON.parse(data);
        return datasetList.flatMap(process => process.Datasets || []);
    } catch (error) {
        console.error('❌ Error reading dataset file:', error);
        return [];
    }
}

// Function to wait for a specific time (in milliseconds)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to process each dataset
async function processDataset(page, dataset) {
    try {
        console.log(`🌍 Navigating to dataset: ${dataset.datasetName}`);
        const datasetUrl = `https://perftesting.tst.zingworks.com/view/dataset/${dataset.datasetName}`;
        await page.goto(datasetUrl, { waitUntil: 'networkidle0' });
        await delay(5000); // Wait to ensure the dataset UI fully loads

        for (const column of dataset.columns) {
            console.log(`🖱️ Adding column: ${column.columnName}`);

            // Wait for the add button to be available
            console.log('⏳ Checking if "Add Column" button is visible...');
            await page.waitForFunction(() => {
                const el = document.querySelector('.addButton--ccbfe20062c89f2.shadow-12dp');
                return el && el.offsetParent !== null;
            }, { timeout: 60000 });

            await page.screenshot({ path: `before_add_${dataset.datasetName}_${column.columnName}.png`, fullPage: true });

            await page.click('.addButton--ccbfe20062c89f2.shadow-12dp');
            await delay(3000);

            console.log(`🔍 Searching for type: ${column.columnType}`);
            const foundElement = await findElementByText(page, column.columnType);
            if (!foundElement) {
                console.log(`⚠️ Could not find type: ${column.columnType}, skipping...`);
                continue;
            }

            console.log(`✅ Found "${column.columnType}", clicking...`);
            await foundElement.click();

            console.log(`✏️ Typing column name: ${column.columnName}`);
            await page.waitForSelector("input[placeholder='Name']");
            await page.focus("input[placeholder='Name']");

            await page.evaluate(() => {
                const input = document.querySelector("input[placeholder='Name']");
                if (input) input.value = '';
            });

            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.press('Backspace');
            await page.keyboard.up('Control');

            await page.type("input[placeholder='Name']", column.columnName, { delay: 100 });

            console.log(`✅ Clicking "Done" for ${column.columnName}`);
            await page.waitForSelector("div[class='footer--dbf1580dfbace4'] div:nth-child(2) button:nth-child(1)", { timeout: 60000 });
            await page.click("div[class='footer--dbf1580dfbace4'] div:nth-child(2) button:nth-child(1)");
            await delay(2000);
        }

        console.log(`✅ Dataset "${dataset.datasetName}" processed.`);
    } catch (err) {
        console.error(`❌ An error occurred in dataset "${dataset.datasetName}":`, err.message);
        await page.screenshot({ path: `error_${dataset.datasetName}.png`, fullPage: true });
    }
}

// Helper function to find an element by its text content
async function findElementByText(page, text) {
    const elements = await page.$$('body *');
    for (let element of elements) {
        const elementText = await page.evaluate(el => el.textContent.trim(), element);
        if (elementText === text) {
            return element;
        }
    }
    return null;
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null, args: ['--start-maximized'] });
    const page = await browser.newPage();

    console.log('🔐 Logging into the application...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

    await page.type('#email', EMAIL, { delay: 100 });
    await page.type('#password', PASSWORD, { delay: 100 });
    await page.click('button[data-component="button"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log('✅ Logged in successfully.');

    const datasets = await readDatasets();
    if (!datasets.length) {
        console.log('⚠️ No datasets found. Exiting...');
        await browser.close();
        return;
    }

    for (let dataset of datasets) {
        await processDataset(page, dataset);
    }

    console.log('🎉 All datasets processed.');
    await browser.close();
})();
