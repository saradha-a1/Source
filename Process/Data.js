import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const NUMBER_ROWS = parseInt(process.env.NUMBER_ROWS, 10) || 10;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const fieldsFile = path.join(__dirname, '../Asset/CSV/Fields.json');
const datasetListFile = path.join(__dirname, '../Asset/CSV/Dataset_list.json');
const datasetsPath = path.join(__dirname, '../Dataset/output_csv');
const outputPath = path.join(__dirname, '../Asset/Xlsx/Process');

// Ensure output directory exists
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const fieldsData = JSON.parse(fs.readFileSync(fieldsFile, 'utf-8'));
const datasetList = JSON.parse(fs.readFileSync(datasetListFile, 'utf-8'));

// Cache for dataset values
const datasetCache = new Map();
// Cache for generated values to ensure uniqueness (except for names)
const generatedValuesCache = new Map();

const getRandomValueFromList = (list) => list.length ? list[Math.floor(Math.random() * list.length)] : null;

const getDatasetValues = (datasetName, columnName) => {
  const cacheKey = `${datasetName}_${columnName}`;
  if (datasetCache.has(cacheKey)) return datasetCache.get(cacheKey);

  const datasetFile = path.join(datasetsPath, `${datasetName}.csv`);
  if (!fs.existsSync(datasetFile)) {
    console.warn(`Dataset file not found: ${datasetFile}`);
    return [];
  }

  try {
    const workbook = xlsx.readFile(datasetFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const values = data.map(row => row[columnName]).filter(Boolean);
    datasetCache.set(cacheKey, values);
    return values;
  } catch (error) {
    console.error(`Error reading dataset ${datasetName}:`, error);
    return [];
  }
};

const getListValues = (processName, listName) => {
  const processData = datasetList.find(d => d.ProcessName === processName);
  if (!processData?.Lists) return [];
  return processData.Lists.find(l => l.listName === listName)?.values || [];
};

const cleanValue = (value, fieldType) => {
  if (value === null || value === undefined) return '';
  
  value = String(value).trim();
  
  if (fieldType === 'Number' || fieldType === 'Currency') {
    if (value.endsWith('.')) {
      value = value.slice(0, -1);
    }
    if (!isNaN(value)) {
      value = value.includes('.') ? parseFloat(value).toString() : parseInt(value, 10).toString();
    }
  }
  
  return value;
};

const ensureUniqueValue = (fieldName, value, fieldType) => {
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('name')) {
    return value;
  }

  const cacheKey = `${fieldName}_${fieldType}`;
  if (!generatedValuesCache.has(cacheKey)) {
    generatedValuesCache.set(cacheKey, new Set());
  }

  const existingValues = generatedValuesCache.get(cacheKey);
  
  if (!existingValues.has(value)) {
    existingValues.add(value);
    return value;
  }

  if (fieldType === 'Email') {
    return value.replace('@', `${existingValues.size + 1}@`);
  } else if (fieldType === 'Number' || fieldType === 'Currency') {
    return `${value}${existingValues.size + 1}`;
  } else if (fieldType === 'Date') {
    const date = new Date(value);
    date.setDate(date.getDate() + existingValues.size);
    return date.toISOString().split('T')[0];
  }
  
  return value;
};

const parseNumberExpression = (expression) => {
  if (!expression || typeof expression !== 'string') return null;

  // Handle RANDBETWEEN expressions
  if (expression.startsWith('RANDBETWEEN(')) {
    const matches = expression.match(/RANDBETWEEN\((\d+),\s*(\d+)\)/);
    if (matches && matches.length === 3) {
      return {
        min: parseInt(matches[1], 10),
        max: parseInt(matches[2], 10)
      };
    }
  }
  
  // Handle other potential expressions in the future
  return null;
};

