const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
    console.error("Missing Google Sheets environment variables in .env.local");
    process.exit(1);
  }

  console.log("Connecting to Google Sheets...");

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
  
  try {
    await doc.loadInfo();
    console.log(`Connected to spreadsheet: ${doc.title}`);

    // Create Users Sheet
    let usersSheet = doc.sheetsByTitle['Users'];
    if (!usersSheet) {
      usersSheet = await doc.addSheet({ title: 'Users', headerValues: ['id', 'name', 'username', 'password', 'isAdmin', 'createdAt'] });
      console.log('Created Users sheet.');
    } else {
      await usersSheet.setHeaderRow(['id', 'name', 'username', 'password', 'isAdmin', 'createdAt']);
    }

    // Create Teams Sheet
    let teamsSheet = doc.sheetsByTitle['Teams'];
    if (!teamsSheet) {
      teamsSheet = await doc.addSheet({ title: 'Teams', headerValues: ['id', 'name', 'createdAt'] });
      console.log('Created Teams sheet.');
    } else {
      await teamsSheet.setHeaderRow(['id', 'name', 'createdAt']);
    }

    // Create Votes Sheet
    let votesSheet = doc.sheetsByTitle['Votes'];
    if (!votesSheet) {
      votesSheet = await doc.addSheet({ title: 'Votes', headerValues: ['id', 'rating', 'voterName', 'sessionId', 'ipAddress', 'teamId', 'createdAt'] });
      console.log('Created Votes sheet.');
    } else {
      await votesSheet.setHeaderRow(['id', 'rating', 'voterName', 'sessionId', 'ipAddress', 'teamId', 'createdAt']);
    }

    // Check if admin exists
    const userRows = await usersSheet.getRows();
    const adminExists = userRows.find(r => r.get('username') === 'admin');

    if (!adminExists) {
      console.log('Creating default admin account...');
      const hash = await bcrypt.hash('admin123', 10);
      await usersSheet.addRow({
        id: crypto.randomUUID(),
        name: 'Admin',
        username: 'admin',
        password: hash,
        isAdmin: 'TRUE',
        createdAt: new Date().toISOString()
      });
      console.log('Admin account created! (admin / admin123)');
    } else {
      console.log('Admin account already exists.');
    }

    console.log('Seed complete! Your Google Sheet is ready.');

  } catch (error) {
    console.error("Failed to connect or seed:", error);
  }
}

seed();
