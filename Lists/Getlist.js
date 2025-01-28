import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://perftesting.tst.zingworks.com/governance/2/AcALBWpQxCDN/flow/list/status/all';

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

  let allIds = [];
  let currentPage = 1;
  let totalPages = 6; // Adjust this if the API provides total pages in the response

  // Fetch data from all pages
  while (currentPage <= totalPages) {
    const url = `${BASE_URL}?page_number=${currentPage}&page_size=10`; // Dynamic pagination
    const response = http.get(url, params);

    check(response, { 'status is 200': (r) => r.status === 200 });

    if (response.status === 200) {
      const data = JSON.parse(response.body);

      // Extract _id values from the current page's data and add them to the allIds array
      data.forEach((entry) => {
        if (entry._id) {
          allIds.push(entry._id); // Add the _id to the array
        }
      });

      currentPage++; // Move to the next page
    } else {
      console.error(`Request failed with status: ${response.status}`);
      break;
    }
  }

  // Log only the extracted _id values
  console.log(allIds.join('\n'));
}
