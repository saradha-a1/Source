import puppeteer from "puppeteer";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Define __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const LOGIN_URL = process.env.LOGIN_URL;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const FORM_URL = process.env.FORM_URL;

async function getAIResponse(label) {
    try {
        const response = await axios.post(
            "https://api.groq.com/v1/chat/completions",
            {
                model: "llama3-8b-8192", // Use "mixtral-8x7b" if needed
                messages: [{ role: "system", content: `Suggest an appropriate input for '${label}'.` }],
                temperature: 0.7
            },
            { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
        );
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error(`❌ AI Error: ${error.message}`);
        return null;
    }
}

async function autoFillForm(page) {
    // Wait for the form to be visible (using a general container)
    await page.waitForSelector("form", { visible: true });

    const fields = await page.evaluate(() => {
        let data = [];
        document.querySelectorAll("form label").forEach(label => {
            let input = label.parentElement.querySelector("input, select, textarea");
            if (input) {
                data.push({ label: label.innerText.trim(), elementType: input.tagName.toLowerCase() });
            }
        });

        return data;
    });

    console.log("🔍 Extracted Fields:", fields);

    for (const field of fields) {
        let value = await getAIResponse(field.label);
        if (!value) continue;

        let elementHandle = await page.$(`//*[text()='${field.label}']/following-sibling::*[1]`);
        
        if (elementHandle) {
            if (field.elementType === "input" || field.elementType === "textarea") {
                console.log(`📝 Filling: ${field.label} -> ${value}`);
                await elementHandle.type(value, { delay: 100 });
            } else if (field.elementType === "select") {
                console.log(`📌 Selecting: ${field.label} -> ${value}`);
                await page.select(elementHandle, value);
            } else if (field.elementType === "checkbox" && (value.toLowerCase() === "yes" || value.toLowerCase() === "checked")) {
                console.log(`✅ Checking: ${field.label}`);
                await elementHandle.click();
            }
        }
    }

    console.log("✅ Form auto-filled successfully!");
}

async function main() {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ["--start-maximized"] });
    const page = await browser.newPage();

    try {
        console.log("🔐 Logging into the application...");
        await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });

        await page.type("#email", EMAIL, { delay: 100 });
        await page.type("#password", PASSWORD, { delay: 100 });
        await page.click('button[data-component="button"]');
        await page.waitForNavigation({ waitUntil: "networkidle0" });

        console.log("✅ Logged in successfully.");

        console.log("➡️ Navigating to Loan Application Form...");
        await page.goto(FORM_URL, { waitUntil: "networkidle0" });

        console.log('🆕 Clicking "New Item" button...');
        await page.waitForSelector("#process_new_item_button", { visible: true });
        await page.click("#process_new_item_button");

        console.log("⏳ Waiting for form to load...");
        await page.waitForSelector("form", { visible: true });

        await autoFillForm(page);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

main();
