import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';
import RecruiterDashboard from './questionBank/RecruiterDashboard';
import SettingsScreen from './settings/SettingsScreen';
import { useIsMobile } from './hooks/useIsMobile';
import { useLanguage } from './utils/LanguageContext';

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'User');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'candidate');

  const [authTab, setAuthTab] = useState('signin');
  const [inputIdentifier, setInputIdentifier] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputConfirmPassword, setInputConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Retry helper — handles Render cold start (server wakes up in ~30s)
  const fetchWithRetry = async (url, options, retries = 3, delayMs = 8000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await window.fetch(url, options);
        if (res.ok) return res;
        if (attempt === retries) throw new Error(t('authFailed'));
      } catch (err) {
        if (attempt === retries) throw err;
        setError(`${t('serverStarting')} (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  };

  const saveSession = (data, displayName) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', displayName || data.username);
    localStorage.setItem('role', data.role);
    setToken(data.token);
    setUserId(data.userId);
    setUsername(displayName || data.username);
    setRole(data.role);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputIdentifier.trim() || !inputPassword) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithRetry('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: inputIdentifier.trim(), password: inputPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('loginFailed'));
      saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim() || !inputEmail.trim() || !inputPassword) return;
    if (inputPassword !== inputConfirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetchWithRetry('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: inputUsername.trim(),
          email: inputEmail.trim(),
          password: inputPassword,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('registrationFailed'));
      saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithRetry('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', 'Guest');
      localStorage.setItem('role', data.role);
      setToken(data.token);
      setUserId(data.userId);
      setUsername('Guest');
      setRole(data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUserId(null);
    setUsername('User');
    setRole('candidate');
    setMenuOpen(false);
  };

  const handleSwitchRole = () => {
    const newRole = role === 'candidate' ? 'interviewer' : 'candidate';
    localStorage.setItem('role', newRole);
    setRole(newRole);
    setMobileMenuOpen(false);
    setMenuOpen(false);
    window.location.replace('/');
  };

  const navLinkStyle = (isActive) => ({
    padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: '600',
    fontSize: '0.875rem', color: isActive ? '#4f46e5' : '#64748b',
    backgroundColor: isActive ? '#f5f3ff' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s ease',
    border: isActive ? '1px solid #e0d9ff' : '1px solid transparent',
  });

  const mobileNavLinkStyle = (isActive) => ({
    display: 'block', padding: '0.75rem 1rem', borderRadius: '8px',
    fontWeight: '600', fontSize: '0.9rem',
    color: isActive ? '#4f46e5' : '#334155',
    backgroundColor: isActive ? '#f5f3ff' : 'transparent',
    textDecoration: 'none', transition: 'background 0.15s',
  });

  const switchBtnStyle = {
    padding: '0.45rem 0.85rem', borderRadius: '8px',
    backgroundColor: '#f5f3ff', color: '#4f46e5',
    border: '1px solid #e0d9ff', fontSize: '0.8rem',
    fontWeight: '700', cursor: 'pointer',
  };

  function UserDropdown({ onClose, onLogout }) {
    return (
      <div style={{
        position: 'absolute', right: 0, marginTop: '0.5rem',
        backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        width: '150px', zIndex: 200, display: 'flex', flexDirection: 'column',
        padding: '0.4rem 0',
      }}>
        <NavLink
          to="/settings"
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem', textDecoration: 'none', color: '#334155',
            fontSize: '0.85rem', fontWeight: '600', display: 'flex',
            alignItems: 'center', gap: '0.5rem',
          }}
        >
          ⚙️ {t('navSettings')}
        </NavLink>
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0.3rem 0' }} />
        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem', background: 'none', border: 'none',
            color: '#dc2626', fontSize: '0.85rem', fontWeight: '700',
            textAlign: 'left', cursor: 'pointer', width: '100%',
          }}
        >
          🚪 {t('navLogout')}
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem',
    borderRadius: '10px', border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const roleCard = (roleVal, icon, label) => (
    <div
      onClick={() => setSelectedRole(roleVal)}
      style={{
        flex: 1, padding: '0.75rem', borderRadius: '10px',
        border: `2px solid ${selectedRole === roleVal ? '#4f46e5' : '#e2e8f0'}`,
        backgroundColor: selectedRole === roleVal ? '#f5f3ff' : '#ffffff',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
      }}
    >
      <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.25rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: selectedRole === roleVal ? '#4f46e5' : '#475569' }}>{label}</span>
    </div>
  );

  // Language toggle — two pill buttons used in auth screens
  const langToggle = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={{
          padding: '0.25rem 0.7rem', borderRadius: '20px 0 0 20px',
          border: '1.5px solid #e0d9ff', borderRight: 'none',
          backgroundColor: language === 'en' ? '#4f46e5' : '#f5f3ff',
          color: language === 'en' ? '#fff' : '#4f46e5',
          fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer',
        }}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('he')}
        style={{
          padding: '0.25rem 0.7rem', borderRadius: '0 20px 20px 0',
          border: '1.5px solid #e0d9ff',
          backgroundColor: language === 'he' ? '#4f46e5' : '#f5f3ff',
          color: language === 'he' ? '#fff' : '#4f46e5',
          fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer',
        }}
      >
        עב
      </button>
    </div>
  );

  const loginForm = (
    <>
      {langToggle}

      {/* Tabs */}
      <div style={{ display: 'flex', borderRadius: '10px', backgroundColor: '#f1f5f9', padding: '4px', marginBottom: '1.25rem' }}>
        {['signin', 'signup'].map(tab => (
          <button
            key={tab}
            onClick={() => { setAuthTab(tab); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.15s',
              backgroundColor: authTab === tab ? '#ffffff' : 'transparent',
              color: authTab === tab ? '#4f46e5' : '#64748b',
              boxShadow: authTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab === 'signin' ? t('signIn') : t('createAccount')}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', padding: '0.75rem', borderRadius: '10px',
          fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500',
        }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#15803d', padding: '0.75rem', borderRadius: '10px',
          fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500',
        }}>
          ✅ {successMsg}
        </div>
      )}

      {/* ── SIGN IN ── */}
      {authTab === 'signin' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('usernameOrEmail')}
            </label>
            <input
              type="text"
              placeholder={t('usernameOrEmailPlaceholder')}
              value={inputIdentifier}
              onChange={e => setInputIdentifier(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('password')}
            </label>
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={inputPassword}
              onChange={e => setInputPassword(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputIdentifier.trim() || !inputPassword}
            style={{
              width: '100%', padding: '0.75rem', marginTop: '0.25rem',
              background: (!loading && inputIdentifier.trim() && inputPassword) ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
              color: (!loading && inputIdentifier.trim() && inputPassword) ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
              cursor: (!loading && inputIdentifier.trim() && inputPassword) ? 'pointer' : 'default',
              boxShadow: (!loading && inputIdentifier.trim() && inputPassword) ? '0 4px 12px rgba(79,70,229,0.2)' : 'none',
            }}
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
      )}

      {/* ── SIGN UP ── */}
      {authTab === 'signup' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('selectRole')}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {roleCard('candidate', '👨‍💻', t('roleCandidate'))}
              {roleCard('interviewer', '💼', t('roleInterviewer'))}
            </div>
          </div>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('username')}
            </label>
            <input
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={inputUsername}
              onChange={e => setInputUsername(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('email')}
            </label>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={inputEmail}
              onChange={e => setInputEmail(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('password')}
            </label>
            <input
              type="password"
              placeholder={t('passwordPlaceholderMin')}
              value={inputPassword}
              onChange={e => setInputPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('confirmPassword')}
            </label>
            <input
              type="password"
              placeholder={t('confirmPasswordPlaceholder')}
              value={inputConfirmPassword}
              onChange={e => setInputConfirmPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                ...inputStyle,
                borderColor: inputConfirmPassword && inputPassword !== inputConfirmPassword ? '#fca5a5' : '#e2e8f0',
              }}
            />
            {inputConfirmPassword && inputPassword !== inputConfirmPassword && (
              <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
                {t('passwordsNoMatch')}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !inputUsername.trim() || !inputEmail.trim() || !inputPassword || inputPassword !== inputConfirmPassword}
            style={{
              width: '100%', padding: '0.75rem', marginTop: '0.25rem',
              background: (!loading && inputUsername.trim() && inputEmail.trim() && inputPassword && inputPassword === inputConfirmPassword)
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
              color: (!loading && inputUsername.trim() && inputEmail.trim() && inputPassword && inputPassword === inputConfirmPassword)
                ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
              cursor: (!loading && inputUsername.trim() && inputEmail.trim() && inputPassword && inputPassword === inputConfirmPassword)
                ? 'pointer' : 'default',
            }}
          >
            {loading ? t('creatingAccount') : t('createAccount')}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        <span style={{ padding: '0 0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{t('or')}</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
      </div>

      <div style={{ textAlign: 'start', marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
          {t('continueAsGuest')}
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {roleCard('candidate', '👨‍💻', t('roleCandidate'))}
          {roleCard('interviewer', '💼', t('roleInterviewer'))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleGuest}
        disabled={loading}
        style={{
          width: '100%', padding: '0.75rem',
          backgroundColor: '#f8fafc', color: '#475569',
          border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600',
          cursor: loading ? 'default' : 'pointer', transition: 'background-color 0.15s',
          fontSize: '0.9rem',
        }}
      >
        {loading ? t('loading') : t('continueAsGuestBtn')}
      </button>
    </>
  );

  if (!token) {
    if (isMobile) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: 'Inter, sans-serif',
          padding: '1.5rem',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>🎯</div>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
                Smart<span style={{ color: '#4f46e5' }}>Interviewer</span>
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
              {authTab === 'signin' ? t('welcomeBack') : t('createYourAccount')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {authTab === 'signin' ? t('signInSubtitle') : t('signUpSubtitle')}
            </p>
            {loginForm}
          </div>
        </div>
      );
    }

    // Desktop: two-column layout
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}>
        {/* Left panel — branding */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-80px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-60px',
            width: '240px', height: '240px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', zIndex: 1 }}>
            <div style={{
              width: '52px', height: '52px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>🎯</div>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              Smart<span style={{ color: '#c4b5fd' }}>Interviewer</span>
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.2, zIndex: 1 }}>
            {t('heroTitle').split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
            ))}
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: '340px', lineHeight: 1.6, zIndex: 1, marginBottom: '2.5rem' }}>
            {t('heroSubtitle')}
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', zIndex: 1, width: '100%', maxWidth: '340px' }}>
            {[
              { icon: '🚀', key: 'feature1' },
              { icon: '📊', key: 'feature2' },
              { icon: '🧠', key: 'feature3' },
              { icon: '💼', key: 'feature4' },
            ].map(f => (
              <div key={f.key} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '0.65rem 1rem',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t(f.key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          width: '480px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>
              {authTab === 'signin' ? t('welcomeBack') : t('createYourAccount')}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.75rem' }}>
              {authTab === 'signin' ? t('signInSubtitleRight') : t('signUpSubtitleRight')}
            </p>
            {loginForm}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* ─── Navbar ───────────────────────────────────── */}
        <nav style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e8eaf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: isMobile ? '0 1rem' : '0 2rem',
          minHeight: '64px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* Top bar — always visible */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}>
            {/* Logo */}
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div style={{
                width: '32px', height: '32px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}>
                🎯
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Smart<span style={{ color: '#4f46e5' }}>Interviewer</span>
              </span>
            </NavLink>

            {isMobile ? (
              /* Hamburger button */
              <button
                onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMenuOpen(false); }}
                style={{
                  background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '1.2rem',
                  color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            ) : (
              /* Desktop nav */
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {role === 'candidate' ? (
                    <>
                      <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>🏠 {t('navDashboard')}</NavLink>
                      <NavLink to="/prepare" style={({ isActive }) => navLinkStyle(isActive)}>🚀 {t('navPractice')}</NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>🏠 {t('navRecruiterDashboard')}</NavLink>
                      <NavLink to="/questions" style={({ isActive }) => navLinkStyle(isActive)}>📋 {t('navQuestionGenerator')}</NavLink>
                    </>
                  )}
                </div>

                <button onClick={handleSwitchRole} style={switchBtnStyle}>
                  🔄 {role === 'candidate' ? t('switchToRecruiter') : t('switchToCandidate')}
                </button>

                {/* User Dropdown Pill */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      border: 'none', background: '#f1f5f9', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: '700', color: '#475569',
                      padding: '0.45rem 1rem', borderRadius: '20px',
                    }}
                  >
                    👤 {username} <span style={{ fontSize: '0.7rem' }}>▼</span>
                  </button>
                  {menuOpen && <UserDropdown onClose={() => setMenuOpen(false)} onLogout={handleLogout} />}
                </div>
              </div>
            )}
          </div>

          {/* Mobile dropdown panel */}
          {isMobile && mobileMenuOpen && (
            <div style={{
              borderTop: '1px solid #f1f5f9',
              paddingBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}>
              {role === 'candidate' ? (
                <>
                  <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}>🏠 {t('navDashboard')}</NavLink>
                  <NavLink to="/prepare" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}>🚀 {t('navPractice')}</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}>🏠 {t('navRecruiterDashboard')}</NavLink>
                  <NavLink to="/questions" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}>📋 {t('navQuestionGenerator')}</NavLink>
                </>
              )}
              <NavLink to="/settings" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}>⚙️ {t('navSettings')}</NavLink>
              <button onClick={handleSwitchRole} style={{ ...mobileNavLinkStyle(false), textAlign: 'left', border: 'none', cursor: 'pointer', width: '100%' }}>
                🔄 {role === 'candidate' ? t('switchToRecruiter') : t('switchToCandidate')}
              </button>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{ ...mobileNavLinkStyle(false), textAlign: 'left', border: 'none', cursor: 'pointer', color: '#dc2626', width: '100%' }}
              >
                🚪 {t('navLogout')}
              </button>
            </div>
          )}
        </nav>

        {/* ─── Page Content ───────────────────────────────── */}
        <main style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '1rem' : '2rem 1.5rem',
        }}>
          <Routes>
            <Route path="/" element={role === 'candidate' ? <ProgressDashboard /> : <RecruiterDashboard />} />
            <Route path="/prepare" element={<UploadResumeForm />} />
            <Route path="/simulator" element={<SimulatorScreen />} />
            <Route path="/questions" element={<QuestionBankScreen />} />
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
