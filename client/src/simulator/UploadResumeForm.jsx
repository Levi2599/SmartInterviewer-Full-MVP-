import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  textarea: {
    width: '100%',
    height: '150px',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontWeight: '500',
  },
};

export default function UploadResumeForm() {
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cvText.trim() || !jdText.trim()) {
      setError('Both the CV text and Job Description text are required to begin the simulation.');
      return;
    }
    setError('');
    navigate('/simulator', { state: { cv_text: cvText, jd_text: jdText } });
  };

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' }}>Setup Interview Simulation</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Paste your CV / Resume Text</label>
          <textarea
            style={styles.textarea}
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Experience, stack, and active duties..."
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Paste Target Job Description (JD)</label>
          <textarea
            style={styles.textarea}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Core competencies, frameworks, and requirements..."
          />
        </div>
        <button type="submit" style={styles.button}>Start AI Interview Simulator</button>
      </form>
    </div>
  );
}