import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language, setLanguage, t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
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

  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  const persistSetting = (key, value) => {
    localStorage.setItem(key, String(value));
    setSaved(true);
    setSaveTimeout(prev => {
      if (prev) clearTimeout(prev);
      return setTimeout(() => setSaved(false), 2000);
    });
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
      if (!res.ok) throw new Error('Account deletion failed.');
      document.documentElement.style.fontSize = '16px';
      document.body.style.filter = 'none';
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem(`cached-cv-${activeUserId}`);
      localStorage.removeItem(`cached-jd-${activeUserId}`);
      localStorage.removeItem(`pref-auto-save-cv-${activeUserId}`);
      sessionStorage.clear();
      window.location.replace('/');
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
            ⚙️ {t('settingsTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            {t('settingsSubtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#fff', color: '#64748b',
            padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: '700',
            border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.85rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            direction: 'ltr',
          }}
        >
          <span>←</span>
          <span>{t('settingsDashboardBtn')}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>{username === 'Guest' ? t('guest') : username}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: '0.15rem' }}>
                {t('settingsLoggedInAs')}{role === 'candidate' ? t('roleCandidate') : role === 'interviewer' ? t('roleInterviewer') : role}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: '700', color: '#4f46e5',
            backgroundColor: '#f5f3ff', border: '1px solid #e0d9ff',
            padding: '0.3rem 0.8rem', borderRadius: '20px', whiteSpace: 'nowrap',
          }}>
            {t('settingsActiveSession')}
          </span>
        </div>

        {/* Layout Grid: Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Section 0: Interface Language */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e2e8f0', padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              🌐 {t('settingsInterfaceLang')}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { code: 'en', label: t('settingsLangEn') },
                { code: 'he', label: t('settingsLangHe') },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLanguage(code);
                    persistSetting('pref-lang', code);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: `2px solid ${language === code ? '#4f46e5' : '#e2e8f0'}`,
                    backgroundColor: language === code ? '#f5f3ff' : '#fff',
                    color: language === code ? '#4f46e5' : '#475569',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {language === code ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Accessibility & Speech */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e2e8f0', padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              ♿ {t('settingsAccessibilityTitle')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Font Size */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsFontSizeLabel')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsFontSizeDesc')}</div>
                </div>
                <select
                  value={fontSize}
                  onChange={e => {
                    const val = e.target.value;
                    setFontSize(val);
                    persistSetting('pref-font-size', val);
                  }}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem', fontWeight: '600', outline: 'none',
                    width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '150px',
                  }}
                >
                  <option value="small">{t('settingsFontSmall')}</option>
                  <option value="medium">{t('settingsFontMedium')}</option>
                  <option value="large">{t('settingsFontLarge')}</option>
                </select>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* High Contrast */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsHighContrast')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsHighContrastDesc')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => {
                    const val = e.target.checked;
                    setHighContrast(val);
                    persistSetting('pref-high-contrast', String(val));
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* STT Transcription Language */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsSttLangLabel')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsSttLangDesc')}</div>
                </div>
                <select
                  value={sttLang}
                  onChange={e => {
                    const val = e.target.value;
                    setSttLang(val);
                    persistSetting('pref-stt-lang', val);
                  }}
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
                  👨‍💻 {t('settingsCandidatePrefs')}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsReadinessTarget')}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsReadinessTargetDesc')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={readinessThreshold}
                      onChange={e => {
                        const val = e.target.value;
                        setReadinessThreshold(val);
                        persistSetting('pref-readiness-threshold', val);
                      }}
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
                  💼 {t('settingsRecruiterPrefs')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Brand Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsPdfBranding')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsPdfBrandingDesc')}</div>
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => {
                        const val = e.target.value;
                        setCompanyName(val);
                        persistSetting('pref-recruiter-company', val);
                      }}
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
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{t('settingsDefaultQCount')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('settingsDefaultQCountDesc')}</div>
                    </div>
                    <select
                      value={defaultQuestions}
                      onChange={e => {
                        const val = e.target.value;
                        setDefaultQuestions(val);
                        persistSetting('pref-recruiter-qcount', val);
                      }}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontWeight: '600', outline: 'none',
                        width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'unset' : '180px',
                      }}
                    >
                      <option value="3">{t('settingsQCount3')}</option>
                      <option value="5">{t('settingsQCount5')}</option>
                      <option value="10">{t('settingsQCount10')}</option>
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
            ✓ {t('settingsSavedMsg')}
          </div>
        )}

      </div>

      {/* Danger Zone */}
      <div style={{
        marginTop: '2.5rem', backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #fecaca', padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#b91c1c', margin: '0 0 0.25rem 0' }}>
          ⚠️ {t('settingsDangerZone')}
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0 0 1.25rem 0' }}>
          {t('settingsDangerDesc')}
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
            {t('settingsDeleteBtn')}
          </button>
        ) : (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#991b1b', margin: '0 0 0.75rem 0' }}>
              {t('settingsDeleteConfirmText')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('settingsCancel')}
              </button>
              <button
                onClick={handleDeleteAllData}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                {t('settingsDeleteYes')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
