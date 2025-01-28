
import { browser } from 'k6/browser';
import http from 'k6/http';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';


const BASE_URL = 'https://perftesting.luna.kissflow.co.in/user/2/AcALBWpQxCDN_CP001';
const USER_LIST_URL = `${BASE_URL}/?page_number=1&page_size=10&q=&user_type=User&invited_user=true`;
const HEADERS = {
    'X-Access-Key-Id': 'Aka50cd94a-3f74-4920-a586-32a4fcfd5b2a',
    'X-Access-Key-Secret': 'eyhwUvnUQDNtkKChbkGkZFtc0vemhZtUKGDt2UUjAdRQJA8Kv8ykBHNqPE9ec3bGvHyEHcc0OKwbljAWeZKcA',
};
// Fetch a list of invited users from the API
function getInvitedUsers() {
    const response = http.get(USER_LIST_URL, { headers: HEADERS });
    check(response, { 'Fetched user list': (res) => res.status === 200 });

    console.log("API Response: ", response.body); // Log the entire response body

    let userList;
    try {
        userList = JSON.parse(response.body); // Parse the response body
    } catch (error) {
        console.error('Error parsing response body:', error.message);
        return [];
    }

// Check if the response contains an array of users
if (!userList || !Array.isArray(userList)) {
    console.error('No user data found in response.');
    return [];
}

// Filter out "saradha@kissflow.com" and return the remaining users
const invitedUsers = userList.filter(user => user.Email !== 'saradha@kissflow.com','chanakyan@kissflow.com','chris_martin@bugbug-inbox.com','jane_smith@bugbug-inbox.com','john_doe@bugbug-inbox.com','sarah_brown@bugbug-inbox.com');
return invitedUsers;
}

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            iterations: 1,
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
        // Fetch invited users list
        const invitedUsers = getInvitedUsers();
        if (!invitedUsers || invitedUsers.length === 0) {
            console.log('No invited users found.');
            return;
        }

        console.log(`Total invited users found: ${invitedUsers.length}`);

        // Loop through each invited user
        for (const user of invitedUsers) {
            const username = user.Name; 
            const email = user.Email; 

            console.log(`Processing user: ${username} - ${email}`);

            const response = await page.goto('https://bugbug-inbox.com/', { waitUntil: 'load' },{ timeout: 100000 });
        check(response, { 'Page loaded successfully': (res) => res.status === 200 });
        console.log(`Navigated to https://bugbug-inbox.com/`);
        await page.waitForTimeout(5000);
        // Step 2: Locate the name input field and type the selected user's name
        console.log('Attempting to locate the name input field');
        await page.waitForSelector('//input[@name="email"]', { timeout: 30000 }); // Wait for the email input field
         const emailInput = await page.$('//input[@name="email"]'); // Select the input field
        console.log('Name input field located, attempting to type name');
if (emailInput) {
    await emailInput.evaluate((input) => input.value = ''); // Clear the input field
    await emailInput.type(username); 
}
await page.waitForTimeout(5000);

            // Step 3: Click on the "View inbox" button
            console.log('Waiting for "View inbox" button');
            await page.waitForSelector('(//button[@type="submit"])[1]', { timeout: 10000 });
            console.log('Clicking on "View inbox" button');
            await page.click('(//button[@type="submit"])[1]');
            console.log('Clicked the "View inbox" button');
            await page.waitForTimeout(5000);

            // Step 4: Click on the email subject
            console.log('Waiting for email subject link');
            await page.waitForSelector(
                '(//div[@class="_listCell_cnj18_129 _listCellSubject_cnj18_153"])[2]',
                { timeout: 10000 }
            );
            console.log('Clicking on email subject link');
            await page.click('(//div[@class="_listCell_cnj18_129 _listCellSubject_cnj18_153"])[2]');
            console.log('Clicked on email subject');

            // Step 5: Click on "Get started" link
            console.log('Waiting for "Get started" link');
            await page.waitForSelector('(//a[normalize-space()="Get started"])[1]', { timeout: 10000 });
            await page.click('(//a[normalize-space()="Get started"])[1]');
            console.log('Clicked on "Get started" link');

            // Step 6: Type the password
            console.log('Waiting for password fields');
            await page.waitForSelector('(//input[@id="newPassword"])[1]', { timeout: 10000 });
            await page.type('(//input[@id="newPassword"])[1]', 'User@123');
            console.log('Typed "User@123" in the first password field');

            await page.waitForSelector('(//input[@id="confirmPassword"])[1]', { timeout: 10000 });
            await page.type('(//input[@id="confirmPassword"])[1]', 'User@123');
            console.log('Typed "User@123" in the second password field');

            // Step 7: Click the submit button
            console.log('Waiting for submit button');
            await page.waitForSelector('(//button[@data-component="button"])[1]', { timeout: 10000 });
            await page.click('(//button[@data-component="button"])[1]');
            console.log('Clicked the submit button');

            // Wait for a few seconds before processing the next user
            await page.waitForTimeout(3000);
        }
    } catch (error) {
        console.error(`Test failed: ${error.message}`);
    } finally {
        await page.close();
        await context.close();
    }
}