const generateDynamicNumber = (fieldName, fieldConfig) => {
  let min = 1;
  let max = 1000;
  
  // Apply expression if available
  const expressionRange = parseNumberExpression(fieldConfig.expression);
  if (expressionRange) {
    min = expressionRange.min;
    max = expressionRange.max;
  }

  // Apply validation rules
  if (fieldConfig.validation) {
    const validationValue = parseInt(fieldConfig.validation.value, 10);
    
    switch (fieldConfig.validation.ruleName) {
      case 'GREATER_THAN':
        min = Math.max(min, validationValue + 1);
        break;
      case 'GREATER_THAN_OR_EQUAL':
        min = Math.max(min, validationValue);
        break;
      case 'LESS_THAN':
        max = Math.min(max, validationValue - 1);
        break;
      case 'LESS_THAN_OR_EQUAL':
        max = Math.min(max, validationValue);
        break;
      case 'BETWEEN':
        if (fieldConfig.validation.minValue && fieldConfig.validation.maxValue) {
          min = Math.max(min, parseInt(fieldConfig.validation.minValue, 10));
          max = Math.min(max, parseInt(fieldConfig.validation.maxValue, 10));
        }
        break;
      case 'MIN_VALUE':
        min = Math.max(min, validationValue);
        break;
      case 'MAX_VALUE':
        max = Math.min(max, validationValue);
        break;
      default:
        console.warn(`Unknown validation rule: ${fieldConfig.validation.ruleName}`);
    }
  }

  // Special cases based on field name
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('age')) {
    min = Math.max(min, 18);
    max = Math.min(max, 80);
  } else if (lowerName.includes('year')) {
    min = Math.max(min, 2000);
    max = Math.min(max, new Date().getFullYear());
  }

  // Ensure valid range
  if (min > max) {
    console.warn(`Invalid range for ${fieldName}: min ${min} > max ${max}. Using validation value as fallback.`);
    if (fieldConfig.validation?.value) {
      return fieldConfig.validation.value;
    }
    return min.toString();
  }

  // Generate the value
  const value = Math.floor(min + Math.random() * (max - min + 1)).toString();
  
  return ensureUniqueValue(fieldName, value, 'Number');
};

const generateFallbackText = (fieldName, fieldType, validation = null) => {
  if (fieldType === 'Date') {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    return date.toISOString().split('T')[0];
  } else if (fieldType === 'Number') {
    return Math.floor(Math.random() * 1000).toString();
  } else if (fieldType === 'Currency') {
    return Math.floor(Math.random() * 1000).toString();
  } else if (fieldType === 'Email') {
    return `user${Math.floor(Math.random() * 1000)}@example.com`;
  } else if (fieldType === 'Boolean') {
    return Math.random() > 0.5 ? 'Yes' : 'No';
  } else {
    const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    const count = validation?.ruleName === 'MIN_LENGTH' ? 
      Math.max(3, parseInt(validation.value) / 5) : 
      Math.floor(Math.random() * 5) + 3;
    return Array(count).fill(0).map(() => words[Math.floor(Math.random() * words.length)]).join(' ');
  }
};

