import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#f5f3ff';

const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function QuestionBankScreen() {
  const [jobRole, setJobRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('Mid');
  const [questionCount, setQuestionCount] = useState(() => Number(localStorage.getItem('pref-recruiter-qcount') || '5'));
  const [jdText, setJdText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [questionBankId, setQuestionBankId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [basket, setBasket] = useState([]);
  const [exporting, setExporting] = useState(false);

  const { t, language } = useLanguage();
  const location = useLocation();

  // Cache eviction: clear recruiter dashboard cache on mount and unmount
  // so that any navigation away from this screen forces a fresh DB fetch.
  useEffect(() => {
    sessionStorage.removeItem('recruiterGuides');
    sessionStorage.removeItem('recruiterGuidesTime');
    return () => {
      sessionStorage.removeItem('recruiterGuides');
      sessionStorage.removeItem('recruiterGuidesTime');
    };
  }, []);

  useEffect(() => {
    if (location.state && location.state.resumeGuide) {
      const g = location.state.resumeGuide;
      setJobRole(g.job_role || '');
      setIndustry(g.industry || '');
      setSeniorityLevel(g.seniority_level || 'Mid');
      setQuestions(g.questions_array || []);
      setBasket(g.questions_array || []);
      setQuestionBankId(g.question_id);
    }
  }, [location.state]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setQuestions([]);
    setBasket([]);
    try {
      const res = await fetch('/api/questionBank/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          job_role: jobRole,
          industry,
          seniority_level: seniorityLevel,
          jd_text: jdText,
          question_count: Number(questionCount),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate questions.');
      setQuestionBankId(data.question_bank_id);
      setQuestions(data.questions || []);

      // Cache eviction: clear recruiter guides cache on successful generation
      sessionStorage.removeItem('recruiterGuides');
      sessionStorage.removeItem('recruiterGuidesTime');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToBasket = (q) => {
    setBasket(prev => prev.find(b => b.text === q.text) ? prev : [...prev, q]);
  };

  const removeFromBasket = (idx) => {
    setBasket(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExport = async () => {
    if (!questionBankId) return;
    setExporting('pdf');
    setExportError('');
    try {
      const brand = localStorage.getItem('pref-recruiter-company') || 'SmartInterviewer AI';
      const res = await fetch(`/api/questionBank/export/${questionBankId}?format=pdf&brand=${encodeURIComponent(brand)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Export failed.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'interview-guide.pdf');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{spinnerKeyframes}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            📋 {t('qbPageTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            {t('qbPageSubtitle')}
          </p>
        </div>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#fff', color: '#64748b',
            padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: '700',
            border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: '0.9rem',
            direction: 'ltr',
          }}
        >
          <span>←</span>
          <span>{t('qbBackDashboard')}</span>
        </Link>
      </div>

      {/* Filters Card */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '1.5rem',
      }}>
        <form onSubmit={handleGenerate}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            {/* Job Role */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                {t('qbJobRoleLabel')}
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                placeholder={t('qbJobRolePlaceholder')}
                required
                style={{
                  width: '100%', padding: '0.65rem 0.875rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            {/* Industry */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                {t('qbIndustryLabel')}
              </label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder={t('qbIndustryPlaceholder')}
                required
                style={{
                  width: '100%', padding: '0.65rem 0.875rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            {/* Seniority */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                {t('qbSeniorityLabel')}
              </label>
              <select
                value={seniorityLevel}
                onChange={e => setSeniorityLevel(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', backgroundColor: '#fff', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="Junior">{t('qbSeniorityJunior')}</option>
                <option value="Mid">{t('qbSeniorityMid')}</option>
                <option value="Senior">{t('qbSenioritySenior')}</option>
              </select>
            </div>
            {/* Count */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                {t('qbQuestionCountLabel')}
              </label>
              <input
                type="number" min="1" max="10"
                value={questionCount}
                onChange={e => setQuestionCount(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Optional JD text */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              {t('qbOptionalJdLabel')}
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder={t('qbOptionalJdPlaceholder')}
              style={{
                width: '100%', height: '70px', padding: '0.65rem 0.875rem',
                borderRadius: '10px', border: '1.5px solid #e2e8f0',
                fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.5',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = INDIGO}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.9rem',
              background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontWeight: '700', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '18px', height: '18px',
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                {t('qbGeneratingBtn')}
              </>
            ) : t('qbGenerateQsBtn')}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', padding: '0.875rem 1rem',
          borderRadius: '10px', fontWeight: '500', fontSize: '0.9rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Split Layout */}
      {questions.length > 0 && (
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* LEFT – AI Generated Questions (65%) */}
          <div style={{ flex: '0 0 65%', minWidth: 0 }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '16px',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#fafafa',
              }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                  {t('qbAiQuestionsHeader')} ({questions.length})
                </span>
                <span style={{
                  fontSize: '0.75rem', color: INDIGO,
                  backgroundColor: INDIGO_LIGHT, padding: '0.2rem 0.6rem',
                  borderRadius: '6px', fontWeight: '600',
                }}>
                  {t('qbAddToBasket')}
                </span>
              </div>

              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questions.map((q, idx) => {
                  const isTechnical = q.type === 'technical';
                  const inBasket = basket.some(b => b.text === q.text);
                  return (
                    <div key={idx} style={{
                      backgroundColor: '#f8fafc',
                      border: `1px solid ${inBasket ? '#c7d2fe' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      position: 'relative',
                      transition: 'all 0.15s',
                    }}>
                      {/* Type tag + Add button row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* Type tag */}
                          <span style={{
                            fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            backgroundColor: isTechnical ? '#dbeafe' : '#dcfce7',
                            color: isTechnical ? '#1d4ed8' : '#166534',
                          }}>
                            {isTechnical ? `⚙️ ${t('qbTechnical')}` : `💬 ${t('qbBehavioral')}`}
                          </span>
                          {q.methodology_expectation && (
                            <span style={{
                              fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.6rem',
                              borderRadius: '20px', backgroundColor: INDIGO_LIGHT, color: INDIGO,
                            }}>
                              {q.methodology_expectation}
                            </span>
                          )}
                        </div>
                        {/* Add to basket button */}
                        <button
                          type="button"
                          onClick={() => addToBasket(q)}
                          disabled={inBasket}
                          style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            border: 'none', cursor: inBasket ? 'not-allowed' : 'pointer',
                            backgroundColor: inBasket ? '#e0d9ff' : '#3b82f6',
                            color: '#fff', fontWeight: '800', fontSize: '1.1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: inBasket ? 'none' : '0 2px 8px rgba(59,130,246,0.35)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {inBasket ? '✓' : '+'}
                        </button>
                      </div>

                      {/* Question text */}
                      <p style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e293b', margin: '0 0 0.6rem 0', lineHeight: '1.45' }}>
                        {idx + 1}. {q.text}
                      </p>

                      {/* Keywords */}
                      {q.hr_keywords && q.hr_keywords.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                          {(Array.isArray(q.hr_keywords) ? q.hr_keywords : String(q.hr_keywords).split(',')).map((kw, ki) => (
                            <span key={ki} style={{
                              fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                              backgroundColor: '#f1f5f9', color: '#475569',
                              borderRadius: '6px', fontWeight: '500',
                            }}>
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Red Flags */}
                      {q.red_flags && q.red_flags.length > 0 && (
                        <div style={{
                          marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                          backgroundColor: '#fef2f2', borderRadius: '8px',
                          borderLeft: '3px solid #ef4444',
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#dc2626', marginBottom: '0.25rem' }}>
                            🚩 {t('qbRedFlags')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#b91c1c', lineHeight: '1.4' }}>
                            {q.red_flags.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Follow-ups */}
                      {q.follow_ups && q.follow_ups.length > 0 && (
                        <div style={{
                          marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                          backgroundColor: '#f1f5f9', borderRadius: '8px',
                          borderLeft: '3px solid #94a3b8',
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>
                            🔍 {t('qbFollowUps')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                            {q.follow_ups.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT – Interview Basket (35%) */}
          <div style={{ flex: '0 0 35%', position: 'sticky', top: '80px', minWidth: 0 }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '16px',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}>
              {/* Basket header */}
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                  {t('qbBasketTitle')}
                </span>
                <span style={{
                  backgroundColor: INDIGO_LIGHT, color: INDIGO,
                  borderRadius: '20px', padding: '0.15rem 0.6rem',
                  fontSize: '0.78rem', fontWeight: '700',
                }}>
                  {basket.length} {t('qbSelected')}
                </span>
              </div>

              {/* Basket items */}
              <div style={{ padding: '0.75rem', minHeight: '120px' }}>
                {basket.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗃️</div>
                    {t('qbBasketEmpty')}<br />{t('qbBasketEmptyHint')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {basket.map((q, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        padding: '0.6rem 0.75rem',
                        backgroundColor: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}>
                        <p style={{ flex: 1, margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: '1.4', fontWeight: '500' }}>
                          {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromBasket(i)}
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                            border: 'none', cursor: 'pointer',
                            backgroundColor: '#f1f5f9', color: '#94a3b8',
                            fontWeight: '700', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.target.style.backgroundColor = '#fee2e2'; e.target.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.target.style.backgroundColor = '#f1f5f9'; e.target.style.color = '#94a3b8'; }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export */}
              {questionBankId && (
                <div style={{ padding: '0.75rem 0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {exportError && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: '500' }}>
                      ⚠️ Export error: {exportError}
                    </div>
                  )}
                  <button
                    onClick={() => handleExport()}
                    disabled={!!exporting}
                    style={{
                      width: '100%', padding: '0.75rem',
                      background: exporting === 'pdf' ? '#a7f3d0' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      fontWeight: '700', fontSize: '0.85rem', cursor: exporting ? 'not-allowed' : 'pointer',
                      boxShadow: exporting ? 'none' : '0 2px 8px rgba(16,185,129,0.2)',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                  >
                    {exporting === 'pdf' ? `⏳ ${t('qbExporting')}` : ` ${t('qbExportPdfBtn')}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}