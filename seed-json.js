const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  const data = {
    users: [
      {
        id: crypto.randomUUID(),
        name: 'Admin',
        username: 'admin',
        password: hash,
        isAdmin: true,
        createdAt: new Date().toISOString()
      }
    ],
    teams: [],
    votes: []
  };
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('Seed complete.');
}

seed();
