import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import moment from 'moment';
import { parse } from 'json2csv';

import { getSerials, updateSerials, getFileFromGCS } from './gcs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

/**
 * Export CSV API
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
app.get('/export-csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const auditContent = await getFileFromGCS('audit.json');
    const logs = JSON.parse(auditContent);

    console.log("Received startDate:", startDate);
    console.log("Received endDate:", endDate);
    console.log("Total logs in audit:", logs.length);

    const filtered = logs.filter(entry => {
      const ts = moment(entry.timestamp);
      return ts.isBetween(startDate, endDate, undefined, '[]');
    });

    console.log("Filtered logs:", filtered.length);

    if (!filtered.length) {
      return res.status(404).json({ error: 'No data found in this range' });
    }

    const csv = parse(filtered);
    res.header('Content-Type', 'text/csv');
    res.attachment('barcode-export.csv');
    res.send(csv);
  } catch (err) {
    console.error('CSV Export Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Get last serial for a given prefix
 */
app.get('/api/last-serial/:prefix', async (req, res) => {
  try {
    const prefix = req.params.prefix;
    const serials = await getSerials();
    const lastSerial = serials[prefix] || 0;
    res.json({ lastSerial });
  } catch (err) {
    console.error('Error getting last serial:', err);
    res.status(500).json({ error: 'Failed to retrieve serials' });
  }
});

/**
 * Barcode generation endpoint
 */
app.post('/api/barcodes', async (req, res) => {
  try {
    const { skuPrefix, po, barcodeNumber, quantity, startSerial } = req.body;
    console.log('Request body:', req.body);

    if (!skuPrefix || !barcodeNumber || quantity <= 0 || isNaN(startSerial)) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    const barcodes = [];
    for (let i = 0; i < quantity; i++) {
      const serial = startSerial + i;
      barcodes.push({
        barcodeValue: `${skuPrefix}-${serial}`,
        barcodeNumber,
        serial,
        po,
        timestamp: new Date().toISOString(), // Add timestamp for audit
      });
    }

    const finalSerial = startSerial + quantity - 1;
    await updateSerials(skuPrefix, finalSerial);

    res.json({ barcodes, lastSerial: finalSerial });
  } catch (err) {
    console.error('Error generating barcodes:', err);
    res.status(500).json({ error: 'Could not generate barcodes' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
