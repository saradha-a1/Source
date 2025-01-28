const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define randomItem function
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
const hardcodedEmails = [
  "saradha@kissflow.com",
  "jane_smith@bugbug-inbox.com",
  "john_doe@bugbug-inbox.com"
];
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

const listItems = [
  {
    "_id": "Account_Name",
    "Name": "Account Name",
    "ListItems": [
      "Checking",
      "Savings"
    ]
  },
  {
    "_id": "Account_Type",
    "Name": "Account Type",
    "ListItems": [
      "Settlement Bank Account",
      "Corporate Bank Account"
    ]
  },
  {
    "_id": "Additional_Items",
    "Name": "Additional Items",
    "ListItems": [
      "Event Registration",
      "Book Flight Tickets",
      "Book Accommodation",
      "Car Rental"
    ]
  },
  {
    "_id": "Agreement_Type",
    "Name": "Agreement Type",
    "ListItems": [
      "Partnership Agreement",
      "Joint Venture Agreement (JVA)",
      "Others"
    ]
  },
  {
    "_id": "Asset_Type",
    "Name": "Asset Type",
    "ListItems": [
      "Asset ",
      "Liability ",
      "Debit",
      "Credit "
    ]
  },
  {
    "_id": "Orientation",
    "Name": "Orientation",
    "ListItems": [
      "Organization oriented",
      "Consumer oriented"
    ]
  },
  {
    "_id": "Business_Card_Order_Type",
    "Name": "Business Card Order Type",
    "ListItems": [
      "Reprint",
      "New Order"
    ]
  },
  {
    "_id": "Business_Card_Quantity",
    "Name": "Business Card Quantity",
    "ListItems": [
      "50",
      "200",
      "500"
    ]
  },
  {
    "_id": "Business_Quarters",
    "Name": "Business Quarters",
    "ListItems": [
      "H1",
      "H2"
    ]
  },
  {
    "_id": "Campaign_Type",
    "Name": "Campaign Type",
    "ListItems": [
      "Conference",
      "Email",
      "Others"
    ]
  },
  {
    "_id": "Compensation_frequency",
    "Name": "Compensation frequency",
    "ListItems": [
      "Weekly",
      "Biweekly",
      "Monthly"
    ]
  },
  {
    "_id": "Country_List",
    "Name": "Country List",
    "ListItems": [
      "Cameroon",
      "Canada",
      "Cote d'Ivoire",
      "Cyprus",
      "Egypt",
      "Ghana",
      "India",
      "Kenya",
      "Lithuania",
      "Malawi",
      "Mauritius",
      "Morocco",
      "Mozambique",
      "Nigeria",
      "Rwanda",
      "Saudi Arabia",
      "Senegal",
      "Sierra Leone",
      "Singapore",
      "South Africa",
      "Tanzania",
      "The Netherlands",
      "Turkey",
      "Uganda",
      "Uganda SMC",
      "United Arab Emirates",
      "United Kingdom",
      "USA",
      "Zambia"
    ]
  },
  {
    "_id": "Currencies",
    "Name": "Currencies",
    "ListItems": [
      "AED",
      "CAD",
      "EGP",
      "EUR",
      "GBP",
      "GHS",
      "INR",
      "KES",
      "MAD",
      "MUR",
      "MWK",
      "NGN",
      "RWF",
      "SAR",
      "SLL",
      "TRY",
      "TZS",
      "UGX",
      "USD",
      "XAF",
      "XOF",
      "ZAR",
      "ZMW",
      "IDR",
      "MZN",
      "SGD"
    ]
  },
  {
    "_id": "Departments",
    "Name": "Departments",
    "ListItems": [
      "Sales",
      "HR",
      "IT",
      "Admin",
      "Marketing",
      "Finance"
    ]
  },
  {
    "_id": "Departments_List",
    "Name": "Departments List",
    "ListItems": [
      "Engineering",
      "Customer Success",
      "People Operations",
      "Commercial",
      "Growth",
      "Settlement & Operations",
      "Expansion and Partnership",
      "Office of the CEO",
      "Compliance & Risk",
      "Customer Experience",
      "Marketing",
      "Finance",
      "Product",
      "Chief Commercial Officer",
      "Chief Operating Officer",
      "Legal",
      "Internal Audit & Control",
      "Commmerical",
      "Legal & Compliance",
      "Admin"
    ]
  },
  {
    "_id": "Designation",
    "Name": "Designation",
    "ListItems": [
      "HR Executive",
      "Sales Manager",
      "Customer Support Executive",
      "Business Analyst",
      "Developer",
      "Sales Executive",
      "Finance Executive"
    ]
  },
  {
    "_id": "EEO_job_category",
    "Name": "EEO job category",
    "ListItems": [
      "1.1",
      "1.2",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9"
    ]
  },
  {
    "_id": "Email_status",
    "Name": "Email status",
    "ListItems": [
      "To be sent",
      "Sent"
    ]
  },
  {
    "_id": "Employment_class",
    "Name": "Employment class",
    "ListItems": [
      "Assignee",
      "Consultant",
      "Expatriate",
      "Agency/Temp",
      "Intern",
      "Apprentice",
      "Contractor",
      "Trainee",
      "Employee"
    ]
  },
  {
    "_id": "Employment_type",
    "Name": "Employment type",
    "ListItems": [
      "Full time",
      "Intern",
      "Contractor"
    ]
  },
  {
    "_id": "Event",
    "Name": "Event",
    "ListItems": [
      "Event",
      "Business Meeting"
    ]
  },
  {
    "_id": "Event_Registration",
    "Name": "Event Registration",
    "ListItems": [
      "Event Registration"
    ]
  },
  {
    "_id": "Expense_Type",
    "Name": "Expense Type",
    "ListItems": [
      "Rent",
      "Utilities",
      "Wages",
      "Meals",
      "Training",
      "Supplies",
      "Other"
    ]
  },
  {
    "_id": "FLSA_status",
    "Name": "FLSA status",
    "ListItems": [
      "Covered & non-exempt",
      "Covered & exempt",
      "Not covered"
    ]
  },
  {
    "_id": "Gender",
    "Name": "Gender",
    "ListItems": [
      "Male",
      "Female"
    ]
  },
  {
    "_id": "Half_Year_Quarter",
    "Name": "Half Year/Quarter",
    "ListItems": [
      "H1",
      "H2"
    ]
  },
  {
    "_id": "Interview_Status",
    "Name": "Interview Status",
    "ListItems": [
      "Offered",
      "Hired",
      "Rejected"
    ]
  },
  {
    "_id": "Leave_Type",
    "Name": "Leave Type",
    "ListItems": [
      "Sick",
      "Paid",
      "On Duty",
      "Work from Home"
    ]
  },
  {
    "_id": "Leave_Units",
    "Name": "Leave Units",
    "ListItems": [
      "Days",
      "Hours"
    ]
  },
  {
    "_id": "Leave_duration",
    "Name": "Leave duration",
    "ListItems": [
      "Short term",
      "Long term"
    ]
  },
  {
    "_id": "Leave_request_type",
    "Name": "Leave request type",
    "ListItems": [
      "Leave request",
      "Leave cancellation"
    ]
  },
  {
    "_id": "Legal_Document_Type",
    "Name": "Legal Document Type",
    "ListItems": [
      "Merchant Service Agreement",
      "Memorandum of Understanding",
      "Bespoke Agreement",
      "Mutual Non-Disclosure Agreement"
    ]
  },
  {
    "_id": "List_of_process",
    "Name": "List of process",
    "ListItems": [
      "Initiate Performance Appraisal & Upward Feedback for the current half year",
      "The employees should now see their Manager's rating in their Appraisal forms",
      "Freeze the forms for employees who haven't completed Self Reviews for their Performance Appraisals",
      "Remind employees to complete Self Review for their Performance Appraisals",
      "Initiate 1 on 1 for the current half year"
    ]
  },
  {
    "_id": "Marital_status",
    "Name": "Marital status",
    "ListItems": [
      "Single",
      "Married"
    ]
  },
  {
    "_id": "Merchant_Type",
    "Name": "Merchant Type",
    "ListItems": [
      "Merchant",
      "Merchant Agreegator",
      "Service Provider",
      "Strategic Partner"
    ]
  },
  {
    "_id": "Mode_of_Payment",
    "Name": "Mode_of_Payment",
    "ListItems": [
      "Cash",
      "Check",
      "Credit Card",
      "Electronic Transfer"
    ]
  },
  {
    "_id": "New_Role_or_Back_Fill",
    "Name": "New Role or Back Fill",
    "ListItems": [
      "New Role",
      "Back Fill"
    ]
  },
  {
    "_id": "Onboarding_Checklist",
    "Name": "Onboarding Checklist",
    "ListItems": [
      "Say hi to your buddy",
      "Complete your profile",
      "Complete your training",
      "Pass your assessment"
    ]
  },
  {
    "_id": "Only_Yes",
    "Name": "Only Yes",
    "ListItems": [
      "Yes"
    ]
  },
  {
    "_id": "PIP_Duration",
    "Name": "PIP Duration",
    "ListItems": [
      "4 weeks",
      "5 weeks",
      "6 weeks",
      "7 weeks",
      "8 weeks",
      "9 weeks",
      "10 weeks",
      "11 weeks",
      "12 weeks"
    ]
  },
  {
    "_id": "Payment_Mode",
    "Name": "Payment Mode",
    "ListItems": [
      "Check",
      "Transfer to Salary Account"
    ]
  },
  {
    "_id": "Preferred_t_shirt_size",
    "Name": "Preferred t-shirt size",
    "ListItems": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ]
  },
  {
    "_id": "Progress",
    "Name": "Progress",
    "ListItems": [
      "Weekly target met",
      "Missed target by a small margin",
      "Significantly missed target"
    ]
  },
  {
    "_id": "Purchase_Category",
    "Name": "Purchase Category",
    "ListItems": [
      "Inventory",
      "Non-Inventory"
    ]
  },
  {
    "_id": "Purchase_Sub_Category",
    "Name": "Purchase Sub-Category",
    "ListItems": [
      "Assets",
      "Consumables"
    ]
  },
  {
    "_id": "Recruitment_Source",
    "Name": "Recruitment Source ",
    "ListItems": [
      "Job Advertisement",
      "Linkedin",
      "Facebook",
      "Job Boards",
      "Aggregator Sites",
      "Referrals"
    ]
  },
  {
    "_id": "Regular_temporary",
    "Name": "Regular/temporary",
    "ListItems": [
      "Regular",
      "Temporary"
    ]
  },
  {
    "_id": "Request_for",
    "Name": "Request for",
    "ListItems": [
      "New Employee - Provide Access",
      "Same Position - New Roles",
      "Transferring - Change Access",
      "Remove Access"
    ]
  },
  {
    "_id": "Second_Level_Interview_Checklist",
    "Name": "Second Level Interview Checklist",
    "ListItems": [
      "Availability to start",
      "Setting up learning curve expectations",
      "Align expectations about salary and benefits",
      "Explaining Hiring Formalities"
    ]
  },
  {
    "_id": "Separation_Type",
    "Name": "Separation Type",
    "ListItems": [
      "Resignation",
      "Firing"
    ]
  },
  {
    "_id": "Sex",
    "Name": "Sex",
    "ListItems": [
      "Male",
      "Female"
    ]
  },
  {
    "_id": "Travel_Expense_Type",
    "Name": "Travel Expense Type",
    "ListItems": [
      "Travel",
      "Food",
      "Lodging",
      "Parking",
      "Others"
    ]
  },
  {
    "_id": "Type_of_Service_",
    "Name": "Type of Service ",
    "ListItems": [
      "Goods",
      "Services",
      "Both"
    ]
  },
  {
    "_id": "Vehicle_type",
    "Name": "Vehicle type",
    "ListItems": [
      "Motorcycle",
      "Car"
    ]
  },
  {
    "_id": "Visa_Requirements",
    "Name": "Visa Requirements",
    "ListItems": []
  },
  {
    "_id": "Welfare",
    "Name": "Welfare",
    "ListItems": [
      "Wedding",
      "Child Birth",
      "Bereavement",
      "Others"
    ]
  },
  {
    "_id": "Yes_No",
    "Name": "Yes/No",
    "ListItems": [
      "Yes",
      "No"
    ]
  },
  {
    "_id": "Supplier_Location",
    "Name": "Supplier Location",
    "ListItems": [
      "New york",
      "Canada",
      "India",
      "Australia",
      "USA"
    ]
  },
  {
    "_id": "Internet_Banking_Required_Bjj3imgxAD",
    "Name": "Internet_Banking_Required_Bjj3imgxAD",
    "ListItems": [
      "Yes",
      "No"
    ]
  },
  {
    "_id": "Account_Type_Bicz9vhe4",
    "Name": "Account_Type_Bicz9vhe4",
    "ListItems": [
      "Saving",
      "Current",
      "Fixed Deposit"
    ]
  }
];


