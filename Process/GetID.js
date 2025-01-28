import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://perftesting.tst.zingworks.com/governance/2/AcALBWpQxCDN/flow/process/status/live';

export let options = {
  vus: 1, // Virtual users
  duration: '3s', // Test duration
};

export default function () {
  const params = {
    headers: {
      'X-Access-Key-Id': 'Ak6b3cf1d8-9bc2-4814-9d18-47673b6c635f',
      'X-Access-Key-Secret': 'EKtH8FxtFXq92RWz2mf5ienmOxvpn0A3-2cft20k30saS7Sm4ZvvmnAOJRLsuQvvO2RpAh1X-Y5ktFkvybhXg',
    },
  };

  let allIds = []; // Array to store all _id values
  let currentPage = 1;

  // Loop through pages until no data is returned
  while (true) {
    const url = `${BASE_URL}?page_number=${currentPage}&page_size=10`; // Pagination params
    const response = http.get(url, params);

    check(response, { 'status is 200': (r) => r.status === 200 });

    if (response.status === 200) {
      const data = JSON.parse(response.body);

      if (data.length === 0) {
        // Break the loop if no more data is returned
        console.log(`No more data on page ${currentPage}. Stopping.`);
        break;
      }

      // Extract _id values from the current page's data and add them to the array
      data.forEach((entry) => {
        if (entry._id) {
          allIds.push(entry._id); // Add _id to the list
        }
      });

      console.log(`Page ${currentPage}: Fetched ${data.length} entries with _id values.`);
      currentPage++; // Move to the next page
    } else {
      console.error(`Request failed with status: ${response.status}`);
      break;
    }
  }

  // Log only the extracted _id values
  console.log(allIds.join('\n'));
}
