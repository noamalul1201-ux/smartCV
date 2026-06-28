import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://ca0cxcsgjl.execute-api.us-east-1.amazonaws.com/prod';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFileKey, setUploadedFileKey] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('אנא בחרי קובץ PDF');
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const response = await axios.post(`${API_URL}/upload`, {
          userId: 'user-123',
          file: base64
        });
        const fileKey = JSON.parse(response.data.body).fileKey;
        setUploadedFileKey(fileKey);
        await handleAnalyze(fileKey);
      };
    } catch (err) {
      setError('שגיאה בהעלאת הקובץ');
      setLoading(false);
    }
  };

  const handleAnalyze = async (fileKey) => {
    try {
      const response = await axios.post(`${API_URL}/analyze`, {
        userId: 'user-123',
        fileKey: fileKey,
        jobDescription: jobDescription || null
      });
      const result = JSON.parse(response.data.body);
      setAnalysis(result.analysis);
    } catch (err) {
      setError('שגיאה בניתוח הקובץ');
    }
    setLoading(false);
  };

  return (
    <div className="App" dir="rtl">
      <header className="app-header">
        <h1>SmartCV 📄</h1>
        <p>נתח את קורות החיים שלך עם בינה מלאכותית</p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <h2>העלאת קורות חיים</h2>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          {file && <p>קובץ נבחר: {file.name}</p>}

          <h3>תיאור משרה (אופציונלי)</h3>
          <textarea
            placeholder="הדבק כאן את תיאור המשרה לבדיקת התאמה..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
          />

          <button onClick={handleUpload} disabled={loading}>
            {loading ? 'מנתח...' : 'נתח קורות חיים'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {analysis && (
          <div className="results">
            <h2>תוצאות הניתוח</h2>

            <div className="score-circle">
              <span>{analysis.overall_score}</span>
              <p>ציון כולל</p>
            </div>

            <div className="breakdown">
              <h3>פירוט הציון</h3>
              {Object.entries(analysis.breakdown || {}).map(([key, val]) => (
                <div key={key} className="breakdown-item">
                  <span>{key}</span>
                  <div className="progress-bar">
                    <div style={{ width: `${(val / 25) * 100}%` }}></div>
                  </div>
                  <span>{val}</span>
                </div>
              ))}
            </div>

            <div className="feedback-section">
              <div className="strengths">
                <h3>✅ חוזקות</h3>
                <ul>{analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              <div className="weaknesses">
                <h3>⚠️ חולשות</h3>
                <ul>{analysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>

              <div className="tips">
                <h3>💡 טיפים לשיפור</h3>
                <ul>{analysis.improvement_tips?.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>

              <div className="keywords">
                <h3>🔑 מילות מפתח חסרות</h3>
                <ul>{analysis.missing_keywords?.map((k, i) => <li key={i}>{k}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;