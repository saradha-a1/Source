import puppeteer from 'puppeteer';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Load process names from CSV
async function getProcessNames() {
    return new Promise((resolve) => {
        const processNames = [];
        fs.createReadStream(path.join(__dirname, '../Asset/CSV/ProcessName.csv'))
            .pipe(csv())
            .on('data', (row) => processNames.push(row.ProcessName))
            .on('end', () => resolve(processNames));
    });
}

// Field interaction functions
const fieldHandlers = {
    Text: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.evaluate((el) => el.value = '', await page.$(selector));
        await page.type(selector, value, { delay: 30 });
        await delay(200);
    },
    Textarea: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.type(selector, value, { delay: 30 });
        await delay(200);
    },
    Number: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.type(selector, value.toString(), { delay: 30 });
        await delay(200);
    },
    Date: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.type(selector, value, { delay: 30 });
        await delay(200);
    },
    Email: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.type(selector, value, { delay: 30 });
        await delay(200);
    },
    Select: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        
        // First try using native select method
        try {
            const options = await page.$$(`${selector} option`);
            if (options.length > 1) {
                const randomIndex = Math.floor(Math.random() * (options.length - 1)) + 1;
                await page.select(selector, await page.evaluate(
                    (el, idx) => el.options[idx].value, 
                    await page.$(selector), 
                    randomIndex
                ));
                return;
            }
        } catch (error) {
            console.log(`Native select failed, trying custom dropdown for ${selector}`);
        }
        
        // Fallback for custom dropdowns
        await page.click(selector);
        await delay(500);
        const optionSelector = `${selector} option, .dropdown-item, .select-option`;
        await page.waitForSelector(optionSelector, { visible: true, timeout: 5000 });
        const options = await page.$$(optionSelector);
        if (options.length > 0) {
            const randomOption = options[Math.min(options.length - 1, Math.floor(Math.random() * options.length) + 1)];
            await randomOption.click();
        }
        await delay(500);
    },
    Boolean: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await delay(200);
    },
    Checkbox: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await delay(200);
    },
    Currency: async (page, selector, value) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await page.type(selector, value, { delay: 30 });
        await delay(200);
    },
    Multiselect: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await delay(500);
        
        const optionSelector = `${selector} option, .dropdown-item, .select-option`;
        await page.waitForSelector(optionSelector, { visible: true, timeout: 5000 });
        const options = await page.$$(optionSelector);
        
        const optionsToSelect = Math.min(3, options.length);
        const selectedIndices = new Set();
        
        while (selectedIndices.size < optionsToSelect) {
            const randomIndex = Math.floor(Math.random() * options.length);
            if (!selectedIndices.has(randomIndex)) {
                selectedIndices.add(randomIndex);
                await options[randomIndex].click();
                await delay(200);
            }
        }
        
        await page.keyboard.press('Escape');
        await delay(500);
    }
};

async function fillFormFields(page, processName, fieldsConfig) {
    const processConfig = fieldsConfig.find(p => p.ProcessName === processName);
    if (!processConfig) throw new Error(`Config not found for ${processName}`);

    for (const field of processConfig.Fields) {
        const fieldKey = Object.keys(field).find(k => k.startsWith('fieldName'));
        const fieldName = field[fieldKey];
        
        // Try multiple selector patterns
        const selectorPatterns = [
            `[data-field="${fieldName}"]`,
            `[name="${fieldName}"]`,
            `#${fieldName}`,
            `[data-testid="${fieldName}"]`,
            `[aria-label="${fieldName}"]`,
            `[placeholder="${fieldName}"]`,
            `label:has-text("${fieldName}") + *`,
            `text=${fieldName}`
        ];

        let elementFound = false;
        
        for (const selector of selectorPatterns) {
            try {
                const value = generateFieldValue(field, fieldName);
                console.log(`Attempting to fill ${fieldName} (${field.fieldType}) with: ${value}`);
                
                await fieldHandlers[field.fieldType]?.(page, selector, value);
                await delay(300);
                elementFound = true;
                break;
            } catch (error) {
                console.log(`Selector ${selector} failed for ${fieldName}: ${error.message}`);
                continue;
            }
        }

        if (!elementFound) {
            console.warn(`Could not find field ${fieldName} with any selector pattern`);
        }
    }
}

