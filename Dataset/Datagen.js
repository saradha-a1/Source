import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';

// Get the current module's file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenv = await import('dotenv');
dotenv.default.config({ path: path.resolve(__dirname, '../.env') });

// JSON path
const jsonFilePath = path.join(__dirname, '../Asset/CSV/Dataset_list.json');

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  throw new Error(`File not found: ${jsonFilePath}`);
}

// Load JSON
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Get values from Lists
const getListValues = (listName, lists) => {
  const list = lists.find(l => l.listName === listName);
  return list ? list.values : [];
};

// Generate synthetic data based on column type and name
const generateData = (columnType = '', columnName = '', lists = [], datasetMappings = {}) => {
  const columnTypeLower = columnType.toLowerCase();
  const columnNameLower = columnName.toLowerCase();

  // Handle dropdown and checkbox types
  if (['dropdown', 'checkbox'].includes(columnTypeLower)) {
    const values = datasetMappings[columnName];
    return values && values.length > 0 ? faker.helpers.arrayElement(values) : 'N/A';
  }

  // Handle specific types
  switch (columnTypeLower) {
    case 'text':
    case 'textarea':
      if (/description|remarks|notes/.test(columnNameLower)) return faker.lorem.sentence();
      return faker.lorem.word();

    case 'number':
      return faker.number.int({ min: 1000, max: 9999 });

    case 'email':
      return faker.internet.email();

    case 'currency':
      return faker.finance.amount(1000, 10000, 2, '$');

    default:
      // Fallback using column name
      switch (true) {
        case /name/.test(columnNameLower): return faker.person.fullName();
        case /email/.test(columnNameLower): return faker.internet.email();
        case /phone|contact/.test(columnNameLower): return faker.phone.number();
        case /address|location/.test(columnNameLower): return faker.location.streetAddress();
        case /city/.test(columnNameLower): return faker.location.city();
        case /country/.test(columnNameLower): return faker.location.country();
        case /amount|price|salary|budget/.test(columnNameLower): return faker.finance.amount();
        case /company|organization/.test(columnNameLower): return faker.company.name();
        case /date|dob|joining/.test(columnNameLower): return faker.date.past().toLocaleDateString('en-GB');
        default: return faker.word.words(1);
      }
  }
};

// Output directory setup
const outputDir = path.join(__dirname, 'output_csv');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Generate CSVs from datasets
jsonData.forEach(processObj => {
  const lists = processObj.Lists || [];

  (processObj.Datasets || []).forEach(dataset => {
    const { datasetName, columns } = dataset;
    if (!columns || columns.length === 0) return;

    // Map dropdown/checkbox columns to their list values
    const datasetMappings = {};
    columns.forEach(column => {
      const colType = column.columnType?.toLowerCase();
      if ((colType === 'dropdown' || colType === 'checkbox') && column.listName) {
        datasetMappings[column.columnName] = getListValues(column.listName, lists);
      }
    });

    const rows = [];
    for (let i = 1; i <= 10; i++) {
      const row = { Key: `ID-${i}` };
      columns.forEach(({ columnName, columnType }) => {
        row[columnName] = generateData(columnType, columnName, lists, datasetMappings);
      });
      rows.push(row);
    }

    try {
      const csvData = parse(rows);
      const filePath = path.join(outputDir, `${datasetName}.csv`);
      fs.writeFileSync(filePath, csvData);
      console.log(`✅ CSV generated: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error writing CSV for ${datasetName}:`, error);
    }
  });
});

console.log("✅ All CSV files generated successfully!");
