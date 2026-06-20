import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';

export default function App() {
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

          {/* Nav Links */}
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