import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';
import RecruiterDashboard from './questionBank/RecruiterDashboard';
import SettingsScreen from './settings/SettingsScreen';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'User');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'candidate');

  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await window.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: inputUsername,
          password: inputPassword,
          role: selectedRole 
        }),
      });
      if (!res.ok) throw new Error('Authentication failed.');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      setToken(data.token);
      setUserId(data.userId);
      setUsername(data.username);
      setRole(data.role);
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
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) throw new Error('Authentication failed.');
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
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(79, 70, 229, 0.1)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>Sign in to access your interview simulator and recruiter portal.</p>

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
            {/* Role Selection Cards */}
            <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>SELECT YOUR ROLE</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div
                  onClick={() => setSelectedRole('candidate')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: `2px solid ${selectedRole === 'candidate' ? '#4f46e5' : '#e2e8f0'}`,
                    backgroundColor: selectedRole === 'candidate' ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.25rem' }}>👨‍💻</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: selectedRole === 'candidate' ? '#4f46e5' : '#475569' }}>Candidate</span>
                </div>
                <div
                  onClick={() => setSelectedRole('interviewer')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: `2px solid ${selectedRole === 'interviewer' ? '#4f46e5' : '#e2e8f0'}`,
                    backgroundColor: selectedRole === 'interviewer' ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.25rem' }}>💼</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: selectedRole === 'interviewer' ? '#4f46e5' : '#475569' }}>Interviewer</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>USERNAME / EMAIL</label>
              <input
                type="text"
                placeholder="Enter your username or email"
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

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={inputPassword}
                onChange={e => setInputPassword(e.target.value)}
                disabled={loading}
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
                marginTop: '0.5rem',
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
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {role === 'candidate' ? (
                <>
                  <NavLink
                    to="/"
                    end
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
                    🏠 Dashboard
                  </NavLink>
                  <NavLink
                    to="/prepare"
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
                    🚀 Practice Simulation
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/"
                    end
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
                    🏠 Recruiter Dashboard
                  </NavLink>
                  <NavLink
                    to="/questions"
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
                    📋 Question Generator
                  </NavLink>
                </>
              )}
            </div>

            <button
              onClick={() => {
                const newRole = role === 'candidate' ? 'interviewer' : 'candidate';
                localStorage.setItem('role', newRole);
                window.location.href = '/';
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: '#f5f3ff',
                color: '#4f46e5',
                border: '1px solid #e0d9ff',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              🔄 Switch to {role === 'candidate' ? 'Recruiter' : 'Candidate'}
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
                  transition: 'all 0.15s',
                }}
              >
                👤 {username} <span style={{ fontSize: '0.7rem' }}>▼</span>
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, marginTop: '0.5rem',
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  width: '150px', zIndex: 200, display: 'flex', flexDirection: 'column',
                  padding: '0.4rem 0',
                }}>
                  <NavLink
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '0.5rem 1rem', textDecoration: 'none', color: '#334155',
                      fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center',
                      gap: '0.5rem', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>⚙️ Settings</span>
                  </NavLink>
                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0.3rem 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '0.5rem 1rem', background: 'none', border: 'none',
                      color: '#dc2626', fontSize: '0.85rem', fontWeight: '700',
                      textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: '0.5rem', width: '100%',
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
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