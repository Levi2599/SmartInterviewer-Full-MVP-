import React, { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';
import translations from '../utils/translations';

const INDIGO = '#4f46e5';

function getBarColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function ComponentChecklist({ labels, star, missing_components }) {
  const { t } = useLanguage();

  const isMissing = (key, labelKey) => {
    if (!missing_components || missing_components.length === 0) return false;

    const labelHe = translations['he']?.[labelKey]?.toLowerCase() || '';
    const labelEn = translations['en']?.[labelKey]?.toLowerCase() || '';

    const standardNames = {
      S: ['situation', 'context', 'point', 'goal', 's', 'מצב', 'הקשר', 'נקודה', 'מטרה'],
      T: ['task', 'reason', 'strategy', 't', 'משימה', 'נימוק', 'אסטרטגיה'],
      A: ['action', 'example', 'analysis', 'a', 'פעולה', 'דוגמה', 'ניתוח'],
      R: ['result', 'point-revisited', 'point revisited', 'reporting', 'r', 'תוצאה', 'חזרה על הנקודה', 'דיווח']
    };

    const possibleMatches = [
      key.toLowerCase(),
      labelKey.toLowerCase(),
      labelHe,
      labelEn,
      ...(standardNames[key] || [])
    ];

    return missing_components.some(mc => {
      const cleanMc = mc.toLowerCase().trim();
      return possibleMatches.some(pm => pm && (cleanMc.includes(pm) || pm.includes(cleanMc)));
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Object.entries(labels).map(([key, labelKey]) => {
        const label = t(labelKey);
        const score = star?.[key] ?? 0;
        const barColor = getBarColor(score);

        const flaggedByAI = missing_components ? isMissing(key, labelKey) : null;
        const isPresent = flaggedByAI !== null ? !flaggedByAI : score >= 40;

        return (
          <div key={key} style={{
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            padding: '0.75rem',
            border: `1px solid ${isPresent ? '#e2e8f0' : '#fecaca'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: '700',
                backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
                color: isPresent ? '#166534' : '#dc2626',
              }}>
                {isPresent ? '✓' : '!'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{label}</span>
                {!isPresent && (
                  <span style={{
                    marginLeft: '0.4rem', fontSize: '0.7rem',
                    color: '#dc2626', fontWeight: '600',
                  }}>— {t('coachMissing')}</span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', flexShrink: 0 }}>{score}/100</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${score}%`,
                backgroundColor: barColor,
                borderRadius: '3px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            {!isPresent && (
              <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.35rem', fontStyle: 'italic' }}>
                {t('coachTip').replace('{component}', label.split(' ')[0].toLowerCase())}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const HIGH_SCORE_THRESHOLD = 85;

export default function CoachOverlay({ feedback, originalAnswer, questionText, sessionId, expectedMethod, onNext }) {
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const {
    overall_score,
    framework_detected,
    star_breakdown,
    missing_components,
    fillers_detected,
    improvement_tip,
  } = feedback;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [retryResult, setRetryResult] = useState(null);
  const [lastRetryFeedback, setLastRetryFeedback] = useState(null);

  const handleRetrySubmit = async (e) => {
    e.preventDefault();
    if (!retryAnswer.trim()) return;
    setRetryLoading(true);
    setRetryError('');
    try {
      const res = await fetch('/api/coach/retry', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          original_answer: originalAnswer,
          retry_answer: retryAnswer,
          question_text: questionText,
          session_id: sessionId,
          expected_method: method,
          original_score: overall_score,
          language,
        }),
      });
      if (!res.ok) throw new Error('Failed to process retry analysis.');
      const data = await res.json();
      setRetryResult(data);
      if (data.retry_feedback) setLastRetryFeedback(data.retry_feedback);
    } catch (err) {
      setRetryError(err.message);
    } finally {
      setRetryLoading(false);
    }
  };

  const method = (framework_detected && framework_detected !== 'NONE') ? framework_detected : (expectedMethod || 'STAR');
  let labels = { S: 'labelSituation', T: 'labelTask', A: 'labelAction', R: 'labelResult' };
  if (method === 'CAR') labels = { S: 'labelContext', A: 'labelAction', R: 'labelResult' };
  if (method === 'PREP') labels = { S: 'labelPoint', T: 'labelReason', A: 'labelExample', R: 'labelPointRevisited' };
  if (method === 'Step-by-Step') labels = { S: 'labelGoal', T: 'labelStrategy', A: 'labelAnalysis', R: 'labelReporting' };

  // When retry result exists, show updated scores and components.
  // Fall back to lastRetryFeedback so "Try Again" doesn't revert colors to original.
  const activeScore = retryResult?.retry_feedback?.overall_score ?? lastRetryFeedback?.overall_score ?? overall_score;
  const activeStar = retryResult?.retry_feedback?.star_breakdown ?? lastRetryFeedback?.star_breakdown ?? star_breakdown;
  const activeMissing = retryResult?.retry_feedback?.missing_components ?? lastRetryFeedback?.missing_components ?? missing_components;

  const isGood = activeScore >= 60;
  const isExcellent = activeScore >= HIGH_SCORE_THRESHOLD;
  const statusColor = isGood ? '#166534' : '#b91c1c';
  const statusBg = isGood ? '#dcfce7' : '#fee2e2';
  const statusText = isExcellent ? t('coachExcellent') : isGood ? t('coachGood') : t('coachNeedsImprovement');

  const cardPadding = isMobile ? '1rem' : '1.5rem';
  const headerPadding = isMobile ? '1rem' : '1.25rem 1.5rem';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Main Coach Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: headerPadding,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#a5b4fc', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '0.2rem' }}>
              {t('coachTitle')}
            </div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: isMobile ? '1rem' : '1.1rem' }}>
              {t('coachSessionReview')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: statusBg, color: statusColor,
              padding: '0.3rem 0.7rem', borderRadius: '20px',
              fontWeight: '700', fontSize: '0.78rem',
            }}>
              {isGood ? '✓' : '!'} {statusText}
            </span>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#fff', padding: '0.35rem 0.8rem',
              borderRadius: '10px', fontWeight: '800',
              fontSize: isMobile ? '1.2rem' : '1.3rem',
            }}>
              {activeScore}/100
            </div>
          </div>
        </div>

        <div style={{ padding: cardPadding, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Excellent score banner */}
          {isExcellent && (
            <div style={{
              backgroundColor: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: '10px', padding: '0.875rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🏆</span>
              <div>
                <div style={{ fontWeight: '700', color: '#166534', fontSize: '0.9rem' }}>{t('coachOutstandingTitle')}</div>
                <div style={{ color: '#15803d', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                  {t('coachOutstandingBody').replace('{score}', activeScore)}
                </div>
              </div>
            </div>
          )}

          {/* Method tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              {t('coachDetectedFramework')}
            </span>
            <span style={{
              backgroundColor: '#f5f3ff', color: INDIGO,
              padding: '0.25rem 0.75rem', borderRadius: '20px',
              fontWeight: '700', fontSize: '0.8rem',
              border: '1px solid #e0d9ff',
            }}>
              {method}
            </span>
          </div>

          {/* Component checklist */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              {t('coachComponents')}
            </div>
            <ComponentChecklist labels={labels} star={activeStar} missing_components={activeMissing} />
          </div>

          {/* Filler words */}
          {fillers_detected && fillers_detected.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                {t('coachFillers')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {fillers_detected.map((filler, idx) => (
                  <span key={idx} style={{
                    color: '#92400e', backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a', padding: '0.2rem 0.6rem',
                    borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
                  }}>
                    ⚠ "{filler}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvement tip — only shown when score < 85 */}
          {improvement_tip && !isExcellent && (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                💡 {t('coachActionableTip')}
              </div>
              <p style={{ color: '#78350f', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                {improvement_tip}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isRetrying && !retryResult && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNext()}
                style={{
                  flex: 1, minWidth: isMobile ? '100%' : '120px',
                  padding: isMobile ? '1rem' : '0.875rem',
                  backgroundColor: isExcellent ? INDIGO : '#f1f5f9',
                  color: isExcellent ? '#fff' : '#475569',
                  border: isExcellent ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: isExcellent ? '0 4px 14px rgba(79,70,229,0.35)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {isExcellent ? t('coachContinueExcellent') : t('coachKeepContinue')}
              </button>
              {!isExcellent && (
                <button
                  onClick={() => { setIsRetrying(true); setRetryAnswer(''); }}
                  style={{
                    flex: 1, minWidth: isMobile ? '100%' : '120px',
                    padding: isMobile ? '1rem' : '0.875rem',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t('coachRetryAnswer')}
                </button>
              )}
            </div>
          )}

          {/* Retry form */}
          {isRetrying && !retryResult && (
            <form onSubmit={handleRetrySubmit} style={{
              backgroundColor: '#f8fafc', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: isMobile ? '1rem' : '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                {t('coachReviseTitle')}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                {t('coachReviseSubtitle').replace('{method}', method)}
              </p>
              <textarea
                value={retryAnswer}
                onChange={(e) => setRetryAnswer(e.target.value)}
                disabled={retryLoading}
                placeholder={t('coachRetryPlaceholder').replace('{method}', method)}
                style={{
                  width: '100%',
                  height: isMobile ? '130px' : '110px',
                  padding: '0.75rem',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontFamily: 'inherit',
                  fontSize: isMobile ? '1rem' : '0.9rem',
                  resize: 'vertical',
                  outline: 'none', lineHeight: '1.5',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = INDIGO}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {retryError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '500' }}>
                  ⚠️ {retryError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setIsRetrying(false); setRetryResult(null); }}
                  disabled={retryLoading}
                  style={{
                    flex: 1, minWidth: isMobile ? '100%' : '80px',
                    padding: isMobile ? '0.875rem' : '0.75rem',
                    backgroundColor: '#f1f5f9', color: '#475569',
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  {t('coachCancel')}
                </button>
                <button
                  type="submit"
                  disabled={retryLoading || !retryAnswer.trim()}
                  style={{
                    flex: 2, minWidth: isMobile ? '100%' : '120px',
                    padding: isMobile ? '0.875rem' : '0.75rem',
                    background: (!retryLoading && retryAnswer.trim())
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : '#e2e8f0',
                    color: (!retryLoading && retryAnswer.trim()) ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: '8px',
                    fontWeight: '700', cursor: 'pointer',
                    boxShadow: (!retryLoading && retryAnswer.trim())
                      ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {retryLoading ? t('coachEvaluating') : t('coachSubmitRevision')}
                </button>
              </div>
            </form>
          )}

          {/* Retry results */}
          {retryResult && (
            <div style={{
              backgroundColor: retryResult.improvement ? '#f0fdf4' : '#fef2f2',
              borderRadius: '12px',
              border: `1px solid ${retryResult.improvement ? '#bbf7d0' : '#fecaca'}`,
              padding: isMobile ? '1rem' : '1.25rem',
            }}>
              <div style={{ fontWeight: '700', color: retryResult.improvement ? '#166534' : '#991b1b', marginBottom: '0.75rem' }}>
                {retryResult.improvement ? '✅' : '📊'} {t('coachRevisionComparison')}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                  flex: '1 1 80px',
                  backgroundColor: '#fee2e2', borderRadius: '8px', padding: '0.75rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#991b1b', marginBottom: '0.2rem' }}>{t('coachOriginal')}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#dc2626' }}>
                    {retryResult.original_score ?? 0}
                  </div>
                </div>
                <div style={{
                  flex: '1 1 80px',
                  backgroundColor: '#dcfce7', borderRadius: '8px', padding: '0.75rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#166534', marginBottom: '0.2rem' }}>{t('coachRevision')}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>
                    {retryResult.retry_feedback?.overall_score ?? 0}
                  </div>
                </div>
                {retryResult.score_delta !== undefined && (
                  <div style={{
                    flex: '1 1 80px',
                    backgroundColor: retryResult.score_delta >= 0 ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '8px', padding: '0.75rem', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '0.2rem' }}>{t('coachDelta')}</div>
                    <div style={{
                      fontSize: '1.4rem', fontWeight: '800',
                      color: retryResult.score_delta >= 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {retryResult.score_delta >= 0 ? '+' : ''}{retryResult.score_delta}
                    </div>
                  </div>
                )}
              </div>
              {!retryResult.improvement && (
                <div style={{
                  backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: '8px', padding: '0.75rem',
                  fontSize: '0.83rem', color: '#9a3412', marginBottom: '0.75rem',
                }}>
                  💡 {t('coachNoImprovement').replace('{method}', method)}
                </div>
              )}
              {retryResult.retry_feedback?.improvement_tip && retryResult.improvement && (
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.75rem 0' }}>
                  💡 {retryResult.retry_feedback.improvement_tip}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!retryResult.improvement && (
                  <button
                    onClick={() => { setRetryResult(null); setRetryAnswer(''); }}
                    style={{
                      flex: 1, minWidth: isMobile ? '100%' : '100px',
                      padding: isMobile ? '1rem' : '0.875rem',
                      backgroundColor: '#f1f5f9', color: '#475569',
                      border: '1px solid #e2e8f0', borderRadius: '10px',
                      fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                    }}
                  >
                    {t('coachTryAgain')}
                  </button>
                )}
                <button
                  onClick={() => onNext(retryAnswer)}
                  style={{
                    flex: 2, minWidth: isMobile ? '100%' : '120px',
                    padding: isMobile ? '1rem' : '0.875rem',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                  }}
                >
                  {retryResult.improvement ? t('coachAcceptContinue') : t('coachContinueAnyway')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
