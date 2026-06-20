import React, { useState } from 'react';
import InterviewGuideExport from './InterviewGuideExport';

const styles = {
  layout: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#475569' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem' },
  textarea: { width: '100%', height: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' },
  button: { backgroundColor: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  loading: { color: '#64748b', fontWeight: '500' },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '6px' },
  questionItem: { borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' },
  metaContainer: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  tag: { fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  spinnerText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  }
};

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
  const [questionCount, setQuestionCount] = useState(3);
  const [jdText, setJdText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionBankId, setQuestionBankId] = useState(null);
  const [questions, setQuestions] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading('מייצר את בנק השאלות המותאם אישית עבורך...');
    setError('');
    setQuestions([]);
    try {
      const res = await fetch('/api/questionBank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: jobRole,
          industry,
          seniority_level: seniorityLevel,
          jd_text: jdText,
          question_count: Number(questionCount),
        }),
      });
      if (!res.ok) throw new Error('Could not assemble target criteria details.');
      const data = await res.json();
      setQuestionBankId(data.question_bank_id);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.layout}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Generate Target Interview Blueprint</h2>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Job Title / Role</label>
              <input style={styles.input} type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Frontend Developer" required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Industry Focus</label>
              <input style={styles.input} type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. FinTech" required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Seniority Level</label>
              <select style={styles.input} value={seniorityLevel} onChange={(e) => setSeniorityLevel(e.target.value)}>
                <option value="Junior">Junior Track</option>
                <option value="Mid">Mid Profile</option>
                <option value="Senior">Senior Leadership</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Target Count</label>
              <input style={styles.input} type="number" min="1" max="10" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Contextual Job Description (Optional)</label>
            <textarea style={styles.textarea} value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste additional specification criteria details..." />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Assembling Guide Blueprint...' : 'Compile Question Blueprint'}
          </button>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading && (
        <div style={styles.spinnerContainer}>
          <style>{spinnerKeyframes}</style>
          <svg width="50" height="50" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="#e2e8f0" strokeWidth="5" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="#2563eb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
          <div style={styles.spinnerText}>{loading}</div>
        </div>
      )}

      {questions.length > 0 && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Compiled Questions</h3>
            <InterviewGuideExport question_bank_id={questionBankId} />
          </div>
          <div>
            {questions.map((q, idx) => (
              <div key={idx} style={styles.questionItem}>
                <p style={{ fontWeight: '600', fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#1e293b' }}>{idx + 1}. {q.text}</p>
                <div style={styles.metaContainer}>
                  {q.type && <span style={{ ...styles.tag, backgroundColor: q.type === 'technical' ? '#fee2e2' : '#fef3c7', color: q.type === 'technical' ? '#991b1b' : '#92400e' }}>Type: {q.type}</span>}
                  {q.competency && <span style={styles.tag}>Competency: {q.competency}</span>}
                  {q.methodology_expectation && <span style={{ ...styles.tag, backgroundColor: '#e0f2fe', color: '#0369a1' }}>Method: {q.methodology_expectation}</span>}
                  {q.hr_keywords && <span style={{ ...styles.tag, backgroundColor: '#f0fdf4', color: '#166534' }}>Keywords: {Array.isArray(q.hr_keywords) ? q.hr_keywords.join(', ') : String(q.hr_keywords)}</span>}
                </div>
                {q.red_flags && q.red_flags.length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #ef4444', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#dc2626' }}>Red Flags to Watch For:</span>
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#b91c1c' }}>
                      {q.red_flags.map((f, fIdx) => <li key={fIdx}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {q.follow_ups && q.follow_ups.length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #cbd5e1' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Probing Follow-Ups:</span>
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
                      {q.follow_ups.map((f, fIdx) => <li key={fIdx}>{f}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}