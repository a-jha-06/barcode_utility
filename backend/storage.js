import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
dotenv.config();

const {
  GCP_PROJECT_ID,
  GCP_CLIENT_EMAIL,
  GCP_PRIVATE_KEY,
  GCS_BUCKET_NAME,
} = process.env;

if (!GCP_PROJECT_ID || !GCP_CLIENT_EMAIL || !GCP_PRIVATE_KEY || !GCS_BUCKET_NAME) {
  throw new Error("❌ Missing one or more GCP environment variables.");
}

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: GCP_PROJECT_ID,
  credentials: {
    client_email: GCP_CLIENT_EMAIL,
    private_key: GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(GCS_BUCKET_NAME);

const SERIALS_FILE = 'serials.json';
const AUDIT_FILE = 'audit.json';

/**
 * Generic file reader from GCS
 */
export async function getFileFromGCS(fileName) {
  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();

    if (!exists) {
      console.warn(`⚠️ File ${fileName} not found. Creating empty file.`);
      await file.save(JSON.stringify([]), { contentType: 'application/json' });
      return '[]';
    }

    const [contents] = await file.download();
    return contents.toString('utf-8');
  } catch (err) {
    console.error(`❌ Error reading ${fileName} from GCS:`, err);
    throw err;
  }
}

/**
 * Generic file writer to GCS
 */
export async function saveFileToGCS(fileName, data) {
  try {
    const file = bucket.file(fileName);
    await file.save(data, { contentType: 'application/json' });
  } catch (err) {
    console.error(`❌ Error saving ${fileName} to GCS:`, err);
    throw err;
  }
}

/**
 * Get serials.json content as an object
 */
export async function getSerials() {
  try {
    const raw = await getFileFromGCS(SERIALS_FILE);
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Error parsing serials file:', err);
    return {};
  }
}

/**
 * Update serials.json with latest prefix and serial
 */
export async function updateSerials(prefix, lastSerial) {
  try {
    const serials = await getSerials();
    serials[prefix] = lastSerial;
    await saveFileToGCS(SERIALS_FILE, JSON.stringify(serials, null, 2));
  } catch (err) {
    console.error('❌ Error updating serials in GCS:', err);
    throw err;
  }
}

/**
 * Append a log entry to audit.json
 */
export async function appendAuditLog(entry) {
  try {
    const raw = await getFileFromGCS(AUDIT_FILE);
    const logs = JSON.parse(raw);
    logs.push(entry);
    await saveFileToGCS(AUDIT_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('❌ Error appending to audit log:', err);
    throw err;
  }
}
