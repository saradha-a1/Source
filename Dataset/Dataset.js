const fs = require("fs");
const path = require("path");

// JSON data
const jsonData = [
    {
        "_MetadataId": "Control_Centre_Access_Approval",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Leave_Policy_Dataset",
        "_FieldLogs": "[{'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Leave days per year', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Software_Directory",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Category'}]"
      },
      {
        "_MetadataId": "GEOFFREY_FIADOR",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Employee_Dataset",
        "_FieldLogs": "[{'Name': 'Annual leave type', 'Type': 'Text'}, {'Name': 'Date of joining', 'Type': 'Date'}, {'Name': 'Team', 'Type': 'Text'}, {'Name': 'Designation', 'Type': 'Text'}, {'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'First name', 'Type': 'Text'}, {'Name': 'Employment type', 'Type': 'Text'}, {'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Last name', 'Type': 'Text'}, {'Name': 'Other manager email', 'Type': 'Text'}, {'Name': 'Manager email', 'Type': 'Text'}, {'Name': 'Sub team', 'Type': 'Text'}, {'Name': 'Untitled field', 'Type': 'Text'}, {'Name': 'Untitled field', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Regional_Leads",
        "_FieldLogs": "[{'Name': 'Project Manager', 'Type': 'User'}, {'Name': 'Regional Manager', 'Type': 'User'}]"
      },
      {
        "_MetadataId": "Financial_Quarters",
        "_FieldLogs": "[{'Name': 'Quarter', 'Type': 'Text'}, {'Name': 'Start Date', 'Type': 'Number'}, {'Name': 'End Date', 'Type': 'Number'}, {'Name': 'Start Month', 'Type': 'Number'}, {'Name': 'End Month', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "Copy_of_Leave_Dataset",
        "_FieldLogs": "[{'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'Leave allocated', 'Type': 'Number'}, {'Name': 'Leave balance', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}, {'Name': 'Year', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "Adobe_Licenses_for_Graduate_Trainees",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Adobe creative suite license '}, {'Type': 'Email', 'Name': 'Authorizer'}, {'Type': 'Email', 'Name': 'Trainee 1'}, {'Type': 'Email', 'Name': 'Trainee 2'}]"
      },
      {
        "_MetadataId": "KPI_Dataset",
        "_FieldLogs": "[{'Name': 'Job role', 'Type': 'Text'}, {'Name': 'KPI description', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "TravelApprovalList",
        "_FieldLogs": "[{'Name': 'Approvers', 'Type': 'Text'}, {'Name': 'Approvers User', 'Type': 'MultiUser'}, {'Name': 'Departments', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Benefits_Dataset",
        "_FieldLogs": "[{'Name': 'Orientation', 'Type': 'Select'}, {'Name': 'Description', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Test_Employee_Dataset",
        "_FieldLogs": "[{'Name': 'Employee Name', 'Type': 'Text'}, {'Name': 'Last name', 'Type': 'Text'}, {'Type': 'Text', 'Name': 'Department'}, {'Name': 'Designation', 'Type': 'Text'}, {'Name': 'Email Address', 'Type': 'Text'}, {'Name': 'Reporting Manager email', 'Type': 'Text'}, {'Name': 'Other manager email', 'Type': 'Text'}, {'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Date of joining', 'Type': 'Date'}, {'Name': 'Annual leave type', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "ApprovalList",
        "_FieldLogs": "[{'Name': 'Approvers', 'Type': 'Text'}, {'Name': 'Approvers User', 'Type': 'MultiUser'}, {'Name': 'Departments', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Leave_Dataset",
        "_FieldLogs": "[{'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'Leave allocated', 'Type': 'Number'}, {'Name': 'Leave balance', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}, {'Name': 'Year', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "All_Employees",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Jerry",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Asset_Directory",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Category'}]"
      },
      {
        "_MetadataId": "Stock_assets_for_Brand_design_team",
        "_FieldLogs": "[{'Type': 'Email', 'Name': 'Authorizer'}, {'Type': 'Number', 'Name': 'Cost per year($)'}, {'Type': 'Textarea', 'Name': 'Stock description'}, {'Type': 'Text', 'Name': 'Link'}]"
      },
      {
        "_MetadataId": "All_Employees",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Countries",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Test_Employee_Dataset",
        "_FieldLogs": "[{'Name': 'Employee Name', 'Type': 'Text'}, {'Name': 'Last name', 'Type': 'Text'}, {'Type': 'Text', 'Name': 'Department'}, {'Name': 'Designation', 'Type': 'Text'}, {'Name': 'Email Address', 'Type': 'Text'}, {'Name': 'Reporting Manager email', 'Type': 'Text'}, {'Name': 'Other manager email', 'Type': 'Text'}, {'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Date of joining', 'Type': 'Date'}, {'Name': 'Annual leave type', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Benefits_Dataset",
        "_FieldLogs": "[{'Name': 'Orientation', 'Type': 'Select'}, {'Name': 'Description', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Asset_Directory",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Category'}]"
      },
      {
        "_MetadataId": "Jerry",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "ApprovalList",
        "_FieldLogs": "[{'Name': 'Approvers', 'Type': 'Text'}, {'Name': 'Approvers User', 'Type': 'MultiUser'}, {'Name': 'Departments', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Control_Centre_Access_Approval",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Regional_Leads",
        "_FieldLogs": "[{'Name': 'Project Manager', 'Type': 'User'}, {'Name': 'Regional Manager', 'Type': 'User'}]"
      },
      {
        "_MetadataId": "Adobe_Licenses_for_Graduate_Trainees",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Adobe creative suite license '}, {'Type': 'Email', 'Name': 'Authorizer'}, {'Type': 'Email', 'Name': 'Trainee 1'}, {'Type': 'Email', 'Name': 'Trainee 2'}]"
      },
      {
        "_MetadataId": "KPI_Dataset",
        "_FieldLogs": "[{'Name': 'Job role', 'Type': 'Text'}, {'Name': 'KPI description', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "TravelApprovalList",
        "_FieldLogs": "[{'Name': 'Approvers', 'Type': 'Text'}, {'Name': 'Approvers User', 'Type': 'MultiUser'}, {'Name': 'Departments', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Leave_Policy_Dataset",
        "_FieldLogs": "[{'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Leave days per year', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Copy_of_Leave_Dataset",
        "_FieldLogs": "[{'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'Leave allocated', 'Type': 'Number'}, {'Name': 'Leave balance', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}, {'Name': 'Year', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "Leave_Dataset",
        "_FieldLogs": "[{'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'Leave allocated', 'Type': 'Number'}, {'Name': 'Leave balance', 'Type': 'Number'}, {'Name': 'Leave kind', 'Type': 'Text'}, {'Name': 'Leave type', 'Type': 'Text'}, {'Name': 'Year', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "Financial_Quarters",
        "_FieldLogs": "[{'Name': 'Quarter', 'Type': 'Text'}, {'Name': 'Start Date', 'Type': 'Number'}, {'Name': 'End Date', 'Type': 'Number'}, {'Name': 'Start Month', 'Type': 'Number'}, {'Name': 'End Month', 'Type': 'Number'}]"
      },
      {
        "_MetadataId": "GEOFFREY_FIADOR",
        "_FieldLogs": ""
      },
      {
        "_MetadataId": "Employee_Dataset",
        "_FieldLogs": "[{'Name': 'Annual leave type', 'Type': 'Text'}, {'Name': 'Date of joining', 'Type': 'Date'}, {'Name': 'Team', 'Type': 'Text'}, {'Name': 'Designation', 'Type': 'Text'}, {'Name': 'Employee email', 'Type': 'Text'}, {'Name': 'First name', 'Type': 'Text'}, {'Name': 'Employment type', 'Type': 'Text'}, {'Name': 'Gender', 'Type': 'Text'}, {'Name': 'Last name', 'Type': 'Text'}, {'Name': 'Other manager email', 'Type': 'Text'}, {'Name': 'Manager email', 'Type': 'Text'}, {'Name': 'Sub team', 'Type': 'Text'}, {'Name': 'Untitled field', 'Type': 'Text'}, {'Name': 'Untitled field', 'Type': 'Text'}]"
      },
      {
        "_MetadataId": "Software_Directory",
        "_FieldLogs": "[{'Type': 'Text', 'Name': 'Category'}]"
      },
      {
        "_MetadataId": "Database_Access_Request",
        "_FieldLogs": ""
      }
  // Add the rest of your JSON data here
];

