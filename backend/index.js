import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { getSerials, updateSerials, appendAuditLog } from './storage.js';
import { verifyFirebaseToken } from './authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API: Get last serial for a prefix
app.get('/api/last-serial/:prefix', async (req, res) => {
  try {
    const prefix = req.params.prefix;
    const serials = await getSerials();
    const last = serials[prefix] || 0;
    res.json({ lastSerial: last });
  } catch (err) {
    console.error('❌ Error in GET /last-serial:', err);
    res.status(500).json({ error: 'Failed to fetch last serial' });
  }
});

// API: Generate barcodes (requires auth)
app.post('/api/barcodes', verifyFirebaseToken, async (req, res) => {
  try {
    const { skuPrefix, po, barcodeNumber, quantity, startSerial } = req.body;
    const userEmail = req.user.email;

    if (!skuPrefix || !quantity || !startSerial || !barcodeNumber || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const barcodes = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      const barcodeValue = `${skuPrefix}-${serial}`;
      barcodes.push({ barcodeValue, barcodeNumber, po, serial });
    }

    // Audit log entry
    await appendAuditLog({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      user: userEmail,
      skuPrefix,
      po,
      barcodeNumber,
      quantity,
      startSerial,
      endSerial: startSerial + quantity - 1,
    });

    // Update serials.json
    await updateSerials(skuPrefix, startSerial + quantity - 1);

    res.json({ barcodes, lastSerial: startSerial + quantity - 1 });
  } catch (err) {
    console.error('❌ Error in POST /barcodes:', err);
    res.status(500).json({ error: 'Failed to generate barcodes' });
  }
});

// CSV export (no auth)
app.get('/export-csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).send('Missing date range');
    }

    const { getFileFromGCS } = await import('./storage.js');
    const raw = await getFileFromGCS('audit.json');
    const logs = JSON.parse(raw);

    const filtered = logs.filter((log) => {
      const ts = new Date(log.timestamp);
      return ts >= new Date(startDate) && ts <= new Date(endDate);
    });

    const headers = Object.keys(filtered[0] || {});
    const rows = filtered.map((log) =>
      headers.map((key) => `"${(log[key] || '').toString().replace(/"/g, '""')}"`).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=barcodes.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ Error in GET /export-csv:', err);
    res.status(500).send('Failed to export data');
  }
});
app.use(cors({
  origin: ['http://localhost:3000', 'https://barcode-printing-utility.web.app'], // allow frontend
  methods: ['GET', 'POST'],
  credentials: true,
}));
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
