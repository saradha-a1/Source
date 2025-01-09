/*jshint esversion: 11 */
import { browser } from 'k6/browser';
import { check } from 'k6';
import { open, readdir } from 'k6/experimental/fs';
import encoding from 'k6/encoding';

// Helper function to manually parse CSV and return dataset names
function parseCSV(content) {
    const rows = content.split('\n');
    const datasetNames = [];

    // Assuming the first row contains headers
    for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',');

        // Adjust the index to match the column that contains the dataset name
        if (columns[0]) { // Check if the first column has a value
            datasetNames.push(columns[0].trim());
        }
    }

    return datasetNames;
}

// Global variables to store the dataset names and CSV file paths
let datasetNames = [];
let datasetsPath = `../Dataset/datasets/`; // The folder where datasets are stored

// The init phase runs once per virtual user before the test starts
export function init() {
    // Step 1: Read the dataset CSV to get dataset names
    const DATASET_CSV_PATH = `${datasetsPath}Dataset_ID.csv`; // The path to your dataset CSV file
    console.log(`datapath: ${DATASET_CSV_PATH}`);

    const fileContent = open(DATASET_CSV_PATH, 'utf-8'); // Read the CSV content
    datasetNames = parseCSV(fileContent); // Parse CSV content manually
}

// Helper function to read a file's content into a buffer
async function readAll(file) {
    const fileInfo = await file.stat();
    const buffer = new Uint8Array(fileInfo.size);

    const bytesRead = await file.read(buffer);
    if (bytesRead !== fileInfo.size) {
        throw new Error('Unexpected number of bytes read');
    }

    return buffer;
}

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            iterations: 1, // Adjust as needed for the number of datasets
            vus: 1,
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
};

export default async function () {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Step 1: Navigate to the URL and perform login
        const response = await page.goto('https://perftesting.tst.zingworks.com/view/login', { waitUntil: 'load' });
        check(response, { 'Page loaded successfully': (res) => res.status === 200 });
        console.log('Navigated to https://perftesting.tst.zingworks.com/view/login');
        await page.waitForTimeout(2000);

        // Step 2: Type email in the input field
        console.log('Typing email...');
        await page.waitForSelector('(//input[@id="email"])[1]', { timeout: 10000 });
        const emailField = await page.$('(//input[@id="email"])[1]');
        if (emailField) {
            await emailField.type('saradha@kissflow.com');
            console.log('Email typed successfully.');
        } else {
            console.error('Email input field not found.');
        }

        // Step 3: Type password in the input field
        console.log('Typing password...');
        await page.waitForSelector('//input[@id="password"]', { timeout: 10000 });
        const passwordField = await page.$('//input[@id="password"]');
        if (passwordField) {
            await passwordField.type('Saradha@1228');
            console.log('Password typed successfully.');
        } else {
            console.error('Password input field not found.');
        }

        // Step 4: Click the submit button
        console.log('Clicking the submit button...');
        await page.waitForSelector('(//button[contains(@class,"undefined")])[1]', { timeout: 10000 });
        await page.click('(//button[contains(@class,"undefined")])[1]');
        console.log('Clicked the submit button.');

        // Wait for a few seconds to ensure actions are completed
        await page.waitForTimeout(10000);

        // Step 5: Process each dataset
        for (const datasetName of datasetNames) {
            console.log(`Processing Dataset: ${datasetName}`);

            // Step 1: Navigate to the dataset URL
            const datasetUrl = `https://perftesting.tst.zingworks.com/view/dataset/${datasetName}`;
            const response = await page.goto(datasetUrl, { waitUntil: 'load' });
            check(response, { 'Page loaded successfully': (res) => res.status === 200 });
            console.log(`Navigated to: ${datasetUrl}`);
            await page.waitForTimeout(2000);

            // Step 2: Click on the "Import CSV" button
            console.log('Clicking on the "Import CSV" button...');
            await page.waitForSelector("//div[@class='actions--b8d99bd2']//div//button[1]", { timeout: 10000 });
            await page.click("//div[@class='actions--b8d99bd2']//div//button[1]");
            console.log('Clicked on "Import CSV" button.');
            await page.waitForTimeout(2000);

            // Step 3: Check if the corresponding dataset CSV file exists
            const csvFilePath = `${datasetsPath}${datasetName}.csv`;  // Check if the CSV file for this dataset exists
            const fileExists = readdir(datasetsPath).includes(`${datasetName}.csv`);

            if (!fileExists) {
                console.log(`No file found for dataset: ${datasetName}. Skipping...`);
                continue; // Skip to the next dataset if the file doesn't exist
            }

            // Step 4: Upload the corresponding CSV file
            console.log(`Uploading file: ${csvFilePath}`);
            const file = await open(csvFilePath);  // Open the CSV file
            const buffer = await readAll(file);  // Read the file content into a buffer

            await page.setInputFiles('input[type="file"]', {
                name: `${datasetName}.csv`,  // Use the dataset name for the file name
                mimetype: 'text/csv',  // The MIME type for CSV files
                buffer: encoding.b64encode(buffer),  // Base64 encode the file content
            });

            console.log('File uploaded successfully.');
            await page.waitForTimeout(2000);  // Wait for the upload to complete

            // Step 5: Click the "Next" button
            console.log('Clicking on the "Next" button...');
            await page.waitForSelector("//div[@class='ant-modal-root']//button[2]", { timeout: 10000 });
            await page.click("//div[@class='ant-modal-root']//button[2]");
            console.log('Clicked on "Next" button.');
            await page.waitForTimeout(3000);  // Wait a bit before moving to the next dataset

            console.log(`Completed processing for Dataset: ${datasetName}`);
            await page.waitForTimeout(5000);  // Wait a bit before processing the next file
        }
    } catch (error) {
        console.error(`Test failed: ${error.message}`);
    } finally {
        await page.close();
        await context.close();
    }
}
