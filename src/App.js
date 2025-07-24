import React, { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import JsBarcode from "jsbarcode";
import "./App.css";

import { app } from "./firebase";
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";

function BarcodePrintingUtility() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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

  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://barcode-printing-utility.web.app";

  // Fetch last serial on SKU change
  useEffect(() => {
    if (!skuPrefix || !token) return;

    fetch(`${API_BASE}/api/last-serial/${skuPrefix}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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
  }, [skuPrefix, token]);

  // Draw barcodes on render
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

  const generateBarcodes = async () => {
    setError("");
    if (!skuPrefix || quantity <= 0 || !barcodeNumber || !user || !token) {
      setError("Fill all fields and sign in.");
      return;
    }

    const payload = {
      skuPrefix,
      po,
      barcodeNumber,
      quantity,
      startSerial: parseInt(startSerial),
      userEmail: user?.email,
    };

    try {
      const res = await fetch(`${API_BASE}/api/barcodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorRes = await res.json();
        throw new Error(errorRes.error || "Failed to generate barcodes.");
      }

      const data = await res.json();

      if (data.barcodes) {
        setBarcodes(data.barcodes);
        setLastSerial(data.lastSerial);
        setStartSerial(data.lastSerial + 1);
      } else {
        setError("No barcodes returned.");
      }
    } catch (err) {
      console.error("Barcode generation error:", err);
      setError("Server error: " + err.message);
    }
  };

  const handlePrint = () => {
    if (!user) return setError("Please sign in.");
    if (!barcodes.length) return setError("Generate barcodes first.");
    setTimeout(() => window.print(), 500);
  };

  const handleExportCSV = () => {
    if (!startDate || !endDate) {
      alert("Select both start and end dates");
      return;
    }

    fetch(`${API_BASE}/export-csv?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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

  return (
    <div className="container">
            <h2 style={{ textAlign: "center" }}>UTILITY PROJECT</h2>
      <h1 style={{ textAlign: "center" }}>Barcode Printing Utility</h1>

      {/* Google Auth */}
      <div className="auth-button">
        {user ? (
          <button
            onClick={() => {
              googleLogout();
              setUser(null);
              setToken(null);
            }}
          >
            Sign Out
          </button>
        ) : (
          <GoogleLogin
            onSuccess={async (res) => {
              try {
                const decoded = jwtDecode(res.credential);
                setUser(decoded);

                const auth = getAuth(app);
                const credential =
                  GoogleAuthProvider.credential(res.credential);
                const result = await signInWithCredential(auth, credential);
                const token = await result.user.getIdToken();
                setToken(token);
              } catch (err) {
                console.error("Auth error:", err);
                setError("Google login or Firebase auth failed.");
              }
            }}
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
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={handleExportCSV}>Export</button>
      </div>
    </div>
  );
}

export default BarcodePrintingUtility;
