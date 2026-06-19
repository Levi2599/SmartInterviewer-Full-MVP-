import React, { useState } from 'react';

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  scoreBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#334155',
    margin: '1rem 0 0.5rem 0',
  },
  frameworkBox: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
  },
  missingItem: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  tip: {
    backgroundColor: '#fef08a',
    color: '#713f12',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    width: '100%',
  },
  retryContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  retryTextarea: {
    width: '100%',
    height: '100px',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#64748b',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1,
  },
  deltaBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    marginLeft: '0.5rem',
  },
};

export default function CoachOverlay({ feedback, originalAnswer, questionText, sessionId, onNext }) {
  const {
    overall_score,
    framework_detected,
    framework_analysis,
    star_breakdown,
    missing_components,
    improvement_tip,
  } = feedback;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [retryResult, setRetryResult] = useState(null);

  const handleRetrySubmit = async (e) => {
    e.preventDefault();
    if (!retryAnswer.trim()) return;
    setRetryLoading(true);
    setRetryError('');
    try {
      const res = await fetch('/api/coach/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_answer: originalAnswer,
          retry_answer: retryAnswer,
          question_text: questionText,
          session_id: sessionId
        })
      });
      if (!res.ok) throw new Error('Failed to process retry analysis.');
      const data = await res.json();
      setRetryResult(data);
    } catch (err) {
      setRetryError(err.message);
    } finally {
      setRetryLoading(false);
    }
  };

  const renderFrameworkAnalysis = (analysis, star) => {
    if (star) {
      const components = {
        S: { label: 'Situation (S)', color: '#3b82f6' },
        T: { label: 'Task (T)', color: '#10b981' },
        A: { label: 'Action (A)', color: '#f59e0b' },
        R: { label: 'Result (R)', color: '#8b5cf6' }
      };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(components).map(([key, info]) => {
            const score = star[key] ?? 0;
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600' }}>
                  <span>{info.label}</span>
                  <span>{score} / 100</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', backgroundColor: info.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (!analysis) return null;
    if (typeof analysis === 'string') {
      return <p style={{ margin: 0 }}>{analysis}</p>;
    }
    if (typeof analysis === 'object') {
      return (
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {Object.entries(analysis).map(([key, val]) => (
            <li key={key} style={{ marginBottom: '0.25rem' }}>
              <strong>{key.toUpperCase()}:</strong> {String(val)}
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>AI Coach Tactical Review</h3>
        <div style={styles.scoreBadge}>{overall_score} / 100</div>
      </div>

      <div style={styles.sectionTitle}>Framework Classification</div>
      <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#475569' }}>
        Detected Pattern: <span style={{ color: '#2563eb' }}>{framework_detected || 'General Structure'}</span>
      </div>

      <div style={styles.frameworkBox}>
        {renderFrameworkAnalysis(framework_analysis, star_breakdown)}
      </div>

      {missing_components && missing_components.length > 0 && (
        <>
          <div style={styles.sectionTitle}>Missing Structural Components</div>
          <div>
            {missing_components.map((comp, idx) => (
              <span key={idx} style={styles.missingItem}>✕ {comp}</span>
            ))}
          </div>
        </>
      )}

      {improvement_tip && (
        <>
          <div style={styles.sectionTitle}>Actionable Optimization Tip</div>
          <div style={styles.tip}>"{improvement_tip}"</div>
        </>
      )}

      {!isRetrying && !retryResult && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={() => onNext()} style={{ ...styles.button, marginTop: 0, flex: 1, backgroundColor: '#64748b' }}>
            Keep & Continue →
          </button>
          <button onClick={() => { setIsRetrying(true); setRetryAnswer(originalAnswer); }} style={{ ...styles.button, marginTop: 0, flex: 1, backgroundColor: '#2563eb' }}>
            Retry Answer ↻
          </button>
        </div>
      )}

      {isRetrying && !retryResult && (
        <form onSubmit={handleRetrySubmit} style={styles.retryContainer}>
          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>Optimize Your Answer</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Use the tip above to improve your response's structure.</div>
          <textarea
            style={styles.retryTextarea}
            value={retryAnswer}
            onChange={(e) => setRetryAnswer(e.target.value)}
            disabled={retryLoading}
            placeholder="Write your revised answer response details..."
          />
          {retryError && <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{retryError}</div>}
          <div style={styles.buttonRow}>
            <button type="button" onClick={() => { setIsRetrying(false); setRetryResult(null); }} style={styles.cancelButton} disabled={retryLoading}>
              Cancel
            </button>
            <button type="submit" style={styles.retryButton} disabled={retryLoading || !retryAnswer.trim()}>
              {retryLoading ? 'Evaluating...' : 'Submit Revision'}
            </button>
          </div>
        </form>
      )}

      {retryResult && (
        <div style={{ ...styles.retryContainer, border: '2px solid #10b981', backgroundColor: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '1.1rem' }}>Revision Review</span>
            <div>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#047857' }}>
                {retryResult.retry_feedback.overall_score} / 100
              </span>
              <span style={{
                ...styles.deltaBadge,
                color: retryResult.score_delta >= 0 ? '#15803d' : '#b91c1c',
                backgroundColor: retryResult.score_delta >= 0 ? '#dcfce7' : '#fee2e2'
              }}>
                {retryResult.score_delta >= 0 ? '+' : ''}{retryResult.score_delta} Delta
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#374151', margin: '0.5rem 0' }}>
            <strong>Revision Pattern:</strong> {retryResult.retry_feedback.framework_detected || 'NONE'}
          </div>

          <div style={{ ...styles.frameworkBox, backgroundColor: '#fff' }}>
            {renderFrameworkAnalysis(retryResult.retry_feedback.framework_analysis, retryResult.retry_feedback.star_breakdown)}
          </div>

          {retryResult.retry_feedback.missing_components && retryResult.retry_feedback.missing_components.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ ...styles.sectionTitle, margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Remaining Missing Components</div>
              <div>
                {retryResult.retry_feedback.missing_components.map((comp, idx) => (
                  <span key={idx} style={styles.missingItem}>✕ {comp}</span>
                ))}
              </div>
            </div>
          )}

          {retryResult.retry_feedback.improvement_tip && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ ...styles.sectionTitle, margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Actionable Tip</div>
              <div style={styles.tip}>"{retryResult.retry_feedback.improvement_tip}"</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => { setRetryResult(null); setIsRetrying(true); }} style={{ ...styles.cancelButton, flex: 1 }}>
              Try Again ↻
            </button>
            <button onClick={() => onNext(retryAnswer)} style={{ ...styles.retryButton, backgroundColor: '#10b981', flex: 2 }}>
              Accept & Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}