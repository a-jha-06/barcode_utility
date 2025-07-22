import fs from 'fs/promises';
import path from 'path';

const serials = {
  ABC: 1000,
  DEF: 2000,
  XYZ: 3000
};

const filePath = path.join(process.cwd(), 'backend', 'serials.json');

async function seedSerials() {
  try {
    await fs.writeFile(filePath, JSON.stringify(serials, null, 2));
    console.log(`✅ Serial numbers seeded successfully to ${filePath}`);
  } catch (err) {
    console.error('❌ Failed to seed serials:', err);
  }
}

seedSerials();
