import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Helper: Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Path configuration
const jsonFilePath = path.join(__dirname, '../Asset/CSV/Dataset_list.json');
const csvDirectory = path.join(__dirname, 'output_csv');

// Validate files
if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
}
if (!fs.existsSync(csvDirectory)) {
    fs.mkdirSync(csvDirectory, { recursive: true });
}

// Load dataset list
const datasetList = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

// URLs
const loginUrl = "https://perftesting.tst.zingworks.com/view/login";
const datasetBaseUrl = "https://perftesting.tst.zingworks.com/view/dataset/";

// Helper functions
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeClick(page, selector, options = {}) {
    try {
        await page.waitForSelector(selector, {
            visible: true,
            timeout: options.timeout || 10000,
            ...options
        });
        await page.click(selector);
        return true;
    } catch (error) {
        console.warn(`Click failed on selector: ${selector}`, error.message);
        return false;
    }
}

async function clickNextButton(page, times = 3, delay = 3000) {
    const nextButtonSelectors = [
        "div[class*='modal'] button:nth-child(2)" // Working selector from your logs
        
    ];

    for (let i = 1; i <= times; i++) {
        console.log(`Attempting to click Next (${i}/${times})`);
        
        let clicked = false;
        for (const selector of nextButtonSelectors) {
            clicked = await safeClick(page, selector, { timeout: 15000 });
            if (clicked) {
                console.log(`✅ Clicked Next using: ${selector}`);
                break;
            }
        }

        if (!clicked) {
            console.warn(`⚠️ Failed to click Next on attempt ${i}`);
            // Additional fallback: Try clicking via JavaScript
            try {
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const nextBtn = buttons.find(btn => 
                        btn.textContent.includes('Next') || 
                        btn.classList.contains('ant-btn-primary')
                    );
                    if (nextBtn) nextBtn.click();
                });
                console.log('Tried JavaScript click fallback');
            } catch (error) {
                console.warn('JavaScript click fallback failed');
            }
        }

        await wait(delay);
    }
}

async function processDatasets() {
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized'],
        slowMo: 100,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH // Optional: Specify Chrome path if needed
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(30000);

    try {
        // Login
        console.log('Navigating to login page');
        await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        await page.type("#email", process.env.EMAIL, { delay: 50 });
        await page.type("#password", process.env.PASSWORD, { delay: 50 });
        await safeClick(page, "button[data-component='button']");
        
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        console.log("✅ Login successful");

        // Process datasets
        for (const process of datasetList) {
            for (const dataset of process.Datasets) {
                const datasetName = dataset.datasetName;
                const datasetUrl = `${datasetBaseUrl}${datasetName}`;
                const csvFilePath = path.join(csvDirectory, `${datasetName}.csv`);

                console.log(`\n🔄 Processing dataset: ${datasetName}`);

                if (!fs.existsSync(csvFilePath)) {
                    console.warn(`⚠️ CSV not found: ${csvFilePath}`);
                    continue;
                }

                // Navigate to dataset
                await page.goto(datasetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
                await wait(3000);

                // Import CSV
                if (!await safeClick(page, "div[class*='actions--'] button:nth-child(1)", { timeout: 15000 })) {
                    console.warn('Failed to click Import CSV');
                    continue;
                }
                console.log('📥 Import CSV clicked');

                // Upload file
                if (!await safeClick(page, "div[class*='modalContentWrapper--'] button:nth-child(1)", { timeout: 15000 })) {
                    console.warn('Failed to click Upload File');
                    continue;
                }
                console.log('📤 Upload File clicked');

                // Handle file input
                const fileInput = await page.$("input[type='file'][accept='.csv']");
                if (fileInput) {
                    await fileInput.uploadFile(csvFilePath);
                    console.log(`📂 Uploaded: ${datasetName}.csv`);
                    await wait(3000);
                } else {
                    console.warn('File input not found');
                    continue;
                }

                // Handle Next buttons
                await clickNextButton(page, 3, 3000);

                // Final wait before next dataset
                await wait(5000);
            }
        }
    } catch (error) {
        console.error("❌ Script failed:", error);
        await page.screenshot({ path: 'error.png', fullPage: true });
        console.log('Saved error screenshot as error.png');
    } finally {
        await browser.close();
        console.log('Browser closed');
    }
}

// Run with error handling
processDatasets().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});