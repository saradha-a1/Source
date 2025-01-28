import { open } from 'k6/experimental/fs';
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

// Dataset names will be populated here
let datasetNames = [];

// Read the CSV file in the init function
export function init() {
    try {
        const file = open('./Dataset_ID.csv', 'r');  // Open file for reading
        const content = file.read();  // Read the content of the CSV file
        console.log(`CSV File Content: ${content}`);
        
        // Parse dataset names (assuming one dataset name per line)
        datasetNames = content.split('\n').map((line) => line.trim()).filter((line) => line);
        
        if (datasetNames.length === 0) {
            throw new Error('No datasets found in the CSV file.');
        }

        console.log(`Parsed Dataset Names: ${datasetNames}`);
    } catch (err) {
        console.error(`Error reading CSV file: ${err.message}`);
    }
}

// Test options configuration with browser setup
export const options = {
    scenarios: {
        default: {
            executor: 'shared-iterations',
            iterations: 1,
            vus: 1,
            options: {
                browser: {
                    type: 'chromium',  // Ensure the browser type is correctly set to 'chromium'
                },
            },
        },
    },
};

export default async function () {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Step 1: Login
        console.log('Navigating to login page...');
        await page.goto('https://perftesting.tst.zingworks.com/view/login', { waitUntil: 'networkidle' });

        await page.type('#email', 'saradha@kissflow.com');
        await page.type('#password', 'Saradha@1228');
        await page.click('button[data-component="button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        console.log('Logged in successfully.');
await page.waitForTimeout(5000);
        // Step 2: Iterate over the datasets
        for (let i = 0; i < datasetNames.length; i++) {
            const datasetName = datasetNames[i];
            console.log(`Processing dataset: ${datasetName}`);
            
            // Navigate to the dataset page
            const datasetURL = `https://perftesting.tst.zingworks.com/view/dataset/${datasetName}`;
            console.log(`Navigating to dataset: ${datasetURL}`);
            const response = await page.goto(datasetURL, { waitUntil: 'networkidle' });

            // Check if the dataset page loaded successfully
            check(response, {
                [`Dataset ${datasetName} page loaded successfully`]: (res) => res.status === 200,
            });

            // Step 3: Simulate importing a CSV file
            const datasetFilePath = `/Users/saradha/Documents/Metadata Automation/Source/Dataset/datasets/${datasetName}.csv`;
            console.log(`Checking if dataset file exists at: ${datasetFilePath}`);
            
            // Here you can add file checking logic if needed or check if the file path exists on your machine

            // Wait for the Import CSV button and click
            await page.waitForSelector('div.actions--b8d99bd2 button:nth-child(1)');
            await page.click('div.actions--b8d99bd2 button:nth-child(1)');
            console.log(`Clicked Import CSV for ${datasetName}`);
            
            // Simulate file upload (if required)
            // If the file exists at the given path, upload the corresponding CSV
            await page.setInputFiles('input[type="file"]', datasetFilePath);
            console.log(`Uploaded file: ${datasetFilePath}`);

            // Optionally, wait for the action to complete before moving to the next dataset
            await page.waitForTimeout(2000);
        }
        
    } catch (err) {
        console.error(`Error in browser actions: ${err.message}`);
    } finally {
        await page.close();
        await context.close();
    }
}
