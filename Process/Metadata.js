import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load files
const template = fs.readFileSync(path.join(__dirname, '../Asset/CSV/Sample.json'), 'utf8');
const fieldsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../Asset/CSV/Fields.json'), 'utf8'));

// 2. Process each template
fieldsData.forEach(processData => {
    const processName = processData.ProcessName;
    const fields = processData.Fields;
    
    // 3. Start with exact template copy
    let output = template;

    // 4. Replace process name placeholders
    output = output.replace(/{ProcessName}/g, processName)
                 .replace(/"\{ProcessName\}"/g, `"${processName}"`)
                 .replace(/{processName}/g, processName);

    // 5. Replace field placeholders
    fields.forEach((field, index) => {
        const fieldNumber = index + 1;
        const fieldPlaceholder = `{Fields.fieldName${fieldNumber}}`;
        const fieldName = field.fieldName1 || field[`fieldName${fieldNumber}`];

        // Replace field references
        output = output.replace(new RegExp(fieldPlaceholder, 'g'), fieldName)
                     .replace(new RegExp(`"${fieldPlaceholder}"`, 'g'), `"${fieldName}"`);

        // Replace field properties
        if (field.fieldType) {
            output = output.replace(
                `"Type": "{Fields.fieldType}"`, 
                `"Type": "${field.fieldType}"`
            );
        }
        if (field.required !== undefined) {
            output = output.replace(
                `"Required": "{Fields.required}"`, 
                `"Required": ${field.required}`
            );
        }
        if (field.validation) {
            output = output.replace(
                `"Operator": "{Fields.validation.ruleName}"`, 
                `"Operator": "${field.validation.ruleName}"`
            ).replace(
                `"RHSValue": "{Fields.validation.value}"`, 
                `"RHSValue": ${field.validation.value}`
            ).replace(
                `"ErrorMessage": "{Fields.validation.validationMessage}"`, 
                `"ErrorMessage": "${field.validation.validationMessage}"`
            );
        }
        if (field.datasetName) {
            output = output.replace(
                `"LHSModel": "{Fields.datasetName}"`, 
                `"LHSModel": "${field.datasetName}"`
            );
        }
        if (field.datasetColumn) {
            output = output.replace(
                `"Name": "{Fields.datasetColumn}"`, 
                `"Name": "${field.datasetColumn}"`
            );
        }
        if (field.columnType) {
            output = output.replace(
                `"Type": "{Fields.columnType}"`, 
                `"Type": "${field.columnType}"`
            );
        }
        if (field.listName) {
            output = output.replace(
                `"ReferredList": "{Fields.listName}"`, 
                `"ReferredList": "${field.listName}"`
            );
        }
    });

    // 6. Save output
    const outputPath = path.join(__dirname, '../Asset/CSV/Processed', `${processName}.json`);
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    fs.writeFileSync(outputPath, output);
    console.log(`Generated ${processName}.json with exact template structure`);
});