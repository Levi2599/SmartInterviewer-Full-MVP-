import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'User');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));

  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await window.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUsername }),
      });
      if (!res.ok) throw new Error('Authentication failed.');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      setToken(data.token);
      setUserId(data.userId);
      setUsername(data.username);
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
      const res = await window.fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Authentication failed.');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', 'Guest');
      setToken(data.token);
      setUserId(data.userId);
      setUsername('Guest');
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
    setToken(null);
    setUserId(null);
    setUsername('User');
  };

  if (!token) {
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
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(79, 70, 229, 0.1)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              🎯
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
              Smart<span style={{ color: '#4f46e5' }}>Interviewer</span>
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Welcome to SmartInterviewer</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Sign in to access your interview simulator and recruiter portal.</p>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', padding: '0.75rem', borderRadius: '10px',
              fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>USERNAME</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={inputUsername}
                onChange={e => setInputUsername(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%', padding: '0.65rem 0.875rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputUsername.trim()}
              style={{
                width: '100%', padding: '0.75rem',
                background: (!loading && inputUsername.trim()) ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
                color: (!loading && inputUsername.trim()) ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: '10px', fontWeight: '700',
                cursor: (!loading && inputUsername.trim()) ? 'pointer' : 'default',
                boxShadow: (!loading && inputUsername.trim()) ? '0 4px 12px rgba(79,70,229,0.2)' : 'none',
                marginTop: '0.25rem',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ padding: '0 0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            style={{
              width: '100%', padding: '0.75rem',
              backgroundColor: '#f8fafc', color: '#475569',
              border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            Continue as Guest
          </button>
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
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}>
              Smart<span style={{ color: '#4f46e5' }}>Interviewer</span>
            </span>
          </NavLink>

          {/* Nav Links & User Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[
                { to: '/', label: '🏠 Home', exact: true },
                { to: '/questions', label: '📋 Question Bank' },
                { to: '/progress', label: '📊 My Progress' },
              ].map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  style={({ isActive }) => ({
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: isActive ? '#4f46e5' : '#64748b',
                    backgroundColor: isActive ? '#f5f3ff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    border: isActive ? '1px solid #e0d9ff' : '1px solid transparent',
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* User Pill & Logout */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem',
            }}>
              <span style={{
                fontSize: '0.85rem', fontWeight: '700', color: '#475569',
                backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '20px',
              }}>
                👤 {username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '8px',
                  backgroundColor: '#fee2e2', color: '#dc2626',
                  border: '1px solid #fecaca', fontSize: '0.8rem', fontWeight: '700',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Page Content ───────────────────────────────── */}
        <main style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
        }}>
          <Routes>
            <Route path="/" element={<UploadResumeForm />} />
            <Route path="/simulator" element={<SimulatorScreen />} />
            <Route path="/questions" element={<QuestionBankScreen />} />
            <Route path="/progress" element={<ProgressDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}