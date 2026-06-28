import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { getAuthHeadersFormData, getAuthHeaders } from '../utils/auth';
import { createWorker } from 'tesseract.js';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#f5f3ff';
const BORDER = '#e2e8f0';

// ─── Upload Zone ─────────────────────────────────────────────────────────────
// mode === 'upload' → large drop zone (click to browse OR drag & drop)
// mode === 'type'   → textarea (replaces drop zone entirely)
// One small toggle button in the header row switches between modes.
function UploadZone({ icon, label, text, setText, isLoading, setIsLoading, onFileUpload }) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState('upload'); // 'upload' | 'type'
  const [isDragOver, setIsDragOver] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

  // Hebrew voice input — only initialised when language === 'he'
  const [isRecording, setIsRecording] = useState(false);
  const [voiceWarning, setVoiceWarning] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (language !== 'he') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'he-IL';

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setText((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript);
      }
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend   = () => setIsRecording(false);

    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch (_) {}
      recognitionRef.current = null;
    };
  }, [language]);

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceWarning(t('uploadVoiceNotSupported')); return; }
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try { recognitionRef.current.start(); setIsRecording(true); setVoiceWarning(''); }
      catch (_) {}
    }
  };

  // Toggle between upload / type modes; stop recording if leaving type mode
  const toggleMode = () => {
    if (isRecording) { try { recognitionRef.current?.stop(); } catch (_) {} setIsRecording(false); }
    setMode((m) => (m === 'upload' ? 'type' : 'upload'));
  };

  // OCR for image files
  const handleImageFile = async (file) => {
    setIsLoading(true);
    setOcrProgress(t('uploadExtractingOcr'));
    try {
      const worker = await createWorker('eng+heb', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`${t('uploadExtractingOcr')} ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const { data: { text: extracted } } = await worker.recognize(file);
      await worker.terminate();
      const cleaned = extracted.trim();
      if (!cleaned) throw new Error('No text found in image.');
      setText(cleaned);
      setOcrProgress('');
    } catch (err) {
      setOcrProgress('');
      setText('');
      alert(`Image OCR failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified handler: auto-detects image vs document
  const handleUnifiedFile = (e) => {
    if (isLoading) return;
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    file.type.startsWith('image/') ? handleImageFile(file) : onFileUpload({ target: { files: [file] } });
  };

  // Drag handlers
  const onDragOver  = (e) => { e.preventDefault(); if (!isLoading) setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault(); setIsDragOver(false);
    if (!isLoading) handleUnifiedFile({ dataTransfer: e.dataTransfer });
  };

  // Drop zone inner content
  const renderDropzoneContent = () => {
    if (isLoading) return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '28px', height: '28px', border: '3px solid #c7d2fe', borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: INDIGO, fontWeight: '600', fontSize: '0.85rem' }}>{ocrProgress || t('uploadExtractingFile')}</span>
      </>
    );

    if (text) return (
      <>
        <span style={{ fontSize: '1.5rem' }}>✅</span>
        <span style={{ color: '#166634', fontWeight: '700', fontSize: '0.85rem' }}>{t('uploadFileParsed')}</span>
        <span style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center' }}>{text.slice(0, 60)}...</span>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ color: INDIGO, fontSize: '0.75rem', textDecoration: 'underline' }}>{t('uploadClickReplace')}</span>
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setText(''); }}
            style={{ color: '#ef4444', fontSize: '0.75rem', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
          >
            ❌ {t('uploadDiscard')}
          </span>
        </div>
      </>
    );

    return (
      <>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.25rem' }}>
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
        <span style={{ color: INDIGO, fontWeight: '700', fontSize: '0.9rem', textAlign: 'center' }}>{t('uploadDropzoneLabel')}</span>
        <span style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.04em' }}>{t('uploadDropzoneTypes')}</span>
      </>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Header row: icon + label on left, toggle button on right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>{label}</span>
          </div>

          {/* Toggle button: shows opposite-mode action */}
          <button
            type="button"
            onClick={toggleMode}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              border: `1.5px solid ${mode === 'type' ? INDIGO : BORDER}`,
              borderRadius: '20px', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: '600',
              color: mode === 'type' ? INDIGO : '#64748b',
              backgroundColor: mode === 'type' ? INDIGO_LIGHT : '#f8fafc',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = INDIGO;
              e.currentTarget.style.color = INDIGO;
              e.currentTarget.style.backgroundColor = INDIGO_LIGHT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = mode === 'type' ? INDIGO : BORDER;
              e.currentTarget.style.color = mode === 'type' ? INDIGO : '#64748b';
              e.currentTarget.style.backgroundColor = mode === 'type' ? INDIGO_LIGHT : '#f8fafc';
            }}
          >
            {mode === 'upload' ? t('uploadTypeBtn') : t('uploadFileBtn')}
          </button>
        </div>

        {/* Content area — Drop Zone OR Textarea, never both */}
        {mode === 'upload' ? (
          <label
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
              border: isDragOver ? `2px dashed ${INDIGO}` : '2px dashed #c7d2fe',
              borderRadius: '12px', padding: '1.75rem 1rem',
              cursor: isLoading ? 'default' : 'pointer',
              backgroundColor: isDragOver ? '#ede9fe' : INDIGO_LIGHT,
              transition: 'all 0.15s', minHeight: '120px',
            }}
          >
            {renderDropzoneContent()}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleUnifiedFile}
              disabled={isLoading}
            />
          </label>
        ) : (
          <div style={{ position: 'relative' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${label}...`}
              style={{
                width: '100%', height: '150px',
                padding: '0.75rem',
                paddingBottom: language === 'he' ? '2.5rem' : '0.75rem',
                borderRadius: '10px', border: `1.5px solid ${BORDER}`,
                fontSize: '0.9rem', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', lineHeight: '1.5',
                color: '#334155', transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = INDIGO)}
              onBlur={(e)  => (e.target.style.borderColor = BORDER)}
            />
            {/* Hebrew mic — only when language is 'he' */}
            {language === 'he' && (
              <button
                type="button"
                onClick={toggleVoice}
                title={isRecording ? t('uploadVoiceStop') : t('uploadVoiceInput')}
                style={{
                  position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  padding: '0.3rem 0.6rem', borderRadius: '20px',
                  border: `1.5px solid ${isRecording ? '#fca5a5' : BORDER}`,
                  backgroundColor: isRecording ? '#fee2e2' : '#f8fafc',
                  color: isRecording ? '#dc2626' : '#64748b',
                  fontSize: '0.72rem', fontWeight: '700',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {isRecording ? `🔴 ${t('uploadVoiceStop')}` : `🎤 ${t('uploadVoiceInput')}`}
              </button>
            )}
          </div>
        )}

        {/* Voice-not-supported warning */}
        {voiceWarning && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {voiceWarning}</span>
            <button type="button" onClick={() => setVoiceWarning('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: '700' }}>✕</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main UploadResumeForm ────────────────────────────────────────────────────
export default function UploadResumeForm() {
  const { t, language } = useLanguage();
  const userId = localStorage.getItem('userId') || 'guest';
  const cvCacheKey = `cached-cv-${userId}`;
  const jdCacheKey = `cached-jd-${userId}`;

  const [autoSaveCv, setAutoSaveCv] = useState(
    () => localStorage.getItem(`pref-auto-save-cv-${userId}`) === 'true'
  );
  const [cvText, setCvText] = useState(() => {
    const autoSave = localStorage.getItem(`pref-auto-save-cv-${userId}`) === 'true';
    return autoSave ? localStorage.getItem(cvCacheKey) || '' : '';
  });
  const [jdText, setJdText] = useState(() => {
    const autoSave = localStorage.getItem(`pref-auto-save-cv-${userId}`) === 'true';
    return autoSave ? localStorage.getItem(jdCacheKey) || '' : '';
  });
  const [cvLoading, setCvLoading] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // History and last active state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const isGuest = userId.startsWith('guest-') || userId === 'guest';
    if (isGuest) return;

    // 1. Fetch last active CV/JD from database on mount if remember-cv is on
    const fetchLastActive = async () => {
      const autoSave = localStorage.getItem(`pref-auto-save-cv-${userId}`) === 'true';
      if (!autoSave) return;

      try {
        const res = await fetch('/api/simulator/last-active', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          // Only update if current text is empty (to avoid overwriting user typed content)
          if (data.cv_text && !cvText) setCvText(data.cv_text);
          if (data.jd_text && !jdText) setJdText(data.jd_text);
        }
      } catch (err) {
        console.error('Failed to load last active CV/JD:', err);
      }
    };

    // 2. Fetch unique practice history from sessions
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch('/api/simulator/history', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchLastActive();
    fetchHistory();
  }, [userId]);

  const parseFile = async (file, setText, setLoading, isCv) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/simulator/parse-file', {
        method: 'POST',
        headers: getAuthHeadersFormData(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'File parsing failed.');
      }
      const data = await res.json();
      setText(data.text);
    } catch (err) {
      setError(
        `Text extraction failed: "${err.message}". We have switched your session to General Interview Mode. Click 'Start Simulation' to begin.`
      );
      if (isCv) {
        setText('General Candidate Profile: Junior software developer with foundational knowledge in HTML, CSS, JavaScript, React, and Node.js.');
      } else {
        setText('General Job Requirements: Looking for a frontend developer to build responsive UI components, collaborate with team members, and learn new technologies.');
      }
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
    const autoSave = localStorage.getItem(`pref-auto-save-cv-${userId}`) === 'true';
    if (autoSave) {
      localStorage.setItem(cvCacheKey, cvText);
      localStorage.setItem(jdCacheKey, jdText);
    } else {
      localStorage.removeItem(cvCacheKey);
      localStorage.removeItem(jdCacheKey);
    }
    navigate('/simulator', { state: { cv_text: cvText, jd_text: jdText } });
  };

  const handleLoadHistoryItem = (item) => {
    setCvText(item.cv_text || '');
    setJdText(item.jd_text || '');
    // Scroll smoothly to top of the page so the user sees fields filled
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(language === 'he' ? 'האם אתה בטוח שברצונך למחוק משרה זו מההיסטוריה?' : 'Are you sure you want to delete this job from your history?')) {
      return;
    }

    try {
      const res = await fetch(`/api/simulator/history/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        // Find the item to delete
        const targetItem = history.find(item => item.session_id === sessionId);
        if (targetItem) {
          const targetNormalized = (targetItem.jd_text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 300);

          setHistory(prev => prev.filter(item => {
            const itemNorm = (item.jd_text || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 300);
            return itemNorm !== targetNormalized;
          }));
        } else {
          setHistory(prev => prev.filter(item => item.session_id !== sessionId));
        }
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm(t('uploadHistoryClearAllConfirm'))) {
      return;
    }

    try {
      const res = await fetch('/api/simulator/history', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const isGuest = userId.startsWith('guest-') || userId === 'guest';

  return (
    <div>
      <Stepper activeStep={1} />

      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 2rem)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          {t('uploadTitle')}
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          {t('uploadCvLabel')}
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.875rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <UploadZone
            icon="📄"
            label={t('uploadCvLabel')}
            text={cvText}
            setText={setCvText}
            isLoading={cvLoading}
            setIsLoading={setCvLoading}
            onFileUpload={(e) => { const f = e.target.files[0]; if (f) parseFile(f, setCvText, setCvLoading, true); }}
          />
          <UploadZone
            icon="💼"
            label={t('uploadJdLabel')}
            text={jdText}
            setText={setJdText}
            isLoading={jdLoading}
            setIsLoading={setJdLoading}
            onFileUpload={(e) => { const f = e.target.files[0]; if (f) parseFile(f, setJdText, setJdLoading, false); }}
          />
        </div>

        {/* Remember CV checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <input
            type="checkbox"
            id="remember-cv"
            checked={autoSaveCv}
            onChange={(e) => {
              setAutoSaveCv(e.target.checked);
              localStorage.setItem(`pref-auto-save-cv-${userId}`, String(e.target.checked));
              if (!e.target.checked) { localStorage.removeItem(cvCacheKey); localStorage.removeItem(jdCacheKey); }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="remember-cv" style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
            💾 {t('uploadRememberCv')}
          </label>
        </div>

        {/* Start Simulation */}
        <button
          type="submit"
          disabled={cvLoading || jdLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '1rem',
            background: cvLoading || jdLoading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '1rem', fontWeight: '700',
            cursor: cvLoading || jdLoading ? 'not-allowed' : 'pointer',
            boxShadow: cvLoading || jdLoading ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.4)',
            letterSpacing: '0.01em', transition: 'all 0.2s ease',
            marginBottom: '2rem'
          }}
          onMouseEnter={(e) => { if (!cvLoading && !jdLoading) e.target.style.opacity = '0.92'; }}
          onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
        >
          {t('uploadStartBtn')}
        </button>
      </form>

      {/* Practice History Section (Authenticated users only) */}
      {!isGuest && (
        <div style={{
          marginTop: '2.5rem',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '2rem',
          textAlign: 'start'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              ⏳ {t('uploadHistoryTitle')}
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                style={{
                  background: 'none', border: 'none', color: '#dc2626',
                  fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                  padding: '0.25rem 0.5rem', borderRadius: '6px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {t('uploadHistoryClearAll')}
              </button>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            {t('uploadHistorySubtitle')}
          </p>

          {historyLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ width: '18px', height: '18px', border: '2.5px solid #c7d2fe', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{t('uploadProcessing')}</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{
              padding: '2rem 1rem', border: '1px dashed #cbd5e1', borderRadius: '12px',
              backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textAlign: 'center'
            }}>
              📁 {t('uploadHistoryNoData')}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.85rem'
            }}>
              {history.map((item) => (
                <div
                  key={item.session_id}
                  onClick={() => handleLoadHistoryItem(item)}
                  style={{
                    backgroundColor: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                    e.currentTarget.style.backgroundColor = '#f5f3ff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistoryItem(e, item.session_id)}
                    title={language === 'he' ? 'מחק משרה מההיסטוריה' : 'Delete job from history'}
                    style={{
                      position: 'absolute',
                      top: '0.45rem',
                      left: language === 'he' ? '0.5rem' : 'auto',
                      right: language === 'he' ? 'auto' : '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '0.2rem',
                      borderRadius: '4px',
                      opacity: 0.4,
                      transition: 'all 0.15s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.2)'; }}
                    onMouseLeave={(e) => { e.target.style.opacity = '0.4'; e.target.style.transform = 'scale(1)'; }}
                  >
                    🗑️
                  </button>

                  <div style={{
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    color: '#1e293b',
                    lineHeight: '1.4',
                    marginBottom: '0.4rem',
                    paddingLeft: language === 'he' ? '1.5rem' : '0',
                    paddingRight: language === 'he' ? '0' : '1.5rem'
                  }}>
                    💼 {item.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    <span>📅 {new Date(item.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</span>
                    <span style={{ color: '#4f46e5', fontWeight: '600' }}>{language === 'he' ? 'טען ⚡' : 'Load ⚡'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
