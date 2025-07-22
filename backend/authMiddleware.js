import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("❌ SERVICE_ACCOUNT_JSON is missing or empty.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  });
}

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split('Bearer ')[1];

  if (!token) return res.status(401).send("No token provided");

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(403).send("Invalid token");
  }
}
