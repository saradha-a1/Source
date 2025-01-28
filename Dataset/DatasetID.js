import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://perftesting.tst.zingworks.com/governance/2/AcALBWpQxCDN/flow/dataset/status/all';

export let options = {
  vus: 1, // Single virtual user
  duration: '3s', // Sufficient duration to fetch all pages
};

export default function () {
  const params = {
    headers: {
      'X-Access-Key-Id': 'Ak6b3cf1d8-9bc2-4814-9d18-47673b6c635f',
      'X-Access-Key-Secret': 'EKtH8FxtFXq92RWz2mf5ienmOxvpn0A3-2cft20k30saS7Sm4ZvvmnAOJRLsuQvvO2RpAh1X-Y5ktFkvybhXg',
    },
  };

  let allIds = []; // Array to store all unique _id values
  let currentPage = 1;
  let hasMorePages = true; // Flag for pagination

  while (hasMorePages) {
    console.log(`Requesting page ${currentPage}...`);

    const url = `${BASE_URL}?page_number=${currentPage}&page_size=10`; // Dynamic pagination
    const response = http.get(url, params);

    check(response, { 'status is 200': (r) => r.status === 200 });

    if (response.status === 200) {
      const data = JSON.parse(response.body);

      if (data.length > 0) {
        // Extract and store _id values from the current page
        data.forEach((entry) => {
          if (entry._id) {
            allIds.push(entry._id);
            console.log(entry._id); // Log each _id to the console line-by-line
          }
        });

        console.log(`Page ${currentPage}: Fetched ${data.length} entries with _id values.`);
        currentPage++; // Move to the next page
      } else {
        console.log('No more entries found. Stopping pagination.');
        hasMorePages = false; // No more pages to fetch
      }
    } else {
      console.error(`Request failed for page ${currentPage} with status: ${response.status}`);
      break;
    }
  }

  // Log all IDs to the console (line-by-line)
  console.log('Extracted _id values:');
  allIds.forEach((id) => console.log(id));

  // Optionally, format as CSV data
  const csvData = allIds.join('\n'); // Newline-separated for CSV
  console.log('Formatted CSV data:\n', csvData);

  // Save to file (if fs is available in the environment)
  // fs.writeFileSync('../Datasets/dataset_ids.csv', csvData);
}
