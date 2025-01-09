const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');



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


let datasetNames = [];
let datasetsPath = `../Dataset/datasets/`; // The folder where datasets are stored

function init() {
    // Step 1: Read the dataset CSV to get dataset names
    const DATASET_CSV_PATH = `${datasetsPath}Dataset_ID.csv`; // The path to your dataset CSV file
    console.log(`datapath: ${DATASET_CSV_PATH}`);

    const fileContent = open(DATASET_CSV_PATH, 'utf-8'); // Read the CSV content
    datasetNames = parseCSV(fileContent); // Parse CSV content manually
}

(async () => {
    const datasetsPath = path.join(__dirname, '../Dataset/datasets/');
    const datasetCSVPath = path.join(datasetsPath, 'Dataset_ID.csv');
    const browser = await puppeteer.launch({
        headless: false, // Set to false to open the browser window
        args: ['--start-maximized'], // This maximizes the window
    });


    // Get the default browser context
    const page = await browser.newPage();

    // Set the viewport size to match the maximized window
    const { width, height } = await page.evaluate(() => ({
        width: window.screen.width,
        height: window.screen.height,
    }));
    await page.setViewport({ width, height });
   
    if (!fs.existsSync(datasetCSVPath)) {
        console.error(`Dataset_ID.csv not found in ${datasetsPath}`);
        return;
    }

    const csvContent = fs.readFileSync(datasetCSVPath, 'utf-8');
    const datasetNames = csvContent.split('\n').slice(1).map(row => row.split(',')[0].trim());

    console.log(`Found datasets: ${datasetNames.join(', ')}`);



    try {
        // Step 1: Navigate to the login page
        console.log('Navigating to login page...');
        await page.goto('https://perftesting.tst.zingworks.com/view/login', { waitUntil: 'networkidle0', timeout: 60000 });
        console.log('Login page loaded.');

        // Type email and password
        await page.type('#email', 'saradha@kissflow.com', { delay: 100 }); // Add delay for realistic typing
        console.log('Email typed.');

        await page.type('#password', 'Saradha@1228', { delay: 100 }); // Add delay for realistic typing
        console.log('Password typed.');

        // Click the login button
        await page.click('button[data-component="button"]'); // Adjust selector if necessary
        console.log('Login button clicked.');

        // Wait for the login to process and the home page to load
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
        console.log('Logged in successfully. Navigated to the home page.');

        // Confirm the home page is fully loaded by waiting for a specific element
        await page.waitForSelector('img[alt="Company Logo"]', { timeout: 30000 }); // Replace with an actual element selector on the home page
        console.log('Home page loaded successfully.');

        // Navigate to a different page if required
        await page.goto('https://perftesting.tst.zingworks.com/view/home', { waitUntil: 'networkidle0'});

        // Step 3: Process each dataset
        for (const datasetName of datasetNames) {
            console.log(`Processing dataset: ${datasetName}`);

            // Navigate to the dataset page
            const datasetUrl = `https://perftesting.tst.zingworks.com/view/dataset/${datasetName}`;
            console.log(`Navigating to: ${datasetUrl}`);
            
            await page.goto(datasetUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            console.log(`Successfully navigated to: ${datasetUrl}`);
            await page.waitForSelector('body > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > button:nth-child(1)',{ timeout: 15000 }); // Replace with an actual selector
            console.log('Dataset page loaded successfully.');

            // Click on the "Import CSV" button
            console.log('Clicking "Import CSV" button...');
            await page.click("body > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > button:nth-child(1)");
           

            // Check if the corresponding dataset CSV file exists
            const csvFilePath = path.resolve(datasetsPath, `${datasetName}.csv`);
            if (!fs.existsSync(csvFilePath)) {
                console.log(`No file found for dataset: ${datasetName}. Skipping...`);
                continue;
            }

            // Upload the corresponding CSV file
            console.log(`Uploading file: ${csvFilePath}`);
            const fileInput = await page.$('input[type="file"]');
            await fileInput.uploadFile(csvFilePath);
            console.log('File uploaded successfully.');
            

            // Click the "Next" button
            console.log('Clicking "Next" button...');
            await page.click("//div[@class='ant-modal-root']//button[2]");
            await waitForTimeout(10000);

            console.log(`Completed processing for Dataset: ${datasetName}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
