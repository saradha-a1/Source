import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Paths
const inputCsvPath = path.resolve(__dirname, '../Asset/CSV/ProcessName.csv'); 
const outputJsonPath = path.resolve(__dirname, '../Asset/CSV/output.json');
const allFieldsJsonPath = path.resolve(__dirname, '../Asset/CSV/all_fields.json');

// Check if we need to generate fields from scratch
if (process.env.GENERATE_FIELDS === 'NEW' && fs.existsSync(allFieldsJsonPath)) {
    fs.unlinkSync(allFieldsJsonPath); // Delete previous fields.json
    console.log('Deleted existing all_fields.json as per GENERATE_FIELDS=NEW');
}

// Load existing fields to avoid duplicates
let existingFields = {};
if (fs.existsSync(allFieldsJsonPath)) {
    try {
        existingFields = JSON.parse(fs.readFileSync(allFieldsJsonPath, 'utf-8'));
    } catch (error) {
        console.error('Error reading all_fields.json:', error);
        existingFields = {};
    }
}


// Predefined sample JSON (used as a template for OpenAI)
const sampleJson = {
    ProcessName: 'Employee_Details',
    Fields: [
        {
            fieldName1: "Employee_Name",
            fieldType: "Text",
            required: true,
            validation: {
                ruleName: "MIN_LENGTH",
                value: 5,
                validationMessage: "Name must be at least 5 characters."
            }
        },
        {
            fieldName2: "Employee_Description",
            fieldType: "Textarea",
            required: true
        },
        {
            fieldName3: "Employee_Age",
            fieldType: "Number",
            required: true,
            validation: {
                ruleName: "GREATER_THAN",
                value: 18,
                validationMessage: "Age must be greater than 18."
            },
            expression: "RANDBETWEEN(20, 60)"
        },
        {
            fieldName4: "Joining_Date",
            fieldType: "Date",
            required: true
        },
        {
            fieldName5: "Department",
            fieldType: "Select",
            required: true,
            datasetName: "Employee_Details_Departments",
            datasetColumn: "Department_Name",
            columnType: "Text"
        },
        {
            fieldName6: "Is_Active",
            fieldType: "Boolean",
            required: true
        },
        {
            fieldName7: "Employee_Email",
            fieldType: "Email",
            required: true
        },
        {
            fieldName8: "Employment_Type",
            fieldType: "Select",
            required: true,
            listName: "Employee_Details_EmploymentTypes"
        },
        {
            fieldName9: "Salary",
            fieldType: "Currency",
            required: true
        },
        {
            fieldName10: "Skills",
            fieldType: "Multiselect",
            required: true,
            listName: "Employee_Details_Skills"
        },
        {
            fieldName11: "Terms_Accepted",
            fieldType: "Checkbox",
            required: true,
            listName: "Employee_Details_Terms"
        },
        {
            fieldName12: "Manager",
            fieldType: "Reference",
            required: true,
            datasetName: "Employee_Details_Managers",
            datasetColumn: "Manager_Name",
            columnType: "Text"
        },
        {
            fieldName13: "Resume",
            fieldType: "Attachment",
            required: true
        }
    ],
    Datasets: [
        {
            datasetName: "Employee_Details_Departments",
            columns: [
                {
                    columnName: "Department_Name",
                    columnType: "Text"
                },
                {
                    columnName: "Department_ID",
                    columnType: "Number"
                },
                {
                    columnName: "Description",
                    columnType: "Text area"
                },
                {
                    columnName: "Department_Email",
                    columnType: "Email"
                }
            ]
        },
        {
            datasetName: "Employee_Details_Managers",
            columns: [
                {
                    columnName: "Manager_Name",
                    columnType: "Text"
                },
                {
                    columnName: "Manager_ID",
                    columnType: "Number"
                },
                {
                    columnName: "Manager_Email",
                    columnType: "Email"
                },
                {
                    columnName: "Department",
                    columnType: "Text"
                }
            ]
        }
    ],
    Lists: [
        {
            listName: "Employee_Details_EmploymentTypes",
            values: [
                "Full-Time", 
                "Part-Time", 
                "Contract"
            ]
        },
        {
            listName: "Employee_Details_Skills",
            values: [
                "Java", 
                "Python", 
                "SQL"
            ]
        },
        {
            listName: "Employee_Details_Terms",
            values: [
                "Term 1",
                "Term 2", 
                "Term 3"
            ]
        }
    ]
};
// Function to generate unique dataset/list names
function generateUniqueName(baseName, existingNames) {
    let newName = baseName;
    let counter = 1;
    while (existingNames.has(newName)) {
        newName = `${baseName}_${counter}`;
        counter++;
    }
    existingNames.add(newName);
    return newName;
}

// Function to generate JSON data using OpenAI
async function generateFormData(processName, sampleJson) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-2024-08-06', // Use GPT-4 or GPT-3.5-turbo
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant that generates JSON data for process forms based on their use case. Use the following JSON structure as a template: ${JSON.stringify(sampleJson)}`,
                },
                {
                    role: 'user',
                    content: `Generate a well-structured JSON for the process "${processName}" following these rules:



1. ProcessName**
- The "ProcessName" must be exactly "${processName}". Do not modify or rename it.



**Fields (5, 8, or 13 Fields)**
   - The number of fields should be dynamically selected from 5, 8, or 13.
   - Field names must be **meaningful** and relevant to "${processName}".  
   - Keep the **same order of field types**, but allow dynamic field generation within that structure.
- **Field names must be meaningful** and relevant to "${processName}".  
  **❌ Avoid generic names** like "TextField", "TextareaField", "NumberField".  
  **✅ Use meaningful names** related to "${processName}".  
  _(Example: If process is "ProjectManagement", use "Project_Title", "Start_Date", "Budget", etc.)_

