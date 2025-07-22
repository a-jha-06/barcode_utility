import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
dotenv.config();

const {
  GCP_PROJECT_ID,
  GCP_CLIENT_EMAIL,
  GCP_PRIVATE_KEY,
  GCS_BUCKET_NAME
} = process.env;

if (!GCP_PROJECT_ID || !GCP_CLIENT_EMAIL || !GCP_PRIVATE_KEY || !GCS_BUCKET_NAME) {
  throw new Error("Missing GCP environment variables");
}

// Initialize GCS client
const storage = new Storage({
  projectId: GCP_PROJECT_ID,
  credentials: {
    client_email: GCP_CLIENT_EMAIL,
    private_key: GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(GCS_BUCKET_NAME);
const SERIALS_FILE = 'serials.json';

export async function getFileFromGCS(fileName) {
  const file = bucket.file(fileName);
  const [contents] = await file.download();
  return contents.toString('utf-8');
}

export async function getSerials() {
  try {
    const file = bucket.file(SERIALS_FILE);
    const [exists] = await file.exists();
    if (!exists) {
      await file.save(JSON.stringify({}), { contentType: 'application/json' });
      return {};
    }

    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  } catch (err) {
    console.error('Error reading serials from GCS:', err);
    throw err;
  }
}

export async function updateSerials(prefix, lastSerial) {
  try {
    const serials = await getSerials();
    serials[prefix] = lastSerial;

    const file = bucket.file(SERIALS_FILE);
    await file.save(JSON.stringify(serials, null, 2), {
      contentType: 'application/json'
    });
  } catch (err) {
    console.error('Error updating serials in GCS:', err);
    throw err;
  }
}
