import { getRandomUserAndEmail } from './Randomuser.js';
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 2, // Single virtual user for demonstration
    duration: '3s', // Test duration
};

export default function () {
    const { username, email } = getRandomUserAndEmail(); // Get username and email

    console.log(`Generated Username: ${username}`);
    console.log(`Generated Email: ${email}`);

    // Generate payload with dynamic user data
    const payload = JSON.stringify({
        FirstName: username,
        Email: email,
        Roles: [
            {
                _id: "_user_admin",
                Name: "User Admin",
                Kind: "Role",
            },
        ],
    });

    // Define headers - secure with environment variables
    const headers = {
        'Content-Type': 'application/json',
        'X-Access-Key-Id': 'Ak08d847a0-65b3-4431-b4af-3dec279e2cf8',
        'X-Access-Key-Secret': 'ETa0qxhRrNa75rg5ggye3vkqWNEIgfCnNnRCjdqo4Tlk87kBUsu7kv5VacwKzNr6VtJzSXEefMxf0nxZl5BA',
    };

    // Send HTTP POST request
    const response = http.post(
        'https://perftesting.tst.zingworks.com/user/2/AcALBWpQxCDN?skip_email=false',
        payload,
        { headers }
    );

    const isCreated = check(response, {
        'User created successfully (status 201)': (r) => r.status === 201,
    });

    if (!isCreated) {
        console.error(`Request failed. Status: ${response.status}, Body: ${response.body}`);
    } else {
        console.log(`User created successfully. Response Body: ${response.body}`);
    }

    // Simulate user think time
    sleep(Math.random() * 3); // Random think time
}
