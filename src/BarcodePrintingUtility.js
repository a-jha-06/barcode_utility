import React, { useState } from 'react';

export default function BarcodePrintingUtility() {
  const [sku, setSku] = useState('');
  const [startSerial, setStartSerial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [printer, setPrinter] = useState('OneNote (Desktop) - Protected');

  const handlePrintBarcodes = () => {
    // Implement your barcode printing logic here
    alert(`Printing ${quantity} barcodes for SKU ${sku} starting at serial ${startSerial} using ${printer}`);
  };

  const handleSignInOut = () => {
    // Implement sign in/out logic here
    alert('Sign In/Sign Out clicked');
  };

  const handleDataExport = () => {
    // Implement data export logic here
    alert('Data Export clicked');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>PALMONAS <span style={styles.subHeader}>Barcode Printing Utility</span></h1>

      <div style={styles.formGroup}>
        <label>SKU:</label>
        <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>

      <div style={styles.formGroup}>
        <label>Start Serial:</label>
        <input type="text" value={startSerial} onChange={(e) => setStartSerial(e.target.value)} />
      </div>

      <div style={styles.formGroup}>
        <label>Quantity:</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>

      <div style={styles.formGroup}>
        <label>Printer:</label>
        <select value={printer} onChange={(e) => setPrinter(e.target.value)}>
          <option value="OneNote (Desktop) - Protected">OneNote (Desktop) - Protected</option>
          <option value="Printer 1">Printer 1</option>
          <option value="Printer 2">Printer 2</option>
          {/* Add more printers here */}
        </select>
      </div>

      <p>Last Serial Printed: N/A</p>

      <button onClick={handlePrintBarcodes}>Print Barcodes</button>

      <div style={{ marginTop: '10px' }}>
        <a href="#preview">Preview</a>
      </div>

      <button style={styles.exportButton} onClick={handleDataExport}>Data Export Button</button>

      <button style={styles.signInButton} onClick={handleSignInOut}>Sign In/Sign Out</button>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffe6e6',
    padding: '20px',
    width: '400px',
    borderRadius: '10px',
    fontFamily: 'sans-serif',
    position: 'relative',
  },
  header: {
    marginBottom: '10px',
  },
  subHeader: {
    fontStyle: 'italic',
    fontSize: '0.8em',
  },
  formGroup: {
    marginBottom: '10px',
  },
  exportButton: {
    marginTop: '20px',
    backgroundColor: '#f99',
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
  },
  signInButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: '#f99',
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
  },
};