function generateRandomData(type, fieldName) {
  switch (type) {
    case "Text":
      return `Text_${Math.random().toString(36).substring(7)}`;
    case "Textarea":
      return `This is a longer text for Textarea_${Math.random().toString(36).substring(7)}`;
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
      case "User":
        // For 'User' type, take a single user email from the hardcoded list
        return randomItem(hardcodedEmails);
    case "Select":
      console.log(`Checking Select field: ${fieldName}`);
      console.log(`Match found for ${fieldName}:`, matchingLists[0].ListItems);
      console.warn(`No matching ListItems found for: ${fieldName}`);
      // Find all matching ListItems based on Name in the listItems array
      const matchingLists = listItems.filter(
        item => item.Name.toLowerCase() === fieldName.toLowerCase()
      );
      
      if (matchingLists.length > 0) {
        // Debug: log the matching list found
        console.log(`Match found for ${fieldName}:`, matchingLists[0].ListItems);
        
        // Select a random item from the ListItems of the first matching list
        return randomItem(matchingLists[0].ListItems);
      } else {
        // Debug: log when no match is found
        console.warn(`No matching ListItems found for: ${fieldName}`);
        return "Unknown_Select"; // Default if no match found
      }
      case "MultiUser":
        // For 'MultiUser' type, select multiple user emails from the hardcoded list
        const numberOfUsers = Math.min(hardcodedEmails.length, Math.floor(Math.random() * 4) + 2);
        return hardcodedEmails
          .sort(() => 0.5 - Math.random()) // Randomize the list
          .slice(0, numberOfUsers);
    default:
      return "Unknown_Type";
  }
}

function generateUniqueKey() {
  return Math.random().toString(36).substring(2, 5).toUpperCase(); // Get 3 alphanumeric characters
}

function processFieldLogs(fieldLogs, listItems, virtualUsers) {
  if (!fieldLogs) {
    return [];
  }

  const schema = JSON.parse(fieldLogs.replace(/'/g, '"')); // Parse the fieldLogs JSON
  return Array.from({ length: virtualUsers }, (_, index) => {
    const row = { key: generateUniqueKey() }; // Generate 3-letter alphanumeric key
    schema.forEach(field => {
      if (field.Type === "Select") {
        // Find all matching ListItems based on Name, case-insensitive
        const matchingLists = listItems.filter(
          list => list.Name.toLowerCase() === field.Name.toLowerCase()
        );
        if (matchingLists.length > 0) {
          // Debug: log when match is found
          console.log(`Match found for ${field.Name}: ${matchingLists[0].ListItems}`);
          row[field.Name] = randomItem(matchingLists[0].ListItems);
        } else {
          row[field.Name] = "Unknown_Select"; // Default if no match found
        }
      } else {
        row[field.Name] = generateRandomData(field.Type, field.Name);
      }
    });
    return row;
  });
}
  
function convertToCSV(data, schema) {
  const headers = ["key", ...schema.map((field) => field.Name)].join(",");
  const rows = data
    .map((row) =>
      [row.key, ...schema.map((field) => `"${row[field.Name]}"`)].join(",")
    )
    .join("\n");
  return `${headers}\n${rows}`;
}

function saveCSVFile(directory, filename, csvData) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, csvData, "utf8");
  console.log(`File saved: ${filePath}`);
}
const processed = [];
const skipped = [];

function processJSONData(jsonData, virtualUsers) {
  const outputDir = "./datasets";

  jsonData.forEach((item) => {
    const { _MetadataId, _FieldLogs } = item;

    if (!_FieldLogs) {
      console.log(`Skipping ${_MetadataId} as it has no field logs.`);
      skipped.push(_MetadataId);
      return;
    }

    try {
      const schema = JSON.parse(_FieldLogs.replace(/'/g, '"'));
      const mockData = processFieldLogs(_FieldLogs, listItems, virtualUsers);
      const csvData = convertToCSV(mockData, schema);
      saveCSVFile(outputDir, `${_MetadataId}.csv`, csvData);
      processed.push(_MetadataId);
    } catch (err) {
      console.error(`Error processing ${_MetadataId}:`, err.message);
      skipped.push(_MetadataId);
    }
  });

  // Summary log
  console.log("\n=== Processing Summary ===");
  console.log(`Total processed: ${processed.length}`);
  console.log(`Total skipped: ${skipped.length}`);
  if (skipped.length > 0) {
    console.log("Skipped datasets:", skipped.join(", "));
  }
}
async function main() {
  processJSONData(jsonData, 10);
}

main().catch(err => {
  console.error("Error in main execution:", err.message);
});
