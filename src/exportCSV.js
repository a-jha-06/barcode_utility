import { useState } from 'react';
import axios from 'axios';

export default function ExportCSV() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const exportData = async () => {
    if (!startDate || !endDate) {
      alert('Please select a valid date range.');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/export-csv`,
        {
          params: { startDate, endDate },
          responseType: 'blob', // handle CSV blob
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'barcode-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('No data found or export failed.');
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <label>From: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
      <label> To: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
      <button onClick={exportData}>Export CSV</button>
    </div>
  );
}
