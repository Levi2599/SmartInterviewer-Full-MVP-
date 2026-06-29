import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import Icon from './ui/icons';

export default function Stepper({ activeStep = 1 }) {
  const { t } = useLanguage();
  const STEPS = [
    t('stepperUpload'),
    t('stepperQuestion'),
    t('stepperAnswer'),
    t('stepperFeedback'),
    t('stepperNext'),
  ];

  return (
    <div aria-label="Progress" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      marginBottom: '2rem',
      padding: '0.75rem 0.25rem 1rem',
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
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '0.8rem',
                background: isDone ? 'var(--si-primary)' : isActive ? 'linear-gradient(135deg, var(--si-primary), #214cba)' : '#e8eef5',
                color: isDone || isActive ? '#fff' : 'var(--si-text-soft)',
                boxShadow: isActive ? '0 0 0 4px rgba(49,87,213,0.16)' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}>
                {isDone ? <Icon name="check" size={15} /> : step}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? 'var(--si-primary)' : isDone ? '#3157d5' : 'var(--si-text-soft)',
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
                backgroundColor: isDone ? 'var(--si-primary)' : '#e8eef5',
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
