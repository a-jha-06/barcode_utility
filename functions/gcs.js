import {Storage} from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
});

const bucketName = process.env.BUCKET_NAME;
const serialsFile = "serials.json";
const auditLogFile = "audit-log.json";

/**
 * Reads a JSON file from GCS and returns its parsed contents.
 * @param {string} filename - Name of the file in the bucket.
 * @return {Promise<Object>} Parsed JSON content.
 */
async function readJsonFile(filename) {
  const file = storage.bucket(bucketName).file(filename);
  const [contents] = await file.download();
  return JSON.parse(contents.toString());
}

/**
 * Writes a JS object as JSON to a GCS file.
 * @param {string} filename - Name of the file in the bucket.
 * @param {Object} data - Data to be written to the file.
 * @return {Promise<void>}
 */
async function writeJsonFile(filename, data) {
  const file = storage.bucket(bucketName).file(filename);
  await file.save(JSON.stringify(data, null, 2), {
    contentType: "application/json",
  });
}

/**
 * Retrieves the serials from GCS.
 * @return {Promise<Object>} Parsed serials object.
 */
export async function getSerials() {
  return await readJsonFile(serialsFile);
}

/**
 * Updates the serials file with a new lastSerial for the given prefix.
 * @param {string} prefix - The prefix to update.
 * @param {number} lastSerial - The new last serial number.
 * @return {Promise<void>}
 */
export async function updateSerials(prefix, lastSerial) {
  const serials = await getSerials();
  serials[prefix] = lastSerial;
  await writeJsonFile(serialsFile, serials);
}

/**
 * Appends an entry to the audit log file.
 * @param {Object} logData - Object containing prefix, lastSerial, email, etc.
 * @return {Promise<void>}
 */
export async function appendAuditLog(logData) {
  let logs = [];
  try {
    logs = await readJsonFile(auditLogFile);
  } catch (err) {
    // If file doesn't exist, start with empty log array
  }

  logs.push(logData);
  await writeJsonFile(auditLogFile, logs);
}
