
# 📦 Barcode Printing Utility

A simple React app to:
- ✅ Sign in with Google (top-right)
- ✅ Generate barcodes for a SKU and PO with auto-incremented serials
- ✅ Preview & print barcodes
- ✅ Keep a log of every barcode ever generated
- ✅ Export all barcodes for a SKU as a CSV file

---

## 🚀 Setup

1️⃣ **Clone this project**

```bash
git clone https://your-repo-url.git
cd your-repo-folder
```

2️⃣ **Install dependencies**

```bash
npm install
```

3️⃣ **Add Google OAuth**

In your `index.js` or `main.jsx`:

```jsx
import { GoogleOAuthProvider } from "@react-oauth/google";

<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <App />
</GoogleOAuthProvider>
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your real OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/).

---

## 🧑‍💻 Run locally

```bash
npm start
```

---

## 📑 How to use

1️⃣ **Sign in**  
Click the Google Sign-In button in the top right.

2️⃣ **Enter SKU, PO, and Quantity**  
- SKU → the product code  
- PO → purchase order (optional)  
- Quantity → how many barcodes to generate

3️⃣ **Click Generate**  
The app generates unique barcodes with auto-incrementing serials.  
Example: `SKU-1`, `SKU-2`, `SKU-3` ...

4️⃣ **Preview & Print**  
- Preview shows the barcodes.
- Click **Print** to print them — each barcode is on a separate label (50mm x 25mm).

5️⃣ **Export CSV**  
- Click **Export Barcodes CSV**.
- A new page will open.
- Enter the SKU → Click **Export** → CSV will include every barcode ever generated for that SKU.

---

## 🗂️ Where data is stored

- Last serial number → `localStorage`
- Barcode logs → `localStorage`  
  (So your logs persist between page reloads on the same browser)

---

## ✅ Tested with

- React 18+
- `@react-oauth/google`
- `jwt-decode`
- `jsbarcode`

---

## 📃 License

MIT — Use freely!
