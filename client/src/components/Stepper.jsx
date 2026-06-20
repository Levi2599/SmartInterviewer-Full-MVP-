import React from 'react';

/**
 * Stepper component – shows the current phase of the interview simulation.
 * @param {number} activeStep - 1-indexed step number (1-5)
 */
const STEPS = ['Upload', 'Question', 'Record', 'Feedback', 'Next'];

export default function Stepper({ activeStep = 1 }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      marginBottom: '2rem',
      padding: '1rem 0',
      overflowX: 'auto',
    }}>
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const isActive = step === activeStep;
        const isDone = step < activeStep;

        return (
          <React.Fragment key={step}>
            {/* Step node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', minWidth: '72px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.8rem',
                background: isDone ? '#4f46e5' : isActive ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
                color: isDone || isActive ? '#fff' : '#94a3b8',
                boxShadow: isActive ? '0 0 0 3px #e0d9ff' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}>
                {isDone ? '✓' : step}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#4f46e5' : isDone ? '#6366f1' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div style={{
                height: '2px',
                width: '40px',
                backgroundColor: isDone ? '#4f46e5' : '#e2e8f0',
                marginBottom: '1.4rem',
                flexShrink: 0,
                transition: 'background-color 0.2s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