const generateRealisticName = async (fieldName) => {
  try {
    // Determine the type of name based on the field name
    let nameType = 'full name';
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('first') || lowerName.includes('given')) {
      nameType = 'first name';
    } else if (lowerName.includes('last') || lowerName.includes('surname') || lowerName.includes('family')) {
      nameType = 'last name';
    } else if (lowerName.includes('full') || lowerName.includes('complete')) {
      nameType = 'full name';
    }

    // Add diversity to the names
    const ethnicities = ['American', 'British', 'Indian', 'Chinese', 'Hispanic', 'Arabic', 'African'];
    const selectedEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];

    const prompt = `Generate a realistic ${nameType} (${selectedEthnicity} origin). Return only the name without any additional text or quotes.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: 30,
      temperature: 0.7,
    });

    let result = completion.choices[0]?.message?.content?.trim() || '';
    
    // Clean up any quotes or unexpected characters
    if ((result.startsWith('"') && result.endsWith('"')) || 
        (result.startsWith("'") && result.endsWith("'"))) {
      result = result.slice(1, -1);
    }
    
    // Fallback if the result is empty
    if (!result) {
      const fallbackNames = {
        first: ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella'],
        last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
        full: ['James Smith', 'Emma Johnson', 'Liam Williams', 'Olivia Brown', 'Noah Jones']
      };
      
      if (nameType.includes('first')) {
        result = fallbackNames.first[Math.floor(Math.random() * fallbackNames.first.length)];
      } else if (nameType.includes('last')) {
        result = fallbackNames.last[Math.floor(Math.random() * fallbackNames.last.length)];
      } else {
        result = fallbackNames.full[Math.floor(Math.random() * fallbackNames.full.length)];
      }
    }
    
    return result;
  } catch (error) {
    console.error('OpenAI error generating name:', error);
    // Fallback to simple names if API fails
    const simpleNames = ['Priya', 'Santhosh', 'James', 'Ben', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William'];
    return simpleNames[Math.floor(Math.random() * simpleNames.length)];
  }
};

const generateRealisticFraudText = async (fieldName, fieldType, validation = null) => {
  try {
    let prompt = `Generate a realistic ${fieldType} value for a fraud detection field named "${fieldName}"`;
    
    const lowerName = fieldName.toLowerCase();
    if (lowerName.includes('description')) {
      prompt = `Generate a detailed description of a realistic credit card fraud incident. Include:
      - Type of unauthorized transactions
      - Approximate amount
      - How it was discovered
      - Actions taken
      - Any suspicious patterns noticed`;
    } else if (lowerName.includes('type')) {
      prompt = 'Generate a realistic type of financial fraud (e.g., credit card fraud, identity theft, phishing scam)';
    } else if (lowerName.includes('patterns')) {
      prompt = 'Generate realistic suspicious patterns observed in fraud cases (e.g., geographic mismatch, multiple logins)';
    } else if (lowerName.includes('jurisdiction')) {
      prompt = 'Generate a realistic legal jurisdiction relevant to financial fraud cases';
    }

    if (validation?.ruleName === 'MIN_LENGTH') {
      prompt += ` with exactly ${validation.value} characters`;
    }

    prompt += ". Return only the raw value without any explanations or formatting.";

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: fieldType === 'Textarea' ? 200 : 50,
      temperature: 0.7,
    });

    let result = completion.choices[0]?.message?.content?.trim() || '';
    
    if ((result.startsWith('"') && result.endsWith('"')) || 
        (result.startsWith("'") && result.endsWith("'"))) {
      result = result.slice(1, -1);
    }
    
    return cleanValue(result, fieldType);
  } catch (error) {
    console.error('OpenAI error:', error);
    return generateFallbackText(fieldName, fieldType, validation);
  }
};

const generateRealisticCurrency = (fieldName, validation = null) => {
  let min = 100;
  let max = 10000;
  
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('loss') || lowerName.includes('amount')) {
    min = 100;
    max = 10000;
  } else if (lowerName.includes('price') || lowerName.includes('cost')) {
    min = 10;
    max = 1000;
  } else if (lowerName.includes('fee')) {
    min = 50;
    max = 500;
  }

  if (validation?.ruleName === 'GREATER_THAN') {
    const validationMin = parseFloat(validation.value);
    min = Math.max(min, validationMin);
  }

  // Generate whole number currency value
  const value = Math.floor(min + Math.random() * (max - min)).toString();
  
  return ensureUniqueValue(fieldName, value, 'Currency');
};

const generateGenericFieldValue = (fieldName, fieldType) => {
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('date')) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    return date.toISOString().split('T')[0];
  } else if (lowerName.includes('email')) {
    return `user${Math.floor(Math.random() * 1000)}@example.com`;
  } else if (lowerName.includes('phone')) {
    return `+1${Math.floor(200 + Math.random() * 800)}${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}`;
  } else if (lowerName.includes('amount') || lowerName.includes('price') || lowerName.includes('cost')) {
    return Math.floor(Math.random() * 1000).toString();
  }

  switch (fieldType) {
    case 'Text':
      return `Sample ${fieldName.replace(/_/g, ' ')} ${Math.floor(Math.random() * 100)}`;
    case 'Textarea':
      return `This is a detailed description for ${fieldName.replace(/_/g, ' ')}. It contains multiple sentences to simulate a text area input.`;
    case 'Number':
      return generateDynamicNumber(fieldName, { fieldType });
    case 'Currency':
      return generateRealisticCurrency(fieldName);
    case 'Date':
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      return date.toISOString().split('T')[0];
    case 'Email':
      return `user${Math.floor(Math.random() * 1000)}@example.com`;
    case 'Boolean':
      return Math.random() > 0.5 ? 'Yes' : 'No';
    case 'Select':
    case 'Multiselect':
    case 'Checkbox':
      return 'Option 1';
    default:
      return `Unknown field type: ${fieldType}`;
  }
};

const generateRealisticCustomerText = async (fieldName, fieldType, validation = null) => {
  try {
    let prompt = `Generate a realistic ${fieldType} value for a field named "${fieldName}"`;
    
    if (validation?.ruleName === 'MIN_LENGTH') {
      prompt += ` with exactly ${validation.value} characters`;
    }

    prompt += ". Return only the raw value without any explanations or formatting.";

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: fieldType === 'Textarea' ? 100 : 30,
      temperature: 0.7,
    });

    let result = completion.choices[0]?.message?.content?.trim() || '';
    
    if ((result.startsWith('"') && result.endsWith('"')) || 
        (result.startsWith("'") && result.endsWith("'"))) {
      result = result.slice(1, -1);
    }
    
    return cleanValue(result, fieldType);
  } catch (error) {
    console.error('OpenAI error:', error);
    return generateFallbackText(fieldName, fieldType, validation);
  }
};

const generateRealisticCustomerNumber = (fieldName, validation = null, expression = null) => {
  return generateDynamicNumber(fieldName, {
    fieldType: 'Number',
    validation,
    expression
  });
};

const generateRealisticCustomerEmail = (name = '', domain = '') => {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '.');
  const emailDomain = domain || 'example.com';
  
  let email;
  if (cleanName) {
    email = `${cleanName}${Math.floor(Math.random() * 100)}@${emailDomain}`;
  } else {
    email = `user${Math.floor(Math.random() * 1000)}@${emailDomain}`;
  }
  
  return ensureUniqueValue('email', email, 'Email');
};

const generateFieldData = async (processName, field, rowData = {}) => {
  const fieldName = field.fieldName || Object.values(field).find(val => typeof val === 'string');
  if (!fieldName) return '';

  // Handle name fields first
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('name') && field.fieldType === 'Text') {
    return await generateRealisticName(fieldName);
  }

  // Handle number fields with dynamic validation and expressions
  if (field.fieldType === 'Number') {
    return generateDynamicNumber(fieldName, field);
  }

  if ((field.fieldType === 'Select' || field.fieldType === 'Reference') && field.datasetName && field.datasetColumn) {
    const values = getDatasetValues(field.datasetName, field.datasetColumn);
    const value = getRandomValueFromList(values);
    return ensureUniqueValue(fieldName, cleanValue(value, field.fieldType), field.fieldType);
  }

  if ((field.fieldType === 'Select' || field.fieldType === 'Multiselect' || field.fieldType === 'Checkbox') && field.listName) {
    const values = getListValues(processName, field.listName);
    if (field.fieldType === 'Multiselect' || field.fieldType === 'Checkbox') {
      const count = Math.min(Math.floor(Math.random() * 3) + 1, values.length);
      const selected = [];
      const availableValues = [...values];
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availableValues.length);
        selected.push(availableValues[randomIndex]);
        availableValues.splice(randomIndex, 1);
      }
      return selected.join(', ');
    } else {
      const value = getRandomValueFromList(values);
      return ensureUniqueValue(fieldName, cleanValue(value, field.fieldType), field.fieldType);
    }
  }

  switch (processName.toLowerCase()) {
    case 'fraud detection':
      switch (field.fieldType) {
        case 'Text':
          if (lowerName.includes('description') || 
              lowerName.includes('note') ||
              lowerName.includes('comment')) {
            return await generateRealisticFraudText(fieldName, field.fieldType, field.validation);
          }
          return generateGenericFieldValue(fieldName, field.fieldType);
        case 'Textarea':
          return await generateRealisticFraudText(fieldName, field.fieldType, field.validation);
        case 'Number':
          if (lowerName.includes('severity')) {
            const severity = Math.floor(Math.random() * 10) + 1;
            return severity.toString();
          }
          return generateRealisticCustomerNumber(fieldName, field.validation, field.expression);
        case 'Currency':
          return generateRealisticCurrency(fieldName, field.validation);
        case 'Email':
          return await generateRealisticCustomerEmail(
            rowData['Client_Name'] || rowData['client_name'] || '',
            ''
          );
        default:
          return generateGenericFieldValue(fieldName, field.fieldType);
      }
    
    case 'teletherapy':
      switch (field.fieldType) {
        case 'Text':
          if (lowerName.includes('description') || 
              lowerName.includes('note') ||
              lowerName.includes('comment')) {
            return await generateRealisticCustomerText(fieldName, field.fieldType, field.validation);
          }
          return generateGenericFieldValue(fieldName, field.fieldType);
        case 'Textarea':
          return await generateRealisticCustomerText(fieldName, field.fieldType, field.validation);
        case 'Number':
          return generateRealisticCustomerNumber(fieldName, field.validation, field.expression);
        case 'Currency':
          const sessionCost = Math.floor(50 + Math.random() * 150).toString();
          return ensureUniqueValue(fieldName, sessionCost, 'Currency');
        default:
          return generateGenericFieldValue(fieldName, field.fieldType);
      }
    
    default:
      return generateGenericFieldValue(fieldName, field.fieldType);
  }
};

const generateAndSaveData = async () => {
  console.log(`Generating ${NUMBER_ROWS} rows per process`);

  for (const process of fieldsData) {
    if (!process.ProcessName || !process.Fields) {
      console.warn(`Skipping invalid process: ${JSON.stringify(process)}`);
      continue;
    }

    generatedValuesCache.clear();

    console.log(`Processing: ${process.ProcessName}`);
    
    const rows = [];
    const headers = process.Fields.map(field => 
      field.fieldName || Object.values(field).find(val => typeof val === 'string')
    ).filter(Boolean);

    for (let i = 0; i < NUMBER_ROWS; i++) {
      const row = {};
      
      // First pass: Generate all name fields
      for (const field of process.Fields) {
        const fieldName = field.fieldName || Object.values(field).find(val => typeof val === 'string');
        if (!fieldName) continue;

        const lowerName = fieldName.toLowerCase();
        if (lowerName.includes('name') && field.fieldType === 'Text') {
          try {
            row[fieldName] = await generateFieldData(process.ProcessName, field, row);
          } catch (error) {
            console.error(`Error generating name data for ${fieldName}:`, error);
            row[fieldName] = 'Error';
          }
        }
      }
      
      // Second pass: Generate all other fields
      for (const field of process.Fields) {
        const fieldName = field.fieldName || Object.values(field).find(val => typeof val === 'string');
        if (!fieldName || row[fieldName] !== undefined) continue;

        try {
          row[fieldName] = await generateFieldData(process.ProcessName, field, row);
        } catch (error) {
          console.error(`Error generating data for ${fieldName}:`, error);
          row[fieldName] = 'Error';
        }
      }

      rows.push(row);
    }

    try {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, worksheet, process.ProcessName.substring(0, 31));

      const filePath = path.join(outputPath, `${process.ProcessName.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`);
      xlsx.writeFile(workbook, filePath);
      console.log(`✅ Generated ${filePath} with ${rows.length} rows`);
    } catch (error) {
      console.error(`Error saving file for ${process.ProcessName}:`, error);
    }
  }
};

generateAndSaveData().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});