const puppeteer = require('puppeteer');

async function runAutomation() {
    try {
        // Launch browser
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
        });

        // Create new page
        const page = await browser.newPage();

        // Navigate to the website
        await page.goto('https://perftesting.tst.zingworks.com/view/login');

        // Wait for elements to load
        await page.waitForSelector('input[type="email"]');
        await page.waitForSelector('input[type="password"]');

        // Fill in login credentials using placeholder values
        await page.type('input[type="email"]', 'PLACEHOLDER_EMAIL');
        await page.type('input[type="password"]', 'PLACEHOLDER_PASSWORD');

        // Click the sign in button
        await page.click('button[type="submit"]');

        // Add appropriate wait time for login process
        await page.waitForNavigation();

        // Close browser
        await browser.close();

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

runAutomation();