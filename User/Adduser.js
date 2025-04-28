import fetch from 'node-fetch'; // Ensure node-fetch is installed (for Node.js <18)
import { getRandomUserAndEmail } from './Randomuser.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runScript3() {
    console.log("🚀 Starting User Creation Script...");

    // Load environment variables
    const BASE_URL = process.env.BASE_URL;
    const ACCOUNT_ID = process.env.ACCOUNT_ID;
    const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
    const ACCESS_KEY_SECRET = process.env.ACCESS_KEY_SECRET;
    const USER_COUNT = parseInt(process.env.USER_COUNT, 10) || 1;

    if (!BASE_URL || !ACCOUNT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
        console.error("❌ Missing environment variables. Check your .env file.");
        return;
    }

    console.log(`📌 Creating ${USER_COUNT} users...`);
    const targetUrl = `${BASE_URL}/user/2/${ACCOUNT_ID}?skip_email=false`;

    for (let i = 1; i <= USER_COUNT; i++) {
        const { username, email } = getRandomUserAndEmail();
        console.log(`\n🆕 Creating User ${i}: ${username}, ${email}`);

        const payload = {
            FirstName: username,
            Email: email,
            Roles: [
                {
                    _id: "_user_admin",
                    Name: "User Admin",
                    Kind: "Role",
                },
            ],
        };

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key-Id': ACCESS_KEY_ID,
                    'X-Access-Key-Secret': ACCESS_KEY_SECRET,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log(`✅ User ${i} created successfully.`);
            } else {
                console.error(`❌ Failed to create User ${i}. Status: ${response.status}, Response: ${await response.text()}`);
            }
        } catch (error) {
            console.error(`❌ Error creating User ${i}:`, error);
        }
    }

    console.log("🎯 User creation script completed.");
}

runScript3();
