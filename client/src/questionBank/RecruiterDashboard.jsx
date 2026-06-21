import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const fetchGuides = async () => {
    try {
      const res = await fetch('/api/questionBank');
      if (!res.ok) throw new Error('Failed to retrieve question guides.');
      const data = await res.json();
      setGuides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this guide permanently?')) return;
    try {
      const res = await fetch(`/api/questionBank/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete guide.');
      setGuides(prev => prev.filter(g => g.question_id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportPDF = (id, e) => {
    e.stopPropagation();
    const brand = localStorage.getItem('pref-recruiter-company') || 'SmartInterviewer AI';
    window.open(`/api/questionBank/export/${id}?format=pdf&brand=${encodeURIComponent(brand)}`, '_blank');
  };

  const handleExportJSON = (id, e) => {
    e.stopPropagation();
    window.open(`/api/questionBank/export/${id}`, '_blank');
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
      <div style={{ fontWeight: '600', color: '#64748b' }}>Loading recruiter guides...</div>
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
            📋 Recruiter Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Manage your generated interview guides and question templates.
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
          <span>Create New Guide</span>
          <span>📋</span>
        </button>
      </div>

      {/* Recruiter Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <RecruiterStatCard
          label="ACTIVE POSITION GUIDES"
          value={guides.length}
          icon="💼"
          sub="guides saved in DB"
        />
        <RecruiterStatCard
          label="TOTAL GENERATED QUESTIONS"
          value={totalQuestions}
          icon="❓"
          sub="across all templates"
        />
        <RecruiterStatCard
          label="PDF EXPORTS ACTIVE"
          value="100%"
          icon="📄"
          sub="styled print ready templates"
        />
      </div>

      {/* Guides Grid/Table */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '1.5rem',
      }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
          Active Job Interview Guides
        </h2>

        {guides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📂</span>
            <h3 style={{ color: '#64748b', fontSize: '1rem', fontWeight: '600', marginTop: '0.75rem' }}>
              No guides generated yet
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '320px', margin: '0.25rem auto 1.25rem' }}>
              Create your first B2B question bank guide using the AI generator.
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
              Generate First Guide
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Position / Job Role</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Industry</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Level</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Questions</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Date Created</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
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
                          onClick={(e) => handleExportJSON(g.question_id, e)}
                          title="Download JSON"
                          style={{
                            padding: '0.35rem 0.6rem', borderRadius: '6px',
                            backgroundColor: '#fff', border: '1px solid #e2e8f0',
                            cursor: 'pointer', fontSize: '0.8rem',
                          }}
                        >
                          ⚙️ JSON
                        </button>
                        <button
                          onClick={(e) => handleDelete(g.question_id, e)}
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
