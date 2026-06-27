import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#f5f3ff';

function RecruiterStatCard({ label, value, icon, sub }) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '14px',
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '1.25rem', flex: '1 1 200px', minWidth: '180px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  );
}

export default function RecruiterDashboard() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const translateSeniority = (level) => {
    if (!level) return '';
    const lvl = String(level).trim().toLowerCase();
    if (lvl === 'junior') return t('qbSeniorityJunior');
    if (lvl === 'mid') return t('qbSeniorityMid');
    if (lvl === 'senior') return t('qbSenioritySenior');
    return level;
  };

  const fetchGuides = async (signal) => {
    const startTime = Date.now();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/questionBank', { headers: getAuthHeaders(), signal, cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to retrieve question guides.');
      const data = await res.json();
      
      // Enforce a minimum 800ms loading duration for a smooth visual transition
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 800 - elapsed);
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }

      setGuides(data);
      setLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimeoutId = null;
    fetchGuides(controller.signal);

    // Refresh data when user returns to the dashboard tab
    const handleFocusEvent = () => {
      fetchGuides(controller.signal);
    };
    window.addEventListener('focus', handleFocusEvent);

    // Also re-fetch whenever another screen fires the global refresh event.
    // Implement a 1000ms delay to ensure backend writes are fully saved/indexed.
    const handleRefreshEvent = () => {
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      refreshTimeoutId = setTimeout(() => {
        fetchGuides(controller.signal);
      }, 1000);
    };
    window.addEventListener('dashboard:refresh', handleRefreshEvent);

    return () => {
      controller.abort();
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      window.removeEventListener('focus', handleFocusEvent);
      window.removeEventListener('dashboard:refresh', handleRefreshEvent);
    };
    // location.key changes on every navigation — guarantees a fresh fetch whenever
    // the user arrives at this route, even if the component instance is reused.
  }, [location.key]);

  const handleDeleteRequest = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    setError('');
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      const res = await fetch(`/api/questionBank/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete guide.');
      setGuides(prev => prev.filter(g => g.question_id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportPDF = (id, e) => {
    e.stopPropagation();
    const brand = localStorage.getItem('pref-recruiter-company') || 'SmartInterviewer AI';
    window.open(`/api/questionBank/export/${id}?format=pdf&brand=${encodeURIComponent(brand)}`, '_blank');
  };

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '5rem 2rem', gap: '1rem',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: '44px', height: '44px', border: '4px solid #e0d9ff',
        borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{ fontWeight: '600', color: '#64748b' }}>{t('recruiterLoadingGuides')}</div>
    </div>
  );

  if (error) return (
    <div style={{
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', padding: '1rem', borderRadius: '10px', fontWeight: '500',
    }}>
      ⚠️ {error}
    </div>
  );

  const totalQuestions = guides.reduce((sum, g) => sum + (g.questions_array?.length || 0), 0);
  const hoursSaved = guides.length * 1.5;
  const displayHours = Number.isInteger(hoursSaved) ? hoursSaved : hoursSaved.toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            📋 {t('recruiterDashTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            {t('recruiterDashSubtitle')}
          </p>
        </div>
        {guides.length > 0 && (
          <button
            onClick={() => navigate('/questions')}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '0.75rem 1.5rem', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <span>{t('recruiterCreateNewGuide')}</span>
            <span>📋</span>
          </button>
        )}
      </div>

      {guides.length === 0 ? (
        /* Clean centered Empty State Card for Recruiter */
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '3rem' }}>📋</span>
          <h2 style={{ marginTop: '1rem', color: '#1e293b', fontWeight: '800' }}>
            {t('recruiterNoGuidesTitle')}
          </h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '380px', margin: '0.5rem auto 1.5rem' }}>
            {t('recruiterNoGuidesDesc')}
          </p>
          <button
            onClick={() => navigate('/questions')}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '0.75rem 2rem', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            }}
          >
            {t('recruiterGenerateFirstBtn')}
          </button>
        </div>
      ) : (
        <>
          {/* Recruiter Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <RecruiterStatCard label={t('recruiterActivePositions')} value={guides.length} icon="💼" sub={t('recruiterGuidesSaved')} />
            <RecruiterStatCard label={t('recruiterTotalQs')} value={totalQuestions} icon="❓" sub={t('recruiterAcrossTemplates')} />
            <RecruiterStatCard
              label={t('recruiterRoiLabel')}
              value={t('recruiterRoiValue').replace('{hours}', displayHours)}
              icon="⚡"
              sub={t('recruiterRoiSub')}
            />
          </div>

          {/* Guides Grid/Table */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            padding: '1.5rem',
          }}>
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
              {t('recruiterActiveGuides')}
            </h2>

            {pendingDeleteId && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#991b1b', margin: '0 0 0.75rem 0' }}>
                  {t('recruiterDeleteConfirmText')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {t('recruiterCancelBtn')}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    style={{ flex: 2, padding: '0.55rem', borderRadius: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {t('recruiterDeleteGuideBtn')}
                  </button>
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColPosition')}</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColIndustry')}</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColLevel')}</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColQuestions')}</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColDate')}</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'end' }}>{t('recruiterColActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {guides.map((g) => (
                    <tr key={g.question_id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => navigate('/questions', { state: { resumeGuide: g } })}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>
                        💼 {g.job_role}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: '#64748b', fontSize: '0.85rem' }}>{g.industry}</td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
                        <span style={{
                          backgroundColor: '#f1f5f9', color: '#475569',
                          padding: '0.2rem 0.5rem', borderRadius: '4px'
                        }}>
                          {translateSeniority(g.seniority_level)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: '#4f46e5', fontWeight: '700', fontSize: '0.85rem' }}>
                        {g.questions_array?.length || 0} {language === 'he' ? 'שאלות' : 'questions'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {new Date(g.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'end' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => handleExportPDF(g.question_id, e)}
                            title={language === 'he' ? 'הורד PDF' : 'Download PDF'}
                            style={{
                              padding: '0.35rem 0.6rem', borderRadius: '6px',
                              backgroundColor: '#fff', border: '1px solid #e2e8f0',
                              cursor: 'pointer', fontSize: '0.8rem',
                            }}
                          >
                            📄 PDF
                          </button>
                          <button
                            onClick={(e) => handleDeleteRequest(g.question_id, e)}
                            title={language === 'he' ? 'מחק מדריך' : 'Delete Guide'}
                            style={{
                              padding: '0.35rem 0.6rem', borderRadius: '6px',
                              backgroundColor: '#fee2e2', color: '#dc2626',
                              border: '1px solid #fecaca', cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
