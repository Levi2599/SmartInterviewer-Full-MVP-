import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAuthHeaders } from '../utils/auth';

const INDIGO = '#4f46e5';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [saved, setSaved] = useState(false);
  const [role] = useState(() => localStorage.getItem('role') || 'candidate');
  const [username] = useState(() => localStorage.getItem('username') || 'User');
  const [userId] = useState(() => localStorage.getItem('userId'));

  // Accessibility Settings
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('pref-font-size') || 'medium');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('pref-high-contrast') === 'true');
  const [sttLang, setSttLang] = useState(() => localStorage.getItem('pref-stt-lang') || 'en-US');

  // Candidate Settings
  const [readinessThreshold, setReadinessThreshold] = useState(() => localStorage.getItem('pref-readiness-threshold') || '75');

  // Interviewer Settings
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('pref-recruiter-company') || 'SmartInterviewer');
  const [defaultQuestions, setDefaultQuestions] = useState(() => localStorage.getItem('pref-recruiter-qcount') || '5');

  // Apply visual changes in real-time
  const applyAccessibility = (size, contrast) => {
    // Font size scaling
    if (size === 'small') document.documentElement.style.fontSize = '14px';
    else if (size === 'large') document.documentElement.style.fontSize = '18px';
    else document.documentElement.style.fontSize = '16px'; // medium

    // Contrast filter
    if (contrast) {
      document.body.style.filter = 'contrast(1.15) saturate(1.1)';
    } else {
      document.body.style.filter = 'none';
    }
  };

  useEffect(() => {
    applyAccessibility(fontSize, highContrast);
  }, [fontSize, highContrast]);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('pref-font-size', fontSize);
    localStorage.setItem('pref-high-contrast', String(highContrast));
    localStorage.setItem('pref-stt-lang', sttLang);
    
    if (role === 'candidate') {
      localStorage.setItem('pref-readiness-threshold', readinessThreshold);
    } else {
      localStorage.setItem('pref-recruiter-company', companyName);
      localStorage.setItem('pref-recruiter-qcount', defaultQuestions);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAllData = async () => {
    try {
      const activeUserId = userId || 'user-001';
      const res = await fetch(`/api/progress/${activeUserId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Data deletion failed.');
      document.documentElement.style.fontSize = '16px';
      document.body.style.filter = 'none';
      localStorage.clear();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message);
      setDeleteConfirm(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ⚙️ App Settings
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Configure your accessibility, language inputs, and role preferences.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#fff', color: '#64748b',
            padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: '700',
            border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.85rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          ← Dashboard
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Card */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: '50%',
              backgroundColor: '#f5f3ff', color: INDIGO, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 'bold',
              flexShrink: 0,
            }}>
              {role === 'candidate' ? '👨‍💻' : '💼'}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: '0.15rem' }}>
                Logged in as {role}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: '700', color: '#4f46e5',
            backgroundColor: '#f5f3ff', border: '1px solid #e0d9ff',
            padding: '0.3rem 0.8rem', borderRadius: '20px', whiteSpace: 'nowrap',
          }}>
            Active Session
          </span>
        </div>

        {/* Layout Grid: Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Accessibility & Speech */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e2e8f0', padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              ♿ Accessibility & Input Settings
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Font Size */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Font Size Scaling</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Resize typography across the interface.</div>
                </div>
                <select
                  value={fontSize}
                  onChange={e => setFontSize(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem', fontWeight: '600', outline: 'none',
                    width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '150px',
                  }}
                >
                  <option value="small">Small (14px)</option>
                  <option value="medium">Medium (16px)</option>
                  <option value="large">Large (18px)</option>
                </select>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* High Contrast */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>High Contrast Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Increase saturation for easier reading.</div>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => setHighContrast(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* STT Transcription Language */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Speech-to-Text Language</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure candidate mic voice recognition.</div>
                </div>
                <select
                  value={sttLang}
                  onChange={e => setSttLang(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem', fontWeight: '600', outline: 'none',
                    width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '150px',
                  }}
                >
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="he-IL">🇮🇱 Hebrew (IL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Role customized sector */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e2e8f0', padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            {role === 'candidate' ? (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  👨‍💻 Candidate Preferences
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Target Readiness Score</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Define your personal interview success score target.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={readinessThreshold}
                      onChange={e => setReadinessThreshold(e.target.value)}
                      style={{ cursor: 'pointer', width: isMobile ? '100%' : '120px' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#4f46e5', minWidth: '35px', textAlign: 'right' }}>
                      {readinessThreshold}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  💼 Recruiter Template Configurations
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Brand Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Company PDF branding</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Title used as document header for printed PDFs.</div>
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                        fontSize: '0.9rem', outline: 'none', fontWeight: '600',
                        width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '180px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

                  {/* Question Counts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Default Question Count</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Number of AI questions generated per template request.</div>
                    </div>
                    <select
                      value={defaultQuestions}
                      onChange={e => setDefaultQuestions(e.target.value)}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontWeight: '600', outline: 'none',
                        width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '180px',
                      }}
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions (Default)</option>
                      <option value="10">10 Questions</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success banner */}
        {saved && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}>
            ✓ Settings saved successfully!
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          style={{
            padding: '1rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            marginTop: '0.5rem', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.opacity = '0.92'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          ✓ Save Settings
        </button>
      </form>

      {/* Danger Zone */}
      <div style={{
        marginTop: '2.5rem', backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #fecaca', padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#b91c1c', margin: '0 0 0.25rem 0' }}>
          ⚠️ Danger Zone
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0 0 1.25rem 0' }}>
          Irreversible security options. Delete your profile database records and reset cache.
        </p>
        {deleteError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
            ⚠️ {deleteError}
          </div>
        )}

        {!deleteConfirm ? (
          <button
            onClick={() => { setDeleteError(''); setDeleteConfirm(true); }}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: '8px',
              backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
              fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#fecaca'}
            onMouseLeave={e => e.target.style.backgroundColor = '#fee2e2'}
          >
            Delete My Account & Data Permanently
          </button>
        ) : (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#991b1b', margin: '0 0 0.75rem 0' }}>
              This will permanently delete your profile, all simulation history, and B2B guides. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
