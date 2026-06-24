import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { t } = useLanguage();

  const fetchGuides = async () => {
    try {
      const cached = sessionStorage.getItem('recruiterGuides');
      const cachedTime = sessionStorage.getItem('recruiterGuidesTime');
      if (cached && cachedTime && (Date.now() - Number(cachedTime)) < 2 * 60 * 1000) {
        setGuides(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch (_) {}

    try {
      const res = await fetch('/api/questionBank', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve question guides.');
      const data = await res.json();
      setGuides(data);
      try {
        sessionStorage.setItem('recruiterGuides', JSON.stringify(data));
        sessionStorage.setItem('recruiterGuidesTime', String(Date.now()));
      } catch (_) {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleDeleteRequest = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      const res = await fetch(`/api/questionBank/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete guide.');
      setGuides(prev => prev.filter(g => g.question_id !== id));
      sessionStorage.removeItem('recruiterGuides');
      sessionStorage.removeItem('recruiterGuidesTime');
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
      </div>

      {/* Recruiter Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <RecruiterStatCard label={t('recruiterActivePositions')} value={guides.length} icon="💼" sub={t('recruiterGuidesSaved')} />
        <RecruiterStatCard label={t('recruiterTotalQs')} value={totalQuestions} icon="❓" sub={t('recruiterAcrossTemplates')} />
        <RecruiterStatCard label={t('recruiterPdfActive')} value="100%" icon="📄" sub={t('recruiterPrintReady')} />
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

        {guides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📂</span>
            <h3 style={{ color: '#64748b', fontSize: '1rem', fontWeight: '600', marginTop: '0.75rem' }}>
              {t('recruiterNoGuidesTitle')}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '320px', margin: '0.25rem auto 1.25rem' }}>
              {t('recruiterNoGuidesDesc')}
            </p>
            <button
              onClick={() => navigate('/questions')}
              style={{
                backgroundColor: INDIGO_LIGHT, color: INDIGO,
                border: `1px solid #e0d9ff`, borderRadius: '8px',
                padding: '0.5rem 1.25rem', fontWeight: '700', fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {t('recruiterGenerateFirstBtn')}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColPosition')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColIndustry')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColLevel')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColQuestions')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('recruiterColDate')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>{t('recruiterColActions')}</th>
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
                        {g.seniority_level}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#4f46e5', fontWeight: '700', fontSize: '0.85rem' }}>
                      {g.questions_array?.length || 0} questions
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(g.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => handleExportPDF(g.question_id, e)}
                          title="Download PDF"
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
                          title="Delete Guide"
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
        )}
      </div>
    </div>
  );
}
