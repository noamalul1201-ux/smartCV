import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Auth from './Auth';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const ANALYZE_URL = 'https://xpud7s4umsdv4tw6lbvwrjdvcq0whbpd.lambda-url.us-east-1.on.aws/';
const HISTORY_URL = 'https://dyjvudzjjotnem5jgegxbeabte0gpcot.lambda-url.us-east-1.on.aws/';
const MAX_FILE_SIZE_MB = 5;

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

function App() {
  const [idToken, setIdToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const handleLoginSuccess = (token, email) => {
    setIdToken(token);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setIdToken(null);
    setUserEmail(null);
    setFile(null);
    setAnalysis(null);
    setView('home');
    setHistory([]);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(null);
    setAnalysis(null);
    if (!selected) { setFile(null); return; }
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('ניתן להעלות קובצי PDF בלבד.');
      setFile(null); e.target.value = ''; return;
    }
    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setError(`הקובץ גדול מדי (${sizeMB.toFixed(1)}MB).`);
      setFile(null); e.target.value = ''; return;
    }
    if (selected.size < 1024) {
      setError('הקובץ קטן מדי ונראה ריק.');
      setFile(null); e.target.value = ''; return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return alert('יש לבחור קובץ PDF');
    setLoading(true);
    setError(null);
    try {
      const cvText = await extractTextFromPDF(file);
      if (!cvText || cvText.trim().length < 50) {
        setError('לא ניתן לקרוא את תוכן הקובץ.');
        setLoading(false);
        return;
      }
      await handleAnalyze(cvText);
    } catch (err) {
      setError('שגיאה בקריאת הקובץ.');
      setLoading(false);
    }
  };

  const handleAnalyze = async (cvText) => {
    try {
      const response = await axios.post(
        ANALYZE_URL,
        { userId: userEmail, cvText, jobDescription: jobDescription || null },
        { headers: { Authorization: idToken } }
      );
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError('שגיאה בניתוח הקובץ.');
    }
    setLoading(false);
  };

  const handleShowHistory = async () => {
    setView('history');
    setHistoryLoading(true);
    try {
      const response = await axios.get(
        `${HISTORY_URL}?userId=${encodeURIComponent(userEmail)}`,
        { headers: { Authorization: idToken } }
      );
      setHistory(response.data.analyses || []);
    } catch (err) {
      setError('שגיאה בטעינת ההיסטוריה.');
    }
    setHistoryLoading(false);
  };

  if (!idToken) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App" dir="rtl">
      <header className="app-header">
        <div className="header-logo">SmartCV</div>
        <nav className="header-nav">
          <button
            className={view === 'home' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('home')}
          >
            ניתוח חדש
          </button>
          <button
            className={view === 'history' ? 'nav-btn active' : 'nav-btn'}
            onClick={handleShowHistory}
          >
            היסטוריה
          </button>
        </nav>
        <div className="user-bar">
          <span>שלום, {userEmail.split('@')[0]}</span>
          <button onClick={handleLogout}>התנתקות</button>
        </div>
      </header>

      {view === 'home' && (
        <>
          <div className="page-hero">
            <h1>ניתוח קורות חיים חכם מבוסס AI</h1>
            <p>העלה את קורות החיים שלך וקבל משוב מפורט שיעזור לך להתקבל לעבודה הבאה שלך</p>
          </div>

          <main className="app-main">
            <div className="main-grid">
              <div className="upload-col">
                <div className="upload-section">
                  {error && <div className="error">{error}</div>}

                  <div className="upload-drop-area" onClick={() => document.getElementById('file-input').click()}>
                    <div className="upload-icon">📄</div>
                    <h3>לחץ לבחירת קובץ PDF</h3>
                    <p>מהמחשב שלך</p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {file && (
                    <div className="file-selected">
                      ✅ קובץ נבחר: {file.name}
                    </div>
                  )}

                  <div className="job-desc-section">
                    <label>תיאור משרה (אופציונלי)</label>
                    <textarea
                      placeholder="הדבק כאן את דרישות המשרה לבדיקת התאמה מדויקת..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <button className="analyze-btn" onClick={handleUpload} disabled={loading || !file}>
                    {loading ? '⏳ מנתח...' : '📊 נתח קורות חיים'}
                  </button>
                </div>
              </div>

              <div className="features-col">
                <h2 className="features-title">?למה SmartCV</h2>
                <div className="feature-card">
                  <div className="feature-icon">⏱</div>
                  <div>
                    <h4>חיסכון בזמן</h4>
                    <p>חסוך שעות של עבודה ידנית. המערכת מנתחת הכל בשניות.</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">✨</div>
                  <div>
                    <h4>שיפור איכות</h4>
                    <p>קבל המלצות מדויקות לשיפור התוכן והניסוח של קורות החיים שלך.</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎯</div>
                  <div>
                    <h4>התאמה למשרה</h4>
                    <p>בדוק כמה קורות החיים שלך מתאימים למשרה שאתה מגיש.</p>
                  </div>
                </div>
                <div className="features-image">
                  <img
                    src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80"
                    alt="קורות חיים"
                  />
                  <div className="features-image-overlay">
                    <span>אנחנו כאן כדי לעזור לך להצליח</span>
                  </div>
                </div>
              </div>
            </div>

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
        </>
      )}

      {view === 'history' && (
        <main className="app-main">
          <div className="history-section">
            <h2>היסטוריית ניתוחים</h2>
            {historyLoading && <p className="loading-text">⏳ טוען היסטוריה...</p>}
            {!historyLoading && history.length === 0 && (
              <div className="empty-history">
                <p>📭 אין עדיין ניתוחים בהיסטוריה</p>
                <button className="analyze-btn" onClick={() => setView('home')}>
                  התחל ניתוח ראשון
                </button>
              </div>
            )}
            {!historyLoading && history.length > 0 && (
              <div className="history-grid">
                {history.map((item, i) => (
                  <div key={i} className="history-card" onClick={() => { console.log(JSON.stringify(item)); setSelectedAnalysis(item); }}>
                    <div className="history-score">{item.analysis?.overall_score || 0}</div>
                    <div className="history-info">
                      <p className="history-date">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}
                      </p>
                      <p className="history-strengths">
                        {item.analysis?.strengths?.[0] || 'ניתוח קורות חיים'}
                      </p>
                    </div>
                    <div className="history-arrow">←</div>
                  </div>
                ))}
              </div>
            )}

            {selectedAnalysis && (
              <div className="results" style={{ marginTop: '28px' }}>
                <div className="results-header">
                  <h2>פרטי הניתוח</h2>
                  <button className="close-btn" onClick={() => setSelectedAnalysis(null)}>✕ סגור</button>
                </div>
                <div className="score-circle">
                  <span>{selectedAnalysis.analysis?.overall_score}</span>
                  <p>ציון כולל</p>
                </div>
                <div className="breakdown">
                  <h3>פירוט הציון</h3>
                  {Object.entries(selectedAnalysis.analysis?.breakdown || {}).map(([key, val]) => (
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
                    <ul>{selectedAnalysis.analysis?.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="weaknesses">
                    <h3>⚠️ חולשות</h3>
                    <ul>{selectedAnalysis.analysis?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  </div>
                  <div className="tips">
                    <h3>💡 טיפים לשיפור</h3>
                    <ul>{selectedAnalysis.analysis?.improvement_tips?.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>
                  <div className="keywords">
                    <h3>🔑 מילות מפתח חסרות</h3>
                    <ul>{selectedAnalysis.analysis?.missing_keywords?.map((k, i) => <li key={i}>{k}</li>)}</ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;