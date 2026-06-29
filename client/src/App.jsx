import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';
import RecruiterDashboard from './questionBank/RecruiterDashboard';
import SettingsScreen from './settings/SettingsScreen';
import { useIsMobile } from './hooks/useIsMobile';
import { useLanguage } from './utils/LanguageContext';
import Icon from './components/ui/icons';

const HIREUP_LOGO_SRC = '/brand/hireup-logo-transparent.png';
const HIREUP_SYMBOL_SRC = '/brand/hireup-internal-symbol-white.png';

function FullHireUpLogo({ isMobile }) {
  return (
    <div
      dir="ltr"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem',
      }}
    >
      <img
        src={HIREUP_LOGO_SRC}
        alt="HireUp — AI Interview Coach & Recruitment Matchmaker"
        style={{
          display: 'block',
          width: isMobile ? 'min(78vw, 270px)' : 'min(100%, 320px)',
          maxHeight: isMobile ? '112px' : '136px',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

function HireUpTextBrand({ isMobile }) {
  return (
    <div
      dir="ltr"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: isMobile ? '1.25rem' : '2.5rem',
        zIndex: 1,
      }}
    >
      <span
        style={{
          fontSize: isMobile ? '1.6rem' : '1.9rem',
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: '0',
        }}
      >
        Hire<span style={{ color: '#d8b4fe' }}>Up</span>
      </span>
    </div>
  );
}

function NavBrandLockup({ isMobile }) {
  return (
    <span
      dir="ltr"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isMobile ? '0.45rem' : '0.55rem',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isMobile ? '30px' : '32px',
          height: isMobile ? '30px' : '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #143268, #3157d5)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(49,87,213,0.22)',
        }}
      >
        <img
          src={HIREUP_SYMBOL_SRC}
          alt=""
          aria-hidden="true"
          style={{
            display: 'block',
            width: isMobile ? '18px' : '19px',
            height: isMobile ? '19px' : '20px',
            objectFit: 'contain',
          }}
        />
      </span>
      <span
        style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: '0',
        }}
      >
        Hire<span style={{ color: '#3157d5' }}>Up</span>
      </span>
    </span>
  );
}

