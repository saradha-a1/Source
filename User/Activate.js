import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // For API requests

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// API Config from .env
const BASE_URL = process.env.BASE_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.ACCESS_KEY_SECRET;

// Admin emails (blocked users)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase()) : [];

// Log the ADMIN_EMAILS for debugging
console.log('Admin Emails:', ADMIN_EMAILS);

const USER_LIST_URL = `${BASE_URL}/user/2/${ACCOUNT_ID}/?page_number=1&page_size=10&q=&user_type=User&invited_user=true`;
const HEADERS = {
    'X-Access-Key-Id': ACCESS_KEY_ID,
    'X-Access-Key-Secret': ACCESS_KEY_SECRET,
};

// Function to fetch invited users
async function getInvitedUsers() {
    try {
        const response = await fetch(USER_LIST_URL, { headers: HEADERS });

        if (!response.ok) {
            throw new Error(`Failed to fetch user list: ${response.status}`);
        }

        const userList = await response.json();
        
        // Log the API response for debugging
        console.log('API Response:', JSON.stringify(userList, null, 2));

        if (!Array.isArray(userList)) {
            console.error('Unexpected API response format');
            return [];
        }

        // Filter out admin emails
        const invitedUsers = userList.filter(user => {
            const userEmail = user.Email.trim().toLowerCase(); // Normalize email
            const isAdmin = ADMIN_EMAILS.includes(userEmail);
            return !isAdmin; // Include only non-admin users
        });

        // Log the filtered users for debugging
        console.log('Filtered Users:', JSON.stringify(invitedUsers, null, 2));
        console.log(`Total invited users after filtering: ${invitedUsers.length}`);

        return invitedUsers;
    } catch (error) {
        console.error(`Error fetching invited users: ${error.message}`);
        return [];
    }
}

// Function to extract username from email
function extractUsername(email) {
    return email.split('@')[0];
}

// Puppeteer automation
export async function runScript4() {
    const invitedUsers = await getInvitedUsers();
    if (invitedUsers.length === 0) {
        console.log('No invited users to process.');
        return;
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        for (const user of invitedUsers) {
            const username = user.Name;
            const email = user.Email;
            const emailUsername = extractUsername(email); // Extract username from email

            console.log(`Processing user: ${username} - ${email}`);

            // Step 1: Navigate to the login page
            await page.goto('https://bugbug-inbox.com/', { waitUntil: 'load', timeout: 100000 });
            console.log(`Navigated to https://bugbug-inbox.com/`);
            await delay(5000);

            // Enter Email (only the username part)
            await page.waitForSelector("input[name='email']", { timeout: 30000 });
            await page.type("input[name='email']", emailUsername);
            console.log(`Entered email username: ${emailUsername}`);
            await delay(5000);

            // Click View Inbox
            await page.waitForSelector("button[type='submit']", { timeout: 10000 });
            await page.click("button[type='submit']");
            console.log(`Clicked "View Inbox"`);
            await delay(5000);

            // Open Email
            try {
                await page.waitForSelector("div[class='_listCell_11u04_147 _listCellSubject_11u04_171'] span", { timeout: 15000 });
                await page.click("div[class='_listCell_11u04_147 _listCellSubject_11u04_171'] span");
                console.log(`Opened email`);
            } catch (error) {
                console.error(`Failed to open email: ${error.message}`);
                continue; // Skip to the next user if the email cannot be opened
            }
            await delay(3000);

            // Click "Get Started" using XPath
            const getStartedXPath = "//a[normalize-space()='Get started']";
            try {
                const getStartedButton = await page.evaluateHandle((xpath) => {
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    return result.singleNodeValue;
                }, getStartedXPath);

                if (getStartedButton) {
                    await getStartedButton.click();
                    console.log(`Clicked "Get Started"`);
                } else {
                    console.log(`"Get Started" button not found`);
                    continue;
                }
            } catch (error) {
                console.error(`Failed to click "Get Started": ${error.message}`);
                continue;
            }

            // Enter password
            await page.waitForSelector('#newPassword', { timeout: 10000 });
            await page.type('#newPassword', 'User@123');
            console.log(`Entered new password`);

            await page.waitForSelector('#confirmPassword', { timeout: 10000 });
            await page.type('#confirmPassword', 'User@123');
            console.log(`Confirmed password`);

            // Click Submit
            await page.waitForSelector('button[data-component="button"]', { timeout: 10000 });
            await page.click('button[data-component="button"]');
            console.log(`Clicked Submit button`);

            await delay(3000);
        }
    } catch (error) {
        console.error(`Test failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Run Puppeteer script
runScript4();