function generateFieldValue(field, fieldName) {
    const type = field.fieldType;
    const now = Date.now();
    
    if (type === 'Text') {
        if (/name/i.test(fieldName)) return faker.person.fullName();
        if (/description/i.test(fieldName)) return faker.lorem.sentence();
        return `Auto-${fieldName}-${now.toString().slice(-4)}`;
    }
    if (type === 'Number') {
        if (field.expression?.includes('RANDBETWEEN')) {
            const [min, max] = field.expression.match(/\d+/g).map(Number);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return Math.floor(Math.random() * 100) + 1;
    }
    if (type === 'Date') return faker.date.recent(30).toISOString().split('T')[0];
    if (type === 'Email') return `test-${now.toString().slice(-4)}@example.com`;
    if (type === 'Currency') return (Math.random() * 1000).toFixed(2);
    return null;
}

async function submitForm(page) {
    const submitSelectors = [
        'button[type="submit"]:not([disabled])',
        'button:has-text("Submit")',
        'button:has-text("Save")',
        '[data-testid="submit-button"]',
        'button[data-component="button"]'
    ];

    for (const selector of submitSelectors) {
        try {
            await page.waitForSelector(selector, { visible: true, timeout: 5000 });
            await page.click(selector);
            await delay(1000); // Wait for any potential submission animation
            
            // Handle both navigation and non-navigation submissions
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
            } catch {
                // If no navigation occurs, look for success message
                await page.waitForSelector('.success-message, .toast-success', { timeout: 5000 });
            }
            return;
        } catch (error) {
            continue;
        }
    }
    throw new Error('No submit button found');
}

async function main() {
    const processNames = await getProcessNames();
    const fieldsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../Asset/CSV/Fields.json')));
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        slowMo: 100 // Increased for better reliability
    });
    const page = await browser.newPage();

    try {
        // Configure page timeout
        page.setDefaultTimeout(10000);
        
        // Login
        console.log('Navigating to login page...');
        await page.goto("https://perftesting.tst.zingworks.com/view/login", { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('Entering credentials...');
        await page.type('#email', "saradha@kissflow.com", { delay: 50 });
        await page.type('#password', "Saradha@1228", { delay: 50 });
        await page.click('button[data-component="button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        console.log('Login successful');

        // Process each form
        for (const processName of processNames) {
            console.log(`\nProcessing ${processName}...`);
            const url = `https://perftesting.tst.zingworks.com/view/process/${processName}/manage`;
            
            console.log(`Navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Create 2 test items per process
            for (let i = 0; i < 2; i++) {
                console.log(`Creating item ${i + 1} for ${processName}`);
                
                try {
                    await page.waitForSelector('#process_new_item_button', { visible: true, timeout: 10000 });
                    await page.click('#process_new_item_button');
                    await delay(2000); // Wait for form to load
                    
                    await fillFormFields(page, processName, fieldsConfig);
                    
                    console.log('Submitting form...');
                    await submitForm(page);
                    console.log('Form submitted successfully');
                    
                    if (i < 1) {
                        console.log('Returning to process page...');
                        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                    }
                } catch (error) {
                    console.error(`Error creating item ${i + 1} for ${processName}:`, error);
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    await page.screenshot({ path: `error-${processName}-${i}-${timestamp}.png`, fullPage: true });
                    
                    // Try to recover by going back to the process page
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                }
            }
        }
    } catch (error) {
        console.error('Fatal error:', error);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot({ path: `fatal-error-${timestamp}.png`, fullPage: true });
    } finally {
        await browser.close();
    }
}

main().catch(console.error);