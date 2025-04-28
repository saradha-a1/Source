import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const folderPath = path.join(__dirname, '../Asset/CSV');
const inputFile = path.join(folderPath, 'output.json');
const fieldsFile = path.join(folderPath, 'Fields.json');
const datasetListFile = path.join(folderPath, 'Dataset_list.json');

// Check if input file exists before reading
if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file does not exist at ${inputFile}`);
    process.exit(1);
}

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);

        // Initialize arrays to store processed data
        const fieldsData = [];
        const datasetListData = [];

        // Iterate over each process in the JSON data
        for (const processKey in jsonData) {
            if (jsonData.hasOwnProperty(processKey)) {
                const process = jsonData[processKey];

                // Extract Fields data
                fieldsData.push({
                    ProcessName: process.ProcessName,
                    Fields: process.Fields
                });

                // Extract Datasets and Lists data
                datasetListData.push({
                    ProcessName: process.ProcessName,
                    Datasets: process.Datasets,
                    Lists: process.Lists
                });
            }
        }

        // Write Fields.json
        fs.writeFile(fieldsFile, JSON.stringify(fieldsData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing Fields.json:', err);
                return;
            }
            console.log(`Fields.json has been saved at ${fieldsFile}`);
        });

        // Write Dataset_list.json
        fs.writeFile(datasetListFile, JSON.stringify(datasetListData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing Dataset_list.json:', err);
                return;
            }
            console.log(`Dataset_list.json has been saved at ${datasetListFile}`);
        });
    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
});