const fs = require("fs");
const path = require("path");

// Define schemas for datasets
const datasets = {
  Leave_Policy_Dataset: [
    { Name: "Gender", Type: "Text" },
    { Name: "Leave days per year", Type: "Number" },
    { Name: "Leave kind", Type: "Text" },
    { Name: "Leave type", Type: "Text" },
  ],
  Employee_Dataset: [
    { Name: "Annual leave type", Type: "Text" },
    { Name: "Date of joining", Type: "Date" },
    { Name: "Team", Type: "Text" },
    { Name: "Designation", Type: "Text" },
    { Name: "Employee email", Type: "Email" },
  ],
};

// Helper function to generate random data based on type
function generateRandomData(type) {
  switch (type) {
    case "Text":
      return `Text_${Math.random().toString(36).substring(7)}`;
    case "Email":
      return `user${Math.floor(Math.random() * 1000)}@example.com`;
    case "Date":
      return new Date(
        Date.now() - Math.floor(Math.random() * 10000000000)
      )
        .toISOString()
        .split("T")[0];
    case "Number":
      return Math.floor(Math.random() * 100);
    default:
      return "Unknown_Type";
  }
}

// Function to generate mock data for a dataset
function generateMockData(dataset, count) {
  return Array.from({ length: count }, () => {
    const row = {};
    dataset.forEach((field) => {
      row[field.Name] = generateRandomData(field.Type);
    });
    return row;
  });
}

// Function to convert data to CSV
function convertToCSV(data, dataset) {
  const headers = dataset.map((field) => field.Name).join(",");
  const rows = data
    .map((row) =>
      dataset.map((field) => `"${row[field.Name]}"`).join(",")
    )
    .join("\n");
  return `${headers}\n${rows}`;
}

// Function to save CSV file
function saveCSVFile(directory, filename, csvData) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, csvData, "utf8");
  console.log(`File saved: ${filePath}`);
}

// Main function to generate datasets and save them as CSV files
function main() {
  const virtualUsers = 10; // Number of rows for each dataset
  const outputDir = "./datasets"; // Directory to save CSV files

  // Process each dataset
  Object.entries(datasets).forEach(([datasetName, datasetSchema]) => {
    console.log(`Generating data for: ${datasetName}`);
    const mockData = generateMockData(datasetSchema, virtualUsers);
    const csvData = convertToCSV(mockData, datasetSchema);
    saveCSVFile(outputDir, `${datasetName}.csv`, csvData);
  });
}

// Execute the main function
main();
