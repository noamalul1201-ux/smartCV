import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { cognitoConfig } from './cognitoConfig';
import './Auth.css';

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId
});

function getFriendlyError(err) {
  const map = {
    UsernameExistsException: 'כתובת המייל הזו כבר רשומה במערכת. אפשר להתחבר במקום להירשם.',
    InvalidPasswordException: 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.',
    InvalidParameterException: 'אחד מהשדות לא תקין. יש לבדוק את כתובת המייל והסיסמה.',
    CodeMismatchException: 'קוד האימות שגוי. כדאי לבדוק את הקוד שנשלח למייל ולנסות שוב.',
    ExpiredCodeException: 'קוד האימות פג תוקף. אפשר לבקש קוד חדש למטה.',
    UserNotFoundException: 'לא נמצא חשבון עם כתובת המייל הזו.',
    NotAuthorizedException: 'מייל או סיסמה שגויים.',
    UserNotConfirmedException: 'החשבון טרם אומת. יש להזין את קוד האימות שנשלח למייל בעת ההרשמה.',
    LimitExceededException: 'יותר מדי ניסיונות. יש להמתין כמה דקות ולנסות שוב.'
  };
  return map[err?.code] || err?.message || 'משהו השתבש. יש לנסות שוב.';
}

function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const attributeList = [new CognitoUserAttribute({ Name: 'email', Value: email })];
    userPool.signUp(email, password, attributeList, null, (err) => {
      setLoading(false);
      if (err) return setError(getFriendlyError(err));
      setMode('confirm');
    });
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      setLoading(false);
      if (err) return setError(getFriendlyError(err));
      setMode('login');
      setError('');
      setInfo('האימות הצליח! עכשיו אפשר להתחבר.');
    });
  };

  const handleResendCode = () => {
    setError('');
    setInfo('');
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) return setError(getFriendlyError(err));
      setInfo('קוד אימות חדש נשלח למייל.');
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        setLoading(false);
        onLoginSuccess(session.getIdToken().getJwtToken(), email);
      },
      onFailure: (err) => {
        setLoading(false);
        if (err.code === 'UserNotConfirmedException') {
          setMode('confirm');
          setError(getFriendlyError(err));
        } else {
          setError(getFriendlyError(err));
        }
      }
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">📄✨</div>
        <h2>
          {mode === 'login' ? 'התחברות ל-SmartCV' : mode === 'signup' ? 'הרשמה ל-SmartCV' : 'אימות קוד'}
        </h2>
        <p className="auth-subtitle">פלטפורמת ניתוח קורות חיים חכמה</p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <input type="email" placeholder="כתובת אימייל" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'מתבצעת התחברות...' : 'התחברות'}</button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <input type="email" placeholder="כתובת אימייל" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="סיסמה (8+ תווים, אות גדולה ומספר)" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'מתבצעת הרשמה...' : 'הרשמה'}</button>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirm} className="auth-form">
            <p className="auth-hint">יש להזין את קוד האימות שנשלח לכתובת {email}</p>
            <input type="text" placeholder="קוד אימות" value={code} onChange={e => setCode(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'מתבצע אימות...' : 'אימות'}</button>
            <button type="button" className="auth-link-btn" onClick={handleResendCode}>לא התקבל קוד? שליחה מחדש</button>
          </form>
        )}

        <div className="auth-switch">
          {mode === 'login' && <p>אין עדיין חשבון? <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>הרשמה</button></p>}
          {mode === 'signup' && <p>כבר יש חשבון? <button onClick={() => { setMode('login'); setError(''); setInfo(''); }}>התחברות</button></p>}
        </div>
      </div>
    </div>
  );
}

export default Auth;