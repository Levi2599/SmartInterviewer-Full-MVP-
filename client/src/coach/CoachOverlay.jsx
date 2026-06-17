import React from 'react';

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
};

export default function CoachOverlay({ feedback, onNext }) {
  const {
    overall_score,
    framework_detected,
    framework_analysis,
    missing_components,
    improvement_tip,
  } = feedback;

  const renderFrameworkAnalysis = (analysis) => {
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
        {renderFrameworkAnalysis(framework_analysis)}
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

      <button onClick={onNext} style={styles.button}>Proceed to Next Question →</button>
    </div>
  );
}