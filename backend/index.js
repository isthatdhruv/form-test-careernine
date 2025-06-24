const express = require('express');
const { google }  = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

async function getGoogleSheetsClient() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    let auth;
    if (process.env.GOOGLE_CREDENTIALS) {
        // Parse credentials from environment variable
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS.replace(/\\n/g, '\n'));
        auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: scopes,
        });
    } else {
        // Fallback to local file for development
        auth = new google.auth.GoogleAuth({
            keyFile: 'credentials.json',
            scopes: scopes,
        });
    }
    // Create a client instance for authentication
    const authClient = await auth.getClient();
    // Create the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    return sheets;
}

// --- API Endpoint ---
// Define a POST route to handle form submissions
app.post('/submit', async (req, res) => {
    try {
        console.log('Received form submission:', req.body);
        const { name, email, phone, class: classkonsi, school } = req.body;

        // --- Validate Input ---
        if (!name || !email || !phone || !classkonsi || !school) {
            return res.status(400).json({ message: 'Missing required fields (name, email, phone, class, school).' });
        }

        const sheets = await getGoogleSheetsClient();

        const spreadsheetId = process.env.SHEET_ID; // e.g., '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z'
        
        const range = 'Sheet1'; // e.g., 'Sheet1' or 'Submissions'

        const timestamp = new Date().toISOString();

        const values = [[timestamp, name, email, phone, classkonsi, school]];

        // --- Append Data to the Sheet ---
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED', // How the input data should be interpreted
            requestBody: {
                values: values,
            },
        });
        
        console.log('Google Sheets API response:', response.data);

        // --- Send Success Response ---
        res.status(200).json({ message: 'Form data submitted successfully!', data: response.data });

    } catch (error) {
        console.error('Error processing request:', error);
        
        // Check for specific Google API errors
        if (error.response) {
            console.error('Google API Error Details:', error.response.data.error);
             res.status(500).json({ message: 'Error writing to Google Sheets.', error: error.response.data.error });
        } else {
             res.status(500).json({ message: 'An internal server error occurred.' });
        }
    }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});