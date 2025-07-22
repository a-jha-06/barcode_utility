import React, { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import JsBarcode from "jsbarcode";
import "./App.css";

function BarcodePrintingUtility() {
  const [user, setUser] = useState(null);
  const [skuPrefix, setSkuPrefix] = useState("");
  const [startSerial, setStartSerial] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [po, setPo] = useState("");
  const [barcodeNumber, setBarcodeNumber] = useState("");
  const [barcodes, setBarcodes] = useState([]);
  const [error, setError] = useState("");
  const [lastSerial, setLastSerial] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!skuPrefix) return;
    fetch(`http://localhost:5000/api/last-serial/${skuPrefix}`)
      .then((res) => res.json())
      .then((data) => {
        const last = parseInt(data.lastSerial || 0);
        setLastSerial(last);
        setStartSerial(last + 1);
      })
      .catch(() => {
        setLastSerial(0);
        setStartSerial(1);
      });
  }, [skuPrefix]);

  const generateBarcodes = async () => {
    setError("");
    if (!skuPrefix || quantity <= 0 || !barcodeNumber || !user) {
      setError("Fill all fields and sign in.");
      return;
    }

    const payload = {
      skuPrefix,
      po,
      barcodeNumber,
      quantity,
      startSerial: parseInt(startSerial),
    };

    try {
      const res = await fetch("http://localhost:5000/api/barcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.barcodes) {
        setBarcodes(data.barcodes);
        setLastSerial(data.lastSerial);
        setStartSerial(data.lastSerial + 1);
      } else {
        setError("Failed to generate barcodes.");
      }
    } catch {
      setError("Server error.");
    }
  };

  const handlePrint = () => {
  if (!user) return setError("Please sign in.");
  if (!barcodes.length) return setError("Generate barcodes first.");

  // Give the DOM a chance to render before triggering print
  setTimeout(() => {
    window.print();
  }, 500); // Delay can be adjusted as needed
};


  const handleExportCSV = () => {
    if (!startDate || !endDate) {
      alert("Select both start and end dates");
      return;
    }

    fetch(
      `http://localhost:5000/export-csv?startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Export failed or no data found.");
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "barcodes.csv";
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message));
  };

  useEffect(() => {
    barcodes.forEach((b) => {
      JsBarcode(`#barcode-${b.barcodeValue}`, b.barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1.2,
        height: 38,
        margin: 0,
      });
    });
  }, [barcodes]);

  return (
    <div className="container">
      <h2 style={{ textAlign: "center" }}>PALMONAS</h2>
      <h1 style={{ textAlign: "center" }}>Barcode Printing Utility</h1>

      {/* Google Auth */}
      <div className="auth-button">
        {user ? (
          <button onClick={() => { googleLogout(); setUser(null); }}>Sign Out</button>
        ) : (
          <GoogleLogin
            onSuccess={(res) => setUser(jwtDecode(res.credential))}
            onError={() => setError("Login Failed")}
          />
        )}
      </div>

      {/* Input Form */}
      <div className="card">
        <label>SKU Prefix:</label>
        <input
          value={skuPrefix}
          onChange={(e) => setSkuPrefix(e.target.value)}
          disabled={!user}
        />

        <label>Start Serial:</label>
        <input
          value={startSerial}
          onChange={(e) => setStartSerial(e.target.value)}
          disabled={!user}
        />

        <label>Quantity:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          disabled={!user}
        />

        <label>PO Number:</label>
        <input
          value={po}
          onChange={(e) => setPo(e.target.value)}
          disabled={!user}
        />

        <label>Barcode Number:</label>
        <input
          value={barcodeNumber}
          onChange={(e) => setBarcodeNumber(e.target.value)}
          disabled={!user}
        />

        <p>Last Serial Printed: {lastSerial}</p>

        <button onClick={generateBarcodes} disabled={!user}>
          Generate Barcodes
        </button>
       

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

     

      {/* Barcode Preview */}
      <h4>Preview:</h4>
      <div className="barcode-preview">
        {barcodes.map((b) => (
          <div className="barcode-label" key={b.barcodeValue}>
            <svg id={`barcode-${b.barcodeValue}`}></svg>
            <div className="sku-text">{b.barcodeValue}</div>
            <div className="barcode-number">{b.barcodeNumber}</div>
          </div>
        ))}
      </div>
     {barcodes.length > 0 && (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <button onClick={handlePrint}>Print Barcodes</button>
  </div>
)}

 {/* CSV Export */}
      <div className="card">
        <h4>Export CSV</h4>
        <label>Start Date:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={handleExportCSV}>Export</button>
      </div>
    </div>
  );
}

export default BarcodePrintingUtility;