// Helper function to generate random data based on type
function generateRandomData(type) {
  switch (type) {
    case "Text":
      return `Text_${Math.random().toString(36).substring(7)}`;
    case "Textarea":
      return `This is a longer text for Textarea_${Math.random()
        .toString(36)
        .substring(7)}`;
    case "Email":
      return `user${Math.floor(Math.random() * 1000)}@example.com`;
    case "Date":
      return new Date(
        Date.now() - Math.floor(Math.random() * 10000000000)
      )
        .toISOString()
        .split("T")[0];
    case "DateTime":
      return new Date(
        Date.now() - Math.floor(Math.random() * 10000000000)
      ).toISOString();
    case "Number":
      return Math.floor(Math.random() * 100);
    case "Select":
      return `Option_${Math.floor(Math.random() * 10)}`;
    case "MultiUser":
      return Array.from({ length: Math.floor(Math.random() * 3 + 1) })
        .map(() => `user_${Math.random().toString(36).substring(7)}`)
        .join(", ");
    case "User":
      return `user_${Math.random().toString(36).substring(7)}`;
    default:
      return "Unknown_Type";
  }
}

// Function to generate mock data for a dataset
function generateMockData(schema, count) {
  return Array.from({ length: count }, () => {
    const row = {};
    schema.forEach((field) => {
      row[field.Name] = generateRandomData(field.Type);
    });
    return row;
  });
}

// Function to convert data to CSV
function convertToCSV(data, schema) {
  const headers = schema.map((field) => field.Name).join(",");
  const rows = data
    .map((row) =>
      schema.map((field) => `"${row[field.Name]}"`).join(",")
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

// Main function to process JSON data and save CSV files
function processJSONData() {
  const outputDir = "./datasets"; // Directory to save CSV files
  const virtualUsers = 10; // Number of rows for each dataset

  jsonData.forEach((item) => {
    const { _MetadataId, _FieldLogs } = item;

    if (!_FieldLogs) {
      console.log(`Skipping ${_MetadataId} as it has no field logs.`);
      return;
    }

    try {
      // Parse _FieldLogs into a schema
      const schema = JSON.parse(
        _FieldLogs.replace(/'/g, '"') // Replace single quotes with double quotes for valid JSON
      );

      console.log(`Processing: ${_MetadataId}`);
      const mockData = generateMockData(schema, virtualUsers);
      const csvData = convertToCSV(mockData, schema);
      saveCSVFile(outputDir, `${_MetadataId}.csv`, csvData);
    } catch (err) {
      console.error(`Error processing ${_MetadataId}:`, err.message);
    }
  });
}

// Execute the main function
processJSONData();
