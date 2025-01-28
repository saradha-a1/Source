const puppeteer = require('puppeteer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Resolve paths
const datasetsPath = path.resolve(__dirname, '../Dataset/datasets/');
const datasetCSVPath = path.resolve(datasetsPath, 'DatasetID.csv');
let datasetNames = [];

// Helper: Wait function
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Parse CSV file
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser({ headers: false }))
            .on('data', (row) => {
                if (row['0']) {
                    results.push(row['0'].trim());
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// Helper: Handle empty fields
async function handleEmptyFields(page) {
    const emptyFields = await page.$$('input[data-testid="empty-field-selector"]'); // Adjust selector
    for (const field of emptyFields) {
        const labelName = await field.evaluate((el) => el.getAttribute('data-label-name'));
        if (labelName === 'Date of Joining') {
            const dropdown = await page.$('select[data-testid="date-format-dropdown"]');
            if (dropdown) {
                await dropdown.select('MM/DD/YYYY'); // Adjust format as needed
            }
        } else {
            const dropdown = await page.$(`select[data-testid="dropdown-${labelName}"]`);
            if (dropdown) {
                await dropdown.select(labelName);
            }
        }
    }
}

// Helper: Use fileChooser for file upload
async function uploadFileUsingFileChooser(page, filePath, fileInputSelector) {
    const resolvedPath = path.resolve(filePath);

    // Ensure the file exists
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
    }

    console.log(`Uploading file: ${resolvedPath}...`);

    // Wait for the file input to be visible
    const fileInput = await page.$(fileInputSelector);
    if (!fileInput) {
        throw new Error('File input element not found.');
    }

    // Use Puppeteer's fileChooser to handle the file upload
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        fileInput.click(), // Click the input to open file chooser
    ]);

    // Upload the file using the fileChooser
    await fileChooser.accept([resolvedPath]);

    console.log(`File ${resolvedPath} uploaded successfully.`);
}

// Main automation logic
(async () => {
    const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // Step 1: Parse the CSV file for dataset names
        if (!fs.existsSync(datasetCSVPath)) {
            console.error(`Dataset CSV file not found at ${datasetCSVPath}`);
            return;
        }
        datasetNames = await parseCSV(datasetCSVPath);

        if (datasetNames.length === 0) {
            console.error('No dataset names found in the CSV file.');
            return;
        }

        console.log(`Datasets found: ${datasetNames.join(', ')}`);

        // Step 2: Log in to the application
        await page.goto('https://perftesting.tst.zingworks.com/view/login', { waitUntil: 'networkidle0' });
        await page.type('#email', 'saradha@kissflow.com', { delay: 100 });
        await page.type('#password', 'Saradha@1228', { delay: 100 });
        await page.click('button[data-component="button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log('Logged in successfully.');

        // Step 3: Process each dataset
        for (const datasetName of datasetNames) {
            const datasetUrl = `https://perftesting.tst.zingworks.com/view/dataset/${datasetName}`;
            const csvFilePath = path.join(datasetsPath, `${datasetName}.csv`);

            if (!fs.existsSync(csvFilePath)) {
                console.log(`CSV file for dataset "${datasetName}" not found. Skipping.`);
                continue;
            }

            console.log(`Processing dataset: ${datasetName}`);
            await page.goto(datasetUrl, { waitUntil: 'networkidle0' });

            // Step 4: Open Import CSV Dialog
            console.log('Opening the Import CSV dialog...');
            await page.click('div[class="actions--b8d99bd2"] div button:nth-child(1)'); // Adjust selector
            console.log('Import CSV dialog opened.');
            await wait(3000); // Wait for dialog to open

            // Step 5: Upload the CSV File
            console.log('Waiting for the file input...');
            const fileInputSelector = 'div[class="modalContentWrapper--185f4779"] button:nth-child(1)'; // Adjust to the correct input selector
            await page.waitForSelector(fileInputSelector, { visible: true });

            // Upload the file using fileChooser
            await uploadFileUsingFileChooser(page, csvFilePath, fileInputSelector);
            console.log(`File ${csvFilePath} uploaded successfully.`);

            // Step 6: Handle further steps (e.g., clicking "Next" after uploading)
            await wait(5000); // Wait for upload to finish

            // Proceed with import steps (e.g., clicking Next buttons, handling form data)
            console.log('Proceeding with form steps...');
            await page.waitForSelector('div[class="ant-modal-root"] button:nth-child(2)');
            console.log('First next button clicking..');
            await wait(3000);
            await page.click('div[class="ant-modal-root"] button:nth-child(2)'); // Adjust for Next button
            await handleEmptyFields(page);
            console.log('First next button clicked successfully');
            await wait(3000);
            await page.click('div[class="ant-modal-root"] button:nth-child(2)'); // Second "Next"
            console.log('second next button clicked successfully');
            await wait(3000);
            await page.click('div[class="ant-modal-root"] button:nth-child(2)'); // Third "Next"
            console.log('Third next button clicked successfully');
        }

        console.log('All datasets processed successfully.');
    } catch (err) {
        console.error('An error occurred:', err.message);
    } finally {
        await browser.close();
    }
})();
