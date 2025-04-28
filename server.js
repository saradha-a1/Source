import express from 'express';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to run USER scripts
app.post('/run-user-scripts', async (req, res) => {
  const { BASE_URL, ACCOUNT_ID, ACCESS_KEY_ID, ACCESS_KEY_SECRET, USER_COUNT, ADMIN_EMAILS } = req.body;

  if (!BASE_URL || !ACCOUNT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !USER_COUNT || !ADMIN_EMAILS) {
    return res.status(400).send('Missing required environment variables');
  }

  // Set environment variables for USER task
  const env = {
    BASE_URL,
    ACCOUNT_ID,
    ACCESS_KEY_ID,
    ACCESS_KEY_SECRET,
    USER_COUNT,
    ADMIN_EMAILS: ADMIN_EMAILS.join(','), // Convert array to comma-separated string
    TASK: 'USER',
  };

  executeScript(res, env, [
    path.join(__dirname, 'User/Adduser.js'),
    path.join(__dirname, 'User/Activate.js'),
  ]);
});

// Endpoint to run Process & Form Fields scripts
app.post('/run-process-form-fields-scripts', async (req, res) => {
  const { DOMAIN_NAME, PROCESS_COUNT, GROQ_API_KEY } = req.body;

  if (!DOMAIN_NAME || !PROCESS_COUNT) {
    return res.status(400).send('Missing required fields: DOMAIN_NAME or PROCESS_COUNT');
  }

  // Set environment variables for Process & Form Fields task
  const env = {
    DOMAIN_NAME,
    PROCESS_COUNT,
    GROQ_API_KEY,
    TASK: 'PROCESS_FORM_FIELDS',
  };

  executeScript(res, env, [
    path.join(__dirname, 'Process/Domain.js'),
    path.join(__dirname, 'Process/form.js'),
    path.join(__dirname, 'Process/Jsonextract.js'),
  ]);
});

// Endpoint to run Dataset & List scripts
app.post('/run-dataset-list-scripts', async (req, res) => {
  const { BASE_URL, ACCOUNT_ID, ACCESS_KEY_ID, ACCESS_KEY_SECRET, EMAIL, PASSWORD } = req.body;

  if (!BASE_URL || !ACCOUNT_ID || !ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !EMAIL || !PASSWORD) {
    return res.status(400).send('Missing required fields');
  }

  // Set environment variables for Dataset & List task
  const env = {
    BASE_URL,
    ACCOUNT_ID,
    ACCESS_KEY_ID,
    ACCESS_KEY_SECRET,
    EMAIL,
    PASSWORD,
    TASK: 'DATASET_LIST',
  };

  executeScript(res, env, [
    path.join(__dirname, 'Dataset/Dataset.js'),
    path.join(__dirname, 'Dataset/Datagen.js'),
    path.join(__dirname, 'Dataset/Column.js'),
    path.join(__dirname, 'Dataset/Import.js'),
    path.join(__dirname, 'Lists/List.js'),
    path.join(__dirname, 'Lists/listitems.js'),
  ]);
});
// Function to execute scripts
function executeScript(res, env, scriptPaths) {
  console.log('Environment Variables:', env);

  const executeNextScript = (index) => {
    if (index >= scriptPaths.length) {
      res.write('All scripts executed.\n');
      res.end();
      return;
    }

    const script = scriptPaths[index];
    const command = `node ${script}`;
    console.log(`Executing: ${command}`);

    const child = exec(command, { env: { ...process.env, ...env }, cwd: __dirname });

    child.stdout.on('data', data => {
      console.log(data);
      res.write(data);
    });

    child.stderr.on('data', data => {
      console.error(`[ERROR] ${data}`);
      res.write(`[ERROR] ${data}`);
    });

    child.on('close', code => {
      if (code !== 0) {
        console.error(`Script ${script} failed with code ${code}`);
        res.write(`Script ${script} failed with code ${code}\n`);
      }

      // Capture the output file paths (if any) and send them to the frontend
      const outputFiles = [
        path.join(__dirname, 'Asset', 'CSV', 'ProcessName.csv'),
        path.join(__dirname, 'Asset', 'CSV', 'output.json'),
        path.join(__dirname, 'Asset', 'CSV', 'Dataset.csv'),
        path.join(__dirname, 'Asset', 'CSV', 'List.csv'),
      ];

      const outputDocumentsPath = path.join(__dirname, 'OutputDocuments');
      if (!fs.existsSync(outputDocumentsPath)) {
        fs.mkdirSync(outputDocumentsPath, { recursive: true });
      }

      outputFiles.forEach(outputFilePath => {
        if (fs.existsSync(outputFilePath)) {
          const fileName = path.basename(outputFilePath);
          const newFilePath = path.join(outputDocumentsPath, fileName);

          // Only copy the file if it doesn't already exist
          if (!fs.existsSync(newFilePath)) {
            fs.copyFileSync(outputFilePath, newFilePath);
            res.write(`Output file copied to: ${newFilePath}\n`);
          } else {
            res.write(`Output file already exists: ${newFilePath}\n`);
          }
        }
      });

      executeNextScript(index + 1); // Execute the next script
    });
  };

  executeNextScript(0); // Start executing scripts
}

// Endpoint to list files in the Output Documents folder
app.get('/output-documents', (req, res) => {
  const outputDocumentsPath = path.join(__dirname, 'OutputDocuments');
  if (!fs.existsSync(outputDocumentsPath)) {
    return res.status(404).json({ error: 'Output Documents folder not found' });
  }

  const files = fs.readdirSync(outputDocumentsPath).map(file => {
    const filePath = path.join(outputDocumentsPath, file);
    const stats = fs.statSync(filePath);
    const date = new Date(stats.mtime).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    return {
      name: file,
      path: filePath,
      date: date,
    };
  });
  res.json(files);
});

// Endpoint to download a file from the Output Documents folder
app.get('/output-documents/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'OutputDocuments', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  res.download(filePath);
});

// Endpoint to clear all documents in the Output Documents folder
app.post('/clear-output-documents', (req, res) => {
  const outputDocumentsPath = path.join(__dirname, 'OutputDocuments');
  if (!fs.existsSync(outputDocumentsPath)) {
    return res.status(404).send('Output Documents folder not found');
  }

  // Delete all files in the folder
  fs.readdirSync(outputDocumentsPath).forEach(file => {
    const filePath = path.join(outputDocumentsPath, file);
    fs.unlinkSync(filePath);
  });

  res.send('All documents cleared successfully');
});

// Start the server
const IP_ADDRESS = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server running on:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://${getLocalIpAddress()}:${PORT}`);
});

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const address of interfaces[interfaceName]) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}