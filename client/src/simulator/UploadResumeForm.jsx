import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#f5f3ff';
const BORDER = '#e2e8f0';

function UploadZone({ icon, label, mode, setMode, text, setText, isLoading, onFileUpload }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: `1px solid ${BORDER}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* Toggle Header */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
        backgroundColor: '#f8fafc',
      }}>
        <button
          type="button"
          onClick={() => setMode('paste')}
          style={{
            flex: 1,
            padding: '0.75rem',
            fontWeight: '600',
            fontSize: '0.8rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mode === 'paste' ? '#fff' : 'transparent',
            color: mode === 'paste' ? INDIGO : '#94a3b8',
            borderBottom: mode === 'paste' ? `2px solid ${INDIGO}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          ✏️ Paste Text
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            flex: 1,
            padding: '0.75rem',
            fontWeight: '600',
            fontSize: '0.8rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mode === 'upload' ? '#fff' : 'transparent',
            color: mode === 'upload' ? INDIGO : '#94a3b8',
            borderBottom: mode === 'upload' ? `2px solid ${INDIGO}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          📎 Upload File
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '1.25rem' }}>
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>{label}</span>
        </div>

        {mode === 'paste' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste your ${label} content here...`}
            style={{
              width: '100%',
              height: '150px',
              padding: '0.75rem',
              borderRadius: '10px',
              border: `1.5px solid ${BORDER}`,
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              color: '#334155',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = INDIGO}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        ) : (
          <div>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: '2px dashed #c7d2fe',
              borderRadius: '12px',
              padding: '2rem 1rem',
              cursor: isLoading ? 'default' : 'pointer',
              backgroundColor: INDIGO_LIGHT,
              transition: 'all 0.15s',
            }}>
              {isLoading ? (
                <>
                  <div style={{
                    width: '28px', height: '28px',
                    border: `3px solid #c7d2fe`,
                    borderTopColor: INDIGO,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                  <span style={{ color: INDIGO, fontWeight: '600', fontSize: '0.85rem' }}>Extracting text...</span>
                </>
              ) : text ? (
                <>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <span style={{ color: '#166534', fontWeight: '700', fontSize: '0.85rem' }}>File parsed successfully</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{text.slice(0, 60)}...</span>
                  <span style={{ color: INDIGO, fontSize: '0.75rem', textDecoration: 'underline' }}>Click to replace</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '2rem' }}>{icon}</span>
                  <span style={{ color: INDIGO, fontWeight: '700', fontSize: '0.9rem' }}>Click to upload</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Supports PDF, DOCX, TXT (max 10MB)</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                style={{ display: 'none' }}
                onChange={onFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadResumeForm() {
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [cvMode, setCvMode] = useState('paste');
  const [jdMode, setJdMode] = useState('paste');
  const [cvLoading, setCvLoading] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const parseFile = async (file, setText, setLoading) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/simulator/parse-file', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'File parsing failed.');
      }
      const data = await res.json();
      setText(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cvText.trim() || !jdText.trim()) {
      setError('Both your CV and the Job Description are required to start the simulation.');
      return;
    }
    setError('');
    navigate('/simulator', { state: { cv_text: cvText, jd_text: jdText } });
  };

  return (
    <div>
      <Stepper activeStep={1} />

      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: '-0.03em',
          marginBottom: '0.5rem',
        }}>
          Prepare Your Interview Materials
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Upload your CV and the target job description to begin your AI-powered mock interview session.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '0.875rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: '500',
          fontSize: '0.9rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <UploadZone
            icon="📄"
            label="Your CV / Resume"
            mode={cvMode}
            setMode={setCvMode}
            text={cvText}
            setText={setCvText}
            isLoading={cvLoading}
            onFileUpload={(e) => {
              const file = e.target.files[0];
              if (file) parseFile(file, setCvText, setCvLoading);
            }}
          />
          <UploadZone
            icon="💼"
            label="Job Description"
            mode={jdMode}
            setMode={setJdMode}
            text={jdText}
            setText={setJdText}
            isLoading={jdLoading}
            onFileUpload={(e) => {
              const file = e.target.files[0];
              if (file) parseFile(file, setJdText, setJdLoading);
            }}
          />
        </div>

        <button
          type="submit"
          disabled={cvLoading || jdLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '1rem',
            background: cvLoading || jdLoading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: cvLoading || jdLoading ? 'not-allowed' : 'pointer',
            boxShadow: cvLoading || jdLoading ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.4)',
            letterSpacing: '0.01em',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!cvLoading && !jdLoading) e.target.style.opacity = '0.92'; }}
          onMouseLeave={e => { e.target.style.opacity = '1'; }}
        >
          🚀 Start Simulation
        </button>
      </form>
    </div>
  );
}