- The fields should be in **this structure**, but **not all** must be included:
  1. **Text** ("fieldType": "Text")
  2. **Text Area** ("fieldType": "Textarea")
  3. **Number** ("fieldType": "Number")
  4. **Date** ("fieldType": "Date")
  5. **Dropdown** ("fieldType": "Select") _(Must reference a Dataset)_
  6. **Yes/No** ("fieldType": "Boolean")
  7. **Email** ("fieldType": "Email")
  8. **Radio Button** ("fieldType": "Select") _(Must reference a List)_
  9. **Currency** ("fieldType": "Currency")
  10. **Multi-Select Dropdown** ("fieldType": "Multiselect") _(Must reference a List)_
  11. **Checkbox** ("fieldType": "Checkbox") _(Must reference a List)_
  12. **Lookup** ("fieldType": "Reference") _(Must reference a Dataset)_
  13. **Attachment** ("fieldType": "Attachment")

---

### **3. Field Mapping Rules**
✅ **Dropdown and Lookup fields** must reference a **Dataset** with "datasetName", "datasetColumn", and "columnType".  
✅ **Multi-Select, Radio Button, and Checkbox fields** must reference a **List** with "listName".  
🚫 **No hardcoded/static values**. Always use **Dataset/List references**.  

_(Example: If there's a field "Project_Manager", it must reference "ProjectManagement_Managers" dataset.)_

---

### **4. Validation Rules (For Text & Number Fields Only)**
✅ Apply **one validation rule per field** (only for "Text" and "Number" fields).  

- **Text Fields:** Choose **one** of the following:  
  - "ALPHABETS" (Only letters allowed)  
  - "MIN_LENGTH" (Minimum character length)  
  - "MAX_LENGTH" (Maximum character length)  
  - "CONTAINS" (Must contain a specific substring)  
  - "DOES_NOT_CONTAIN" (Must NOT contain a specific substring)  

- **Number Fields:** Choose **one** of the following:  
  - "EQUAL_TO"  
  - "NOT_EQUAL_TO" 
  - "GREATER_THAN" 
  - "LESS_THAN" 
  - "GREATER_THAN_OR_EQUAL_TO"  
  - "LESS_THAN_OR_EQUAL_TO"  

🚫 **Do not apply validation** to "Email", "Boolean", "Dropdown", "Currency", "Lookup", "Attachment", etc.  

---

### **5. Datasets (If Needed)**
- If the process includes a **Dropdown** or **Lookup** field, generate **1 or 2 datasets**.
- Each dataset must have **4 columns**.
- Allowed column types: "Text", "Number", "Text Area", "Email", "Currency".
- Dataset names must follow the format:  
  **"<processName>_<datasetPurpose>"**.  
  _(Example: "ProjectManagement_Departments", "Sales_Regions")_

---

### **6. Lists (If Needed)**
- If the process includes a **Multi-Select, Radio Button, or Checkbox**, generate **1 or 2 lists**.
- Each list must have **3 values**.
- List names must follow the format:  
  **"<processName>_<listPurpose>"**.  
  _(Example: "HR_Employee_Types", "Customer_Feedback_Options")_

---

### **7. Expression Rules (For Number Fields Only)**
- If a **Number** field needs an expression, use:  
  **RANDBETWEEN(<from>, <to>)**  
  _(Example: "Age": RANDBETWEEN(20, 60))



### **8. General Guidelines**
✅ **Each process should generate a different number of fields (between 4-13).**  
✅ **Ensure all fields include "required": true/false 
✅ **Use unique "datasetName" and "listName" per process**.  
✅ **Do not generate extra fields beyond the Attachment field**. 
✅ **Do not generate different order of fields.Make sure the order of fields same, u can generate dynamic fields in that order **. 
🚫 **Do NOT include unnecessary text, just return the JSON object**.  


Final JSON Structure:
json
{
  "ProcessName": "${processName}",
  "Fields": [...],
  "Datasets": [...],  // Only if needed
  "Lists": [...]      // Only if needed
}

`,
                },
            ],
        });

        // Extract the generated JSON from the OpenAI response
        const generatedJson = response.choices[0].message.content;
        const jsonMatch = generatedJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No valid JSON found in OpenAI response.');

        const parsedJson = JSON.parse(jsonMatch[0]);
        parsedJson.ProcessName = processName;

        // Ensure unique dataset & list names
        const usedNames = new Set();
        parsedJson.Datasets.forEach(ds => {
            ds.datasetName = generateUniqueName(ds.datasetName, usedNames);
        });
        parsedJson.Lists.forEach(lst => {
            lst.listName = generateUniqueName(lst.listName, usedNames);
        });

        return parsedJson;
    } catch (error) {
        console.error('Error generating JSON:', error);
        return { ProcessName: processName, Fields: [] };
    }
}

// Function to save JSON file
function saveToJsonFile(data, filePath) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`JSON saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving JSON:', error);
    }
}

// Main function
async function main() {
    try {
        const processData = {};

        if (!fs.existsSync(inputCsvPath)) {
            throw new Error(`CSV file not found: ${inputCsvPath}`);
        }

        const csvStream = fs.createReadStream(inputCsvPath).pipe(csv());
        for await (const row of csvStream) {
            const processName = row.ProcessName;
            if (!processName) continue;

            const formData = await generateFormData(processName, sampleJson, existingFields);
            processData[processName] = formData;
            existingFields[processName] = formData; // Store new fields
        }

        saveToJsonFile(processData, outputJsonPath);
        saveToJsonFile(existingFields, allFieldsJsonPath); // Save all fields

    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Run script
main();
