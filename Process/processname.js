import { browser } from 'k6/browser';
import http from 'k6/http';

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  // Open a new browser page
  const page = await browser.newPage();

  const screenWidth = 1720;
  const screenHeight = 1080;
  await page.setViewport({ width: screenWidth, height: screenHeight });

  // Navigate to the login page
  await page.goto('https://perftesting.tst.zingworks.com/view/login');

  // Login steps
  await page.waitForSelector('#email');
  await page.type('#email', 'saradha@kissflow.com');
  await page.waitForSelector('#password');
  await page.type('#password', 'Saradha@1228');
  await page.waitForSelector('.button--3c33a8f8.loginButton--2e30fba3.primary--428c90ce.base--9c678d8f');
  await page.click('.button--3c33a8f8.loginButton--2e30fba3.primary--428c90ce.base--9c678d8f');
  await page.waitForNavigation();

  console.log('Logged in successfully!');
  await page.goto('https://perftesting.tst.zingworks.com/view/home');


  
  const dynamicURL = `https://perftesting.tst.zingworks.com/view/process/Uganda_Country_Expense_payments/myitems/Draft`;
  console.log(`Navigating to: ${dynamicURL}`);
  await page.goto(dynamicURL);

  await page.goto('https://perftesting.tst.zingworks.com/view/process/Uganda_Country_Expense_payments/manage/studio');
  
  const vendorName = 'Invoice Value';

  // Use XPath to find the element
  const xpath = `//*[contains(text(), '${vendorName}')]`;

  // Wait for the element and get it using XPath
  await page.waitForFunction(
    (xpath) => {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    },
    { timeout: 5000 },
    xpath
  );

  const elementHandle = await page.evaluateHandle((xpath) => {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }, xpath);

  if (elementHandle) {
    console.log(`Found and clicking element with text: ${vendorName}`);
    await elementHandle.asElement().click();
  } else {
    console.log(`No element found with text: ${vendorName}`);
  }




  const oldName = 'Invoice Value';  // The name to search and replace
  const newName = 'Value';  // The name to replace with

  // Wait for the page content to load
  await page.waitForSelector('body');

  // Replace text on the page using page.evaluate
  await page.evaluate((oldName, newName) => {
    // Get all elements on the page
    const elements = document.querySelectorAll('*');
    
    // Iterate through each element and replace the text content
    elements.forEach(element => {
      if (element.children.length === 0 && element.textContent.includes(oldName)) {
        // Replace the old name with the new name in the element's text content
        element.textContent = element.textContent.replace(new RegExp(oldName, 'g'), newName);
      }
    });
  }, oldName, newName);

  // Optional: Log the changes or perform further actions
  console.log(`Replaced '${oldName}' with '${newName}'`);






})();
