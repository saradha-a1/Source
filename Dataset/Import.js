const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // For environment variables

(async () => {
    const datasetsPath = path.join(__dirname, '../Dataset/datasets/');
    const datasetCSVPath = path.join(datasetsPath, 'Dataset_ID.csv');

    if (!fs.existsSync(datasetCSVPath)) {
        console.error(`Dataset_ID.csv not found in ${datasetsPath}`);
        return;
    }

    const csvContent = fs.readFileSync(datasetCSVPath, 'utf-8');
    const datasetNames = csvContent.split('\n').slice(1).map(row => row.split(',')[0].trim());

    console.log(`Found datasets: ${datasetNames.join(', ')}`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Login
        await page.goto('https://perftesting.tst.zingworks.com/view/login', { waitUntil: 'load' });
        console.log('Navigated to login page.');

        // Use XPath for input fields
        const [emailField] = await page.$x('//input[@id="email"]');
if (emailField) {
    await emailField.type('saradha@kissflow.com');
    console.log('Email typed successfully.');
} else {
    console.error('Email input field not found.');
}

const [passwordField] = await page.$x('//input[@id="password"]');
if (passwordField) {
    await passwordField.type('Saradha@1228');
    console.log('Password typed successfully.');
} else {
    console.error('Password input field not found.');
}

     

        // Login button
        const loginButton = (await page.$x('(//button[contains(@class,"undefined")])[1]'));
        if (loginButton) {
            await loginButton.click();
        } else {
            throw new Error('Login button not found');
        }

        console.log('Clicked login button.');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        for (const datasetName of datasetNames) {
            console.log(`Processing Dataset: ${datasetName}`);
            const datasetUrl = `https://perftesting.tst.zingworks.com/view/dataset/${datasetName}`;
            await page.goto(datasetUrl, { waitUntil: 'load' });
            console.log(`Navigated to dataset page: ${datasetUrl}`);

            // Click "Import CSV" button
            const importButton = (await page.$x("//div[@class='actions--b8d99bd2']//div//button[1]"));
            if (importButton) {
                await importButton.click();
            } else {
                console.log(`Import CSV button not found for dataset: ${datasetName}`);
                continue;
            }
            console.log('Clicked on "Import CSV" button.');

            const csvFilePath = path.join(datasetsPath, `${datasetName}.csv`);
            if (!fs.existsSync(csvFilePath)) {
                console.log(`CSV file for dataset ${datasetName} not found. Skipping...`);
                continue;
            }

            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                importButton.click(),
            ]);
            await fileChooser.accept([csvFilePath]);
            console.log(`Uploaded file: ${csvFilePath}`);

            const nextButton = (await page.$x("//div[@class='ant-modal-root']//button[2]"));
            if (nextButton) {
                await nextButton.click();
                console.log('Clicked on "Next" button.');
            } else {
                console.log(`Next button not found for dataset: ${datasetName}`);
            }

            await page.waitForTimeout(3000);
            console.log(`Completed processing for Dataset: ${datasetName}`);
        }
    } catch (error) {
        console.error(`Script failed: ${error.message}`);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
