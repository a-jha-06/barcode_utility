import React, { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import JsBarcode from "jsbarcode";

export default function App() {
  const [user, setUser] = useState(null);
  const [skuPrefix, setSkuPrefix] = useState(""); // only the prefix
  const [po, setPo] = useState("");
  const [barcodeNumber, setBarcodeNumber] = useState(""); // same for all
  const [quantity, setQuantity] = useState(1);
  const [startSerial, setStartSerial] = useState("");
  const [barcodes, setBarcodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [lastSerial, setLastSerial] = useState(0);

  // Load last serial on SKU prefix change
  useEffect(() => {
    if (skuPrefix) {
      const savedSerial = localStorage.getItem(`lastSerial-${skuPrefix}`);
      setLastSerial(savedSerial ? parseInt(savedSerial) : 0);
    } else {
      setLastSerial(0);
    }
  }, [skuPrefix]);

  const generateBarcodes = () => {
    if (!skuPrefix || quantity <= 0) {
      setError("SKU Prefix and Quantity are required.");
      return;
    }
    if (!barcodeNumber) {
      setError("Barcode Number is required.");
      return;
    }
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    const serialStart = startSerial ? parseInt(startSerial) : lastSerial + 1;
    const newBarcodes = Array.from({ length: quantity }, (_, i) => {
      const serial = serialStart + i;
      const barcodeValue = `${skuPrefix}-${serial}`;
      return {
        barcodeValue,
        barcodeNumber,
      };
    });

    setBarcodes(newBarcodes);

    const newLastSerial = serialStart + quantity - 1;
    localStorage.setItem(`lastSerial-${skuPrefix}`, newLastSerial);
    setLastSerial(newLastSerial);

    const newLog = {
      skuPrefix,
      po,
      barcodeNumber,
      quantity,
      startSerial: serialStart,
      barcodes: newBarcodes,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, newLog]);

    setError("");
  };

  useEffect(() => {
    barcodes.forEach((b) => {
      JsBarcode(`#barcode-${b.barcodeValue}`, b.barcodeValue, {
        format: "CODE128",
        displayValue: false,
        width: 1.2,
        height: 42,
        margin: 2,
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

    const csvHeader = "SKU_Prefix,PO,BarcodeNumber,BarcodeValue,Timestamp\n";
    const rows = filteredLogs
      .flatMap((log) =>
        log.barcodes.map(
          (b) =>
            `${log.skuPrefix},${log.po},${log.barcodeNumber},${b.barcodeValue},${log.timestamp}`
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
      <h2 style={{ textAlign: "center", letterSpacing: "5px" }}>PALMONAS</h2>
      <h1 style={{ textAlign: "center" }}>Barcode Printing Utility</h1>

      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        {user ? (
          <button
            onClick={() => {
              googleLogout();
              setUser(null);
            }}
          >
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

      <div style={{ marginTop: "40px", maxWidth: "400px" }}>
        <div>
          <label>SKU Prefix :</label>
          <input
            value={skuPrefix}
            onChange={(e) => setSkuPrefix(e.target.value)}
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
          <label>Barcode Number :</label>
          <input
            value={barcodeNumber}
            onChange={(e) => setBarcodeNumber(e.target.value)}
            disabled={!user}
            style={{ width: "100%", margin: "5px 0" }}
          />
        </div>
        <div>
          <label>Printer :</label>
          <select style={{ width: "100%", margin: "5px 0" }}>
            <option>TSCDA 310</option>
            <option>TSCDA 210</option>
          </select>
        </div>

        <p>Last Serial Printed : {skuPrefix ? lastSerial : "N/A"}</p>

        <button onClick={generateBarcodes} disabled={!user}>
          Generate Barcodes
        </button>
        <button onClick={handlePrint} disabled={!user}>
          Print Barcodes
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <h4>Preview :</h4>
      <div className="barcode-preview">
        {barcodes.map((b) => (
          <div className="barcode-label" key={b.barcodeValue}>
            <svg id={`barcode-${b.barcodeValue}`}></svg>
            <div className="sku-text">{b.barcodeValue}</div>
            <div className="barcode-number">{b.barcodeNumber}</div>
          </div>
        ))}
      </div>

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
          cursor: "pointer",
        }}
      >
        Data Export Button
      </button>

      <style>{`
             .barcode-preview {
              display: grid;
              grid-template-columns: repeat(2, 48mm); /* 2 columns */
              grid-auto-rows: 25mm;                   /* Each row is 25mm high */
              gap: 3mm 3mm;                           /* 3mm gap between rows & columns */
              justify-content: start;
            }

            .barcode-label {
              width: 46mm;             /* Fits inside 48mm column */
              height: 25mm;            /* Total height including padding */
              padding: 2mm;            /* 2mm inside padding all sides */
              box-sizing: border-box;  /* Makes padding stay inside 25mm */
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 13px;
            }

            svg {
              width: 100%;
              height: auto;
            }

            @media print {
              @page {
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
            }

      `}</style>
    </div>
  );
}
