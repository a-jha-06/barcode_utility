import React, { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import JsBarcode from "jsbarcode";

export default function App() {
  const [user, setUser] = useState(null);
  const [sku, setSku] = useState("");
  const [po, setPo] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [barcodes, setBarcodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [lastSerial, setLastSerial] = useState(0);

  // Load logs from localStorage
  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem("logs") || "[]");
    setLogs(storedLogs);
  }, []);

  // Save logs when they change
  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  // Load last serial when SKU changes
  useEffect(() => {
    if (sku) {
      const savedSerial = localStorage.getItem(`lastSerial-${sku}`);
      setLastSerial(savedSerial ? parseInt(savedSerial) : 0);
    } else {
      setLastSerial(0);
    }
  }, [sku]);

  const generateBarcodes = () => {
    if (!sku || quantity <= 0) {
      setError("SKU and Quantity required.");
      return;
    }
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    const startSerial = lastSerial + 1;
    const newSerials = Array.from(
      { length: quantity },
      (_, i) => `${sku}-${startSerial + i}`
    );
    setBarcodes(newSerials);

    const newLastSerial = startSerial + quantity - 1;
    localStorage.setItem(`lastSerial-${sku}`, newLastSerial);
    setLastSerial(newLastSerial);

    const newLog = {
      sku,
      po,
      quantity,
      startSerial,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, newLog]);

    setError("");
  };

  const handlePrint = () => {
    if (!user) {
      setError("❌ Please sign in first!");
      return;
    }
    if (barcodes.length === 0) {
      setError("❌ Please generate barcodes first!");
      return;
    }

    setError("");
    setTimeout(() => window.print(), 500);
  };

  const openExportPage = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Export Barcodes</title>
        </head>
        <body>
          <h2>Export Barcodes CSV</h2>
          <label>SKU: <input type="text" id="skuInput" placeholder="Enter SKU" /></label><br/>
          <button id="exportBtn">Export</button>
          <script>
            const logs = ${JSON.stringify(logs)};
            document.getElementById("exportBtn").onclick = () => {
              const sku = document.getElementById("skuInput").value.trim();
              if (!sku) {
                alert("Enter a SKU.");
                return;
              }

              const rows = [];
              logs.forEach(log => {
                if (log.sku === sku) {
                  for (let i = 0; i < log.quantity; i++) {
                    const serial = log.startSerial + i;
                    const barcode = \`\${log.sku}-\${serial}\`;
                    rows.push(\`\${log.sku},\${log.po},\${barcode},\${log.timestamp}\`);
                  }
                }
              });

              if (rows.length === 0) {
                alert("No barcodes found for that SKU!");
                return;
              }

              const header = "SKU,PO,Barcode,Timestamp\\n";
              const csvContent = header + rows.join("\\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = \`\${sku}_barcodes.csv\`;
              a.click();
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
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

  return (
    <div style={{ padding: "20px", backgroundColor: "#f9f9f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Barcode Printing Utility</h1>
        {user ? (
          <div>
            ✅ {user.name} &nbsp;
            <button
              onClick={() => {
                googleLogout();
                setUser(null);
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const decoded = jwtDecode(credentialResponse.credential);
              setUser(decoded);
              setError("");
            }}
            onError={() => console.log("Login Failed")}
          />
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <div>
          <label>SKU:</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            disabled={!user}
          />
        </div>
        <div>
          <label>PO:</label>
          <input
            value={po}
            onChange={(e) => setPo(e.target.value)}
            disabled={!user}
          />
        </div>
        <div>
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            disabled={!user}
          />
        </div>

        <p>Last Serial Used for {sku || "N/A"}: {lastSerial}</p>

        <button onClick={generateBarcodes} disabled={!user}>
          Generate Barcodes
        </button>
        <button onClick={handlePrint} disabled={!user}>
          Print Barcodes
        </button>
        <button onClick={openExportPage} disabled={logs.length === 0}>
          Export Barcodes CSV
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Preview:</h3>
      <div className="barcode-preview">
        {barcodes.map((code) => (
          <svg key={code} id={`barcode-${code}`}></svg>
        ))}
      </div>

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