function UserDropdown({ onClose, onLogout, t, isRtl }) {
  return (
    <div style={{
      position: 'absolute',
      right: isRtl ? 'auto' : 0,
      left: isRtl ? 0 : 'auto',
      marginTop: '0.5rem',
      backgroundColor: 'var(--si-surface)', border: '1px solid var(--si-border)',
      borderRadius: '12px', boxShadow: 'var(--si-shadow)',
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
        <span className="si-icon-text"><Icon name="settings" size={16} />{t('navSettings')}</span>
      </NavLink>
      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0.3rem 0' }} />
      <button
        onClick={onLogout}
        style={{
          padding: '0.5rem 1rem', background: 'none', border: 'none',
          color: '#dc2626', fontSize: '0.85rem', fontWeight: '700',
          textAlign: 'start', cursor: 'pointer', width: '100%',
        }}
      >
        <span className="si-icon-text"><Icon name="logOut" size={16} />{t('navLogout')}</span>
      </button>
    </div>
  );
}

// Forces a full remount of the dashboard on every navigation to '/'.
// Including role + location.state?.refresh guarantees a fresh fetch when
// the role switches or when a child screen navigates home with a refresh token.
function HomeRoute({ role }) {
  const location = useLocation();
  const mountKey = `${role}-${location.key}-${location.state?.refresh ?? ''}`;
  return role === 'candidate'
    ? <ProgressDashboard key={mountKey} />
    : <RecruiterDashboard key={mountKey} />;
}

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
  const [inputRegisterPassword, setInputRegisterPassword] = useState('');
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
        // Return immediately for any 4xx — caller reads data.error
        if (res.ok || res.status < 500) return res;
        // 5xx (server cold start) — retry unless last attempt
        if (attempt === retries) return res;
        setError(`${t('serverStarting')} (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
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
    if (!inputIdentifier.trim()) { setError(t('usernameOrEmailRequired')); return; }
    if (!inputPassword) { setError(t('passwordRequired')); return; }
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
    if (!inputUsername.trim()) { setError(t('usernameRequired')); return; }
    if (!inputEmail.trim()) { setError(t('emailRequired')); return; }
    if (!inputRegisterPassword) { setError(t('passwordRequired')); return; }
    if (inputRegisterPassword !== inputConfirmPassword) {
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
          password: inputRegisterPassword,
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
    const uid = localStorage.getItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('pref-lang');
    localStorage.removeItem('pref-font-size');
    localStorage.removeItem('pref-high-contrast');
    localStorage.removeItem('pref-stt-lang');
    localStorage.removeItem('pref-readiness-threshold');
    localStorage.removeItem('pref-recruiter-company');
    localStorage.removeItem('pref-recruiter-qcount');
    localStorage.removeItem('pref-tts-enabled');
    if (uid) {
      localStorage.removeItem(`cached-cv-${uid}`);
      localStorage.removeItem(`cached-jd-${uid}`);
      // Keep pref-auto-save-cv-${uid} so the checkbox choice persists across sessions
    }
    sessionStorage.clear();
    window.location.replace('/');
  };

  const handleSwitchRole = () => {
    const newRole = role === 'candidate' ? 'interviewer' : 'candidate';
    localStorage.setItem('role', newRole);
    sessionStorage.clear();
    setRole(newRole);
    // If already on '/', updating React state + the role-based key in HomeRoute
    // remounts the dashboard instantly with no page reload needed.
    // If on a different route (simulator, questions…), navigate home fully.
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const navLinkStyle = (isActive) => ({
    padding: '0.5rem 0.95rem', borderRadius: '999px', fontWeight: '700',
    fontSize: '0.875rem', color: isActive ? 'var(--si-primary)' : 'var(--si-text-muted)',
    backgroundColor: isActive ? 'var(--si-primary-soft)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s ease',
    border: isActive ? '1px solid #cbd8ff' : '1px solid transparent',
  });

  const mobileNavLinkStyle = (isActive) => ({
    display: 'block', padding: '0.75rem 1rem', borderRadius: '8px',
    fontWeight: '600', fontSize: '0.9rem',
    color: isActive ? 'var(--si-primary)' : 'var(--si-text)',
    backgroundColor: isActive ? 'var(--si-primary-soft)' : 'transparent',
    textDecoration: 'none', transition: 'background 0.15s',
  });

  const switchBtnStyle = {
    padding: '0.45rem 0.85rem', borderRadius: '8px',
    backgroundColor: 'var(--si-secondary-soft)', color: 'var(--si-secondary)',
    border: '1px solid #b8e5dc', fontSize: '0.8rem',
    fontWeight: '700', cursor: 'pointer',
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem',
    borderRadius: '10px', border: '1.5px solid var(--si-border)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const roleCard = (roleVal, iconName, label) => (
    <div
      onClick={() => setSelectedRole(roleVal)}
      style={{
        flex: 1, padding: '0.75rem', borderRadius: '10px',
        border: `2px solid ${selectedRole === roleVal ? '#4f46e5' : '#e2e8f0'}`,
        backgroundColor: selectedRole === roleVal ? '#f5f3ff' : '#ffffff',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
      }}
    >
      <span className="si-icon-box" style={{ marginBottom: '0.25rem' }}><Icon name={iconName} size={24} /></span>
      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: selectedRole === roleVal ? '#4f46e5' : '#475569' }}>{label}</span>
    </div>
  );

  // Language toggle — two pill buttons used in auth screens
  const langToggle = (
    <div dir="ltr" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
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
          <span className="si-icon-text"><Icon name="alert" size={16} />{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#15803d', padding: '0.75rem', borderRadius: '10px',
          fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500',
        }}>
          <span className="si-icon-text"><Icon name="checkCircle" size={16} />{successMsg}</span>
        </div>
      )}

      {/* ── SIGN IN ── */}
      {authTab === 'signin' && (
        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
              background: (!loading && inputIdentifier.trim() && inputPassword) ? 'linear-gradient(135deg, var(--si-primary), #214cba)' : '#e2e8f0',
              color: (!loading && inputIdentifier.trim() && inputPassword) ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
              cursor: (!loading && inputIdentifier.trim() && inputPassword) ? 'pointer' : 'default',
              boxShadow: (!loading && inputIdentifier.trim() && inputPassword) ? '0 8px 20px rgba(49,87,213,0.22)' : 'none',
            }}
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
      )}

      {/* ── SIGN UP ── */}
      {authTab === 'signup' && (
        <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'start' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>
              {t('selectRole')}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {roleCard('candidate', 'user', t('roleCandidate'))}
              {roleCard('interviewer', 'briefcase', t('roleInterviewer'))}
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
              value={inputRegisterPassword}
              onChange={e => setInputRegisterPassword(e.target.value)}
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
                borderColor: inputConfirmPassword && inputRegisterPassword !== inputConfirmPassword ? '#fca5a5' : '#e2e8f0',
              }}
            />
            {inputConfirmPassword && inputRegisterPassword !== inputConfirmPassword && (
              <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
                {t('passwordsNoMatch')}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !inputUsername.trim() || !inputEmail.trim() || !inputRegisterPassword || inputRegisterPassword !== inputConfirmPassword}
            style={{
              width: '100%', padding: '0.75rem', marginTop: '0.25rem',
              background: (!loading && inputUsername.trim() && inputEmail.trim() && inputRegisterPassword && inputRegisterPassword === inputConfirmPassword)
                ? 'linear-gradient(135deg, var(--si-primary), #214cba)' : '#e2e8f0',
              color: (!loading && inputUsername.trim() && inputEmail.trim() && inputRegisterPassword && inputRegisterPassword === inputConfirmPassword)
                ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
              cursor: (!loading && inputUsername.trim() && inputEmail.trim() && inputRegisterPassword && inputRegisterPassword === inputConfirmPassword)
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
        {authTab === 'signin' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {roleCard('candidate', 'user', t('roleCandidate'))}
            {roleCard('interviewer', 'briefcase', t('roleInterviewer'))}
          </div>
        )}
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
          background: 'linear-gradient(135deg, var(--si-bg) 0%, var(--si-bg-soft) 100%)',
          fontFamily: 'Inter, sans-serif',
          padding: '1.5rem',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--si-border)',
            boxShadow: 'var(--si-shadow-lg)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}>
            {authTab === 'signup' ? (
              <FullHireUpLogo isMobile={isMobile} />
            ) : (
              <div dir="ltr" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0' }}>
                  Hire<span style={{ color: '#3157d5' }}>Up</span>
                </span>
              </div>
            )}
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
        background: 'linear-gradient(135deg, var(--si-bg) 0%, var(--si-bg-soft) 100%)',
      }}>
        {/* Left panel — branding */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(145deg, #143268 0%, #3157d5 58%, #0f766e 100%)',
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

          <HireUpTextBrand />

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
              { icon: 'play', key: 'feature1' },
              { icon: 'barChart', key: 'feature2' },
              { icon: 'brain', key: 'feature3' },
              { icon: 'briefcase', key: 'feature4' },
            ].map(f => (
              <div key={f.key} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '0.65rem 1rem',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <Icon name={f.icon} size={18} />
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
          backgroundColor: 'var(--si-surface)',
          boxShadow: '-4px 0 24px rgba(16,32,51,0.08)',
        }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            {authTab === 'signup' && <FullHireUpLogo isMobile={false} />}
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
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>
        {/* ─── Navbar ───────────────────────────────────── */}
        <nav style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid var(--si-border)',
          boxShadow: '0 1px 10px rgba(16,32,51,0.06)',
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
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
              <NavBrandLockup isMobile={isMobile} />
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
                <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} />
              </button>
            ) : (
              /* Desktop nav */
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {role === 'candidate' ? (
                    <>
                      <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}><span className="si-icon-text"><Icon name="home" size={16} />{t('navDashboard')}</span></NavLink>
                      <NavLink to="/prepare" style={({ isActive }) => navLinkStyle(isActive)}><span className="si-icon-text"><Icon name="play" size={16} />{t('navPractice')}</span></NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}><span className="si-icon-text"><Icon name="home" size={16} />{t('navRecruiterDashboard')}</span></NavLink>
                      <NavLink to="/questions" style={({ isActive }) => navLinkStyle(isActive)}><span className="si-icon-text"><Icon name="clipboard" size={16} />{t('navQuestionGenerator')}</span></NavLink>
                    </>
                  )}
                </div>

                <button onClick={handleSwitchRole} style={switchBtnStyle}>
                  <span className="si-icon-text"><Icon name="refresh" size={16} />{role === 'candidate' ? t('switchToRecruiter') : t('switchToCandidate')}</span>
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
                    <span className="si-icon-text"><Icon name="user" size={16} />{username === 'Guest' ? t('guest') : username} <Icon name="chevronDown" size={14} /></span>
                  </button>
                  {menuOpen && <UserDropdown onClose={() => setMenuOpen(false)} onLogout={handleLogout} t={t} isRtl={language === 'he'} />}
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
                  <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}><span className="si-icon-text"><Icon name="home" size={16} />{t('navDashboard')}</span></NavLink>
                  <NavLink to="/prepare" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}><span className="si-icon-text"><Icon name="play" size={16} />{t('navPractice')}</span></NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}><span className="si-icon-text"><Icon name="home" size={16} />{t('navRecruiterDashboard')}</span></NavLink>
                  <NavLink to="/questions" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}><span className="si-icon-text"><Icon name="clipboard" size={16} />{t('navQuestionGenerator')}</span></NavLink>
                </>
              )}
              <NavLink to="/settings" onClick={() => setMobileMenuOpen(false)} style={({ isActive }) => mobileNavLinkStyle(isActive)}><span className="si-icon-text"><Icon name="settings" size={16} />{t('navSettings')}</span></NavLink>
              <button onClick={handleSwitchRole} style={{ ...mobileNavLinkStyle(false), textAlign: 'start', border: 'none', cursor: 'pointer', width: '100%' }}>
                <span className="si-icon-text"><Icon name="refresh" size={16} />{role === 'candidate' ? t('switchToRecruiter') : t('switchToCandidate')}</span>
              </button>
              <button
                onClick={handleLogout}
                style={{ ...mobileNavLinkStyle(false), textAlign: 'start', border: 'none', cursor: 'pointer', color: '#dc2626', width: '100%' }}
              >
                <span className="si-icon-text"><Icon name="logOut" size={16} />{t('navLogout')}</span>
              </button>
            </div>
          )}
        </nav>

        {/* ─── Page Content ───────────────────────────────── */}
        <main style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '1rem' : '2rem 1.5rem 3rem',
        }}>
          <Routes>
            <Route path="/" element={<HomeRoute role={role} />} />
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
