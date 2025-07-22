import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import {
  getSerials,
  updateSerials,
  appendAuditLog,
} from "./gcs.js";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(
      JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
  ),
});

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Middleware to verify Firebase ID token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @return {void}
 */
async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).send("No token provided");
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send("Invalid token");
  }
}

/**
 * Export handler to return serials.json
 */
app.get("/api/serials", verifyFirebaseToken, async (req, res) => {
  try {
    const serials = await getSerials();
    res.json(serials);
  } catch (err) {
    res.status(500).send("Failed to retrieve serials");
  }
});

/**
 * Updates serials and appends audit log.
 */
app.post("/api/update", verifyFirebaseToken, async (req, res) => {
  const {prefix, lastSerial} = req.body;
  const email = req.user?.email;

  if (!prefix || typeof lastSerial !== "number") {
    return res.status(400).send("Invalid input");
  }

  try {
    await updateSerials(prefix, lastSerial);
    await appendAuditLog({
      prefix,
      lastSerial,
      email,
      timestamp: new Date().toISOString(),
    });
    res.send("Update successful");
  } catch (err) {
    res.status(500).send("Update failed");
  }
});

export {app};
