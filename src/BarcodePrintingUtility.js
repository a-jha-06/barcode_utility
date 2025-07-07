import React, { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import JsBarcode from "jsbarcode";

export default function App() {
  const [user, setUser] = useState(null);
  const [sku, setSku] = useState("");
  const [po, setPo] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [startSerial, setStartSerial] = useState("");
  const [barcodes, setBarcodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [lastSerial, setLastSerial] = useState(0);

  // Load last serial when SKU changes
  useEffect(() => {
    if (sku) {
      const savedSerial = localStorage.getItem(`lastSerial-${sku}`);
      setLastSerial(savedSerial ? parseInt(savedSerial) : 0);
    } else {
      setLastSerial(0);
    }
  }, [sku]);

  // Generate barcodes
  const generateBarcodes = () => {
    if (!sku || quantity <= 0) {
      setError("SKU and Quantity required.");
      return;
    }
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    const serialStart = startSerial ? parseInt(startSerial) : lastSerial + 1;
    const newSerials = Array.from(
      { length: quantity },
      (_, i) => `${sku}-${serialStart + i}`
    );
    setBarcodes(newSerials);

    const newLastSerial = serialStart + quantity - 1;
    localStorage.setItem(`lastSerial-${sku}`, newLastSerial);
    setLastSerial(newLastSerial);

    const newLog = {
      sku,
      po,
      quantity,
      startSerial: serialStart,
      barcodes: newSerials,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, newLog]);

    setError("");
  };

  // Render barcodes
  useEffect(() => {
    barcodes.forEach((code) => {
      JsBarcode(`#barcode-${code}`, code, {
        format: "CODE128",
        displayValue: true,
        width: 2,
        height: 40,
      });
    });
  }, [barcodes]);

  const handlePrint = () => {
    if (!user) {
      setError("Please sign in first.");
      return;
    }
    if (barcodes.length === 0) {
      setError("Please generate barcodes first.");
      return;
    }
    window.print();
  };

  const handleExport = () => {
    const from = prompt("Enter start date (YYYY-MM-DD):");
    const to = prompt("Enter end date (YYYY-MM-DD):");

    if (!from || !to) {
      alert("Invalid date range.");
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= fromDate && logDate <= toDate;
    });

    const csvHeader = "SKU,PO,Serial,Timestamp\n";
    const rows = filteredLogs
      .flatMap((log) =>
        log.barcodes.map(
          (barcode) =>
            `${log.sku},${log.po},${barcode},${log.timestamp}`
        )
      )
      .join("\n");

    const blob = new Blob([csvHeader + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcodes_${from}_${to}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", position: "relative" }}>
      {/* Logo/Header */}
      <h2 style={{ textAlign: "center", letterSpacing: "5px" }}>PALMONAS</h2>
      <h1 style={{ textAlign: "center" }}>Barcode Printing Utility</h1>

      {/* Sign In/Out */}
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        {user ? (
          <button onClick={() => { googleLogout(); setUser(null); }}>
            Sign Out
          </button>
        ) : (
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const decoded = jwtDecode(credentialResponse.credential);
              setUser(decoded);
            }}
            onError={() => console.log("Login Failed")}
          />
        )}
      </div>

      {/* Form Inputs */}
      <div style={{ marginTop: "40px", maxWidth: "400px" }}>
        <div>
          <label>SKU :</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            disabled={!user}
            style={{ width: "100%", margin: "5px 0" }}
          />
        </div>
        <div>
          <label>Start Serial :</label>
          <input
            value={startSerial}
            onChange={(e) => setStartSerial(e.target.value)}
            disabled={!user}
            style={{ width: "100%", margin: "5px 0" }}
          />
        </div>
        <div>
          <label>Quantity :</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            disabled={!user}
            style={{ width: "100%", margin: "5px 0" }}
          />
        </div>
        <div>
          <label>PO Number :</label>
          <input
            value={po}
            onChange={(e) => setPo(e.target.value)}
            disabled={!user}
            style={{ width: "100%", margin: "5px 0" }}
          />
        </div>

        <div>
          <label>Printer :</label>
          <select style={{ width: "100%", margin: "5px 0" }}>
            <option>Default Printer</option>
          </select>
        </div>

        <p>Last Serial Printed : {sku ? lastSerial : "N/A"}</p>

        <button onClick={generateBarcodes} disabled={!user}>
          Generate Barcodes
        </button>
        <button onClick={handlePrint} disabled={!user}>
          Print Barcodes
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* Preview */}
      <h4>Preview :</h4>
      <div className="barcode-preview">
        {barcodes.map((code) => (
          <svg key={code} id={`barcode-${code}`}></svg>
        ))}
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          background: "#f88",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Data Export Button
      </button>

      <style>{`
        @media print {
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .barcode-preview, .barcode-preview * {
            visibility: visible;
          }
          .barcode-preview {
            position: absolute;
            left: 0;
            top: 0;
          }
          svg {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
