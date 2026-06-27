import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import CoachOverlay from '../coach/CoachOverlay';
import Stepper from '../components/Stepper';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';

export default function SimulatorScreen() {
  const location = useLocation();
  const state = location.state || {};
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  // Persist cv_text/jd_text in sessionStorage so a page refresh doesn't lose them
  const cv_text = state.cv_text || sessionStorage.getItem('sim-cv') || '';
  const jd_text = state.jd_text || sessionStorage.getItem('sim-jd') || '';
  if (state.cv_text) sessionStorage.setItem('sim-cv', state.cv_text);
  if (state.jd_text) sessionStorage.setItem('sim-jd', state.jd_text);

  const detectLang = (text) => {
    const heChars = (text.match(/[֐-׿]/g) || []).length;
    const total = text.replace(/\s/g, '').length;
    return total > 0 && heChars / total > 0.25 ? 'he' : 'en';
  };
  const sessionLang = language === 'he' ? 'he' : detectLang(jd_text + ' ' + cv_text);
  const ttsLang = sessionLang === 'he' ? 'he-IL' : 'en-US';
  const sttLang = sessionLang === 'he' ? 'he-IL' : (localStorage.getItem('pref-stt-lang') || 'en-US');

  // All hooks declared before any conditional return (React Rules of Hooks)
  const [sessionId] = useState(() => `${localStorage.getItem('userId') || 'user-001'}-${Date.now()}`);
  const [turnNumber, setTurnNumber] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`sim-turn-${localStorage.getItem('userId') || 'user-001'}`);
      return saved ? Number(saved) : 1;
    } catch (_) { return 1; }
  });
  const [conversationHistory, setConversationHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`sim-history-${localStorage.getItem('userId') || 'user-001'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [sttWarning, setSttWarning] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [expectedMethod, setExpectedMethod] = useState('STAR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (state.cv_text) {
      const uid = localStorage.getItem('userId') || 'user-001';
      sessionStorage.removeItem(`sim-turn-${uid}`);
      sessionStorage.removeItem(`sim-history-${uid}`);
      setTurnNumber(1);
      setConversationHistory([]);
    }
    return () => {
      sessionStorage.removeItem('progressData_en');
      sessionStorage.removeItem('progressDataTime_en');
      sessionStorage.removeItem('progressData_he');
      sessionStorage.removeItem('progressDataTime_he');
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = sttLang;

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setAnswerText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Native Text-to-Speech (TTS) for accessibility
  useEffect(() => {
    const isTtsEnabled = localStorage.getItem('pref-tts-enabled') === 'true';
    if (isTtsEnabled && currentQuestion && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.lang = ttsLang;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [currentQuestion]);

  const updateConversationHistory = (newHistory) => {
    setConversationHistory(newHistory);
    try {
      sessionStorage.setItem(`sim-history-${localStorage.getItem('userId') || 'user-001'}`, JSON.stringify(newHistory));
    } catch (_) {}
  };

  const toggleRecording = () => {
    if (!recognition) {
      setSttWarning(true);
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchQuestion = async (currentTurn, currentHistory) => {
    const msg = currentTurn === 1
      ? t('simLoadingFirst')
      : t('simLoadingNext');
    setLoading(msg);
    setError('');
    try {
      // Turn 1: send full context to seed the server-side cache.
      // Turn 2+: only session_id + trimmed history (CV/JD served from server cache).
      const body = currentTurn === 1
        ? {
            cv_text, jd_text,
            session_id: sessionId,
            turn_number: currentTurn,
            conversation_history: [],
            language: sessionLang,
          }
        : {
            session_id: sessionId,
            turn_number: currentTurn,
            // Send only the last 8 exchanges — enough context, far fewer tokens
            conversation_history: currentHistory.slice(-8),
            language: sessionLang,
          };

      const res = await fetch('/api/simulator/generate-question', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to retrieve next question.');
      const data = await res.json();
      setCurrentQuestion(data.next_question);
      if (data.expected_method) setExpectedMethod(data.expected_method);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cv_text && jd_text) {
      fetchQuestion(1, []);
    }
  }, []);

  // Guard after all hooks are declared
  if (!cv_text || !jd_text) {
    return (
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '3rem 1.5rem',
        border: '1px solid #e2e8f0', textAlign: 'center',
      }}>
        <span style={{ fontSize: '3rem' }}>📋</span>
        <h3 style={{ marginTop: '1rem', color: '#1e293b' }}>{t('simMissingData')}</h3>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          {t('simMissingDataBody')}
        </p>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
          backgroundColor: INDIGO, color: '#fff',
          padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600',
          textDecoration: 'none',
          direction: 'ltr',
        }}>
          <span>←</span>
          <span>{t('simBackSetup')}</span>
        </Link>
      </div>
    );
  }

  // Clears the progress cache and notifies the server to evict the session entry.
  // Called both on explicit exit and when a session naturally ends.
  const endSession = () => {
    sessionStorage.removeItem('progressData_en');
    sessionStorage.removeItem('progressDataTime_en');
    sessionStorage.removeItem('progressData_he');
    sessionStorage.removeItem('progressDataTime_he');
    // Best-effort: evict the server-side cache entry so CV/JD are not held in memory
    fetch(`/api/simulator/session/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).catch(() => {}); // fire-and-forget
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setLoading(t('simAnalyzing'));
    setError('');
    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answer_text: answerText,
          question_text: currentQuestion,
          expected_method: expectedMethod,
          star_target: 'all',
          topic_tag: 'technical_behavioral',
          session_id: sessionId,
          language: sessionLang,
        }),
      });
      if (!res.ok) throw new Error('Failed to process feedback analysis.');
      const data = await res.json();
      // Invalidate progress cache so dashboard shows fresh data immediately
      sessionStorage.removeItem('progressData_en');
      sessionStorage.removeItem('progressDataTime_en');
      sessionStorage.removeItem('progressData_he');
      sessionStorage.removeItem('progressDataTime_he');
      setFeedback(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = (finalAnswer) => {
    const actualAnswer = typeof finalAnswer === 'string' ? finalAnswer : answerText;
    const updatedHistory = [
      ...conversationHistory,
      { role: 'interviewer', text: currentQuestion },
      { role: 'candidate', text: actualAnswer },
    ];
    const nextTurn = turnNumber + 1;
    updateConversationHistory(updatedHistory);
    setTurnNumber(nextTurn);
    try { sessionStorage.setItem(`sim-turn-${localStorage.getItem('userId') || 'user-001'}`, String(nextTurn)); } catch (_) {}
    setAnswerText('');
    setFeedback(null);
    fetchQuestion(nextTurn, updatedHistory);
  };


  // Step logic: 2=Question loading, 3=Answering, 4=Feedback
  const activeStep = loading ? 2 : feedback ? 4 : 3;

  if (loading) {
    return (
      <div>
        <Stepper activeStep={2} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '3rem 1rem' : '4rem 2rem', gap: '1.5rem',
          backgroundColor: '#ffffff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: '52px', height: '52px',
            border: '4px solid #e0d9ff',
            borderTopColor: INDIGO,
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem', textAlign: 'center', padding: '0 1rem' }}>
            {loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Stepper activeStep={activeStep} />

      {/* Global Session Control Header */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>🎤</span>
          <div>
            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: isMobile ? '0.85rem' : '0.95rem', display: 'block' }}>
              {t('simTitle')}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
              {t('simTurn')} {turnNumber} — {expectedMethod} {t('simFrameworkTarget')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { endSession(); setExitConfirm(true); }}
          style={{
            backgroundColor: '#fee2e2', color: '#dc2626',
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            fontSize: '0.78rem', fontWeight: '700',
            border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.25rem',
            cursor: 'pointer', transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          🚪 {t('simExitSession')}
        </button>
      </div>

      {sttWarning && (
        <div style={{
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          color: '#92400e', padding: '0.75rem 1rem',
          borderRadius: '10px', marginBottom: '1rem', fontWeight: '500',
          fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠️ {t('simSttWarning')}</span>
          <button onClick={() => setSttWarning(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: '700', marginLeft: '0.75rem' }}>✕</button>
        </div>
      )}

      {exitConfirm && (
        <div style={{
          backgroundColor: '#fff', border: '1px solid #fecaca',
          borderRadius: '12px', padding: '1.25rem 1.5rem',
          marginBottom: '1rem', boxShadow: '0 4px 16px rgba(220,38,38,0.1)',
        }}>
          <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {t('simExitTitle')}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
            {t('simExitBody')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setExitConfirm(false)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
            >
              {t('simStayBtn')}
            </button>
            <Link
              to="/"
              style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '700', textDecoration: 'none', textAlign: 'center', border: '1px solid #fecaca' }}
            >
              {t('simExitBtn')}
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', padding: '0.875rem 1rem',
          borderRadius: '10px', marginBottom: '1rem', fontWeight: '500',
          fontSize: isMobile ? '0.875rem' : '1rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Active Interview Panel */}
      {!feedback && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Interview Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          }}>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: isMobile ? '0.82rem' : '0.9rem' }}>
              {t('simCurrentQuestion')}
            </span>
          </div>

          <div style={{ padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* AI Interviewer avatar + chat bubble */}
            <div style={{ display: 'flex', gap: isMobile ? '0.65rem' : '1rem', alignItems: 'flex-start' }}>
              {/* Hide avatar on very small screens to save horizontal space */}
              {!isMobile && (
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                }}>
                  👩‍💼
                </div>
              )}
              <div style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: isMobile ? '10px' : '0 16px 16px 16px',
                padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  fontSize: '0.7rem', color: '#a78bfa', fontWeight: '700',
                  marginBottom: '0.4rem', letterSpacing: '0.05em',
                }}>
                  {t('simAiInterviewer')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '600', color: '#1e293b', lineHeight: '1.55',
                    flex: 1
                  }}>
                    {currentQuestion}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.speechSynthesis) return;
                      if (isSpeaking) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      } else {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(currentQuestion);
                        utterance.lang = ttsLang;
                        utterance.onstart = () => setIsSpeaking(true);
                        utterance.onend = () => setIsSpeaking(false);
                        utterance.onerror = () => setIsSpeaking(false);
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    style={{
                      backgroundColor: isSpeaking ? '#fee2e2' : '#f1f5f9',
                      color: isSpeaking ? '#dc2626' : '#475569',
                      border: `1px solid ${isSpeaking ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '50%',
                      width: '34px', height: '34px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', transition: 'all 0.15s', flexShrink: 0
                    }}
                    title={isSpeaking ? t('simStopReading') : t('simReadAloud')}
                  >
                    {isSpeaking ? '⏹' : '🔊'}
                  </button>
                </div>
              </div>
            </div>

            {/* Text answer area */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '14px',
              overflow: 'hidden', backgroundColor: '#fafafa',
            }}>
              <form onSubmit={handleAnswerSubmit} style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label htmlFor="answer-textarea" style={{
                    fontSize: '0.75rem', fontWeight: '700',
                    color: '#94a3b8', letterSpacing: '0.05em',
                  }}>
                    {t('simYourAnswer')}
                  </label>

                  {/* Mic Controls & Animated Waves */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isRecording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
                          <style>{`
                            @keyframes bounce {
                              0%, 100% { height: 4px; }
                              50% { height: 14px; }
                            }
                          `}</style>
                          {[0.4, 0.2, 0.6, 0.3, 0.5].map((delay, idx) => (
                            <div key={idx} style={{
                              width: '3px',
                              backgroundColor: '#ef4444',
                              borderRadius: '2px',
                              animation: 'bounce 0.8s ease-in-out infinite',
                              animationDelay: `${delay}s`,
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>
                          {formatTime(recordingDuration)}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: isMobile ? '0.4rem 0.7rem' : '0.3rem 0.65rem',
                        borderRadius: '20px',
                        border: '1.5px solid #e2e8f0', backgroundColor: isRecording ? '#fee2e2' : '#fff',
                        cursor: 'pointer', transition: 'all 0.2s',
                        fontSize: '0.75rem', fontWeight: '700',
                        color: isRecording ? '#dc2626' : '#64748b',
                        minHeight: '36px',
                      }}
                    >
                      {isRecording ? `🔴 ${t('simStopBtn')}` : `🎤 ${t('simMicBtn')}`}
                    </button>
                  </div>
                </div>

                <textarea
                  id="answer-textarea"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={t('simAnswerPlaceholder')}
                  style={{
                    width: '100%',
                    height: isMobile ? '130px' : '140px',
                    padding: '0.875rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontFamily: 'inherit',
                    fontSize: isMobile ? '1rem' : '0.95rem',
                    color: '#334155', resize: 'vertical',
                    outline: 'none', lineHeight: '1.5',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = INDIGO}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="submit"
                  disabled={!answerText.trim()}
                  style={{
                    marginTop: '0.75rem', width: '100%',
                    padding: isMobile ? '1rem' : '0.875rem',
                    background: answerText.trim()
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : '#e2e8f0',
                    color: answerText.trim() ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: '10px',
                    fontWeight: '700', fontSize: isMobile ? '1rem' : '0.95rem',
                    cursor: answerText.trim() ? 'pointer' : 'default',
                    boxShadow: answerText.trim()
                      ? '0 4px 14px rgba(79,70,229,0.35)'
                      : 'none',
                    transition: 'all 0.2s ease',
                    minHeight: '48px',
                  }}
                >
                  ✓ {t('simSubmitAnswer')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Coach Overlay */}
      {feedback && (
        <CoachOverlay
          feedback={feedback}
          originalAnswer={answerText}
          questionText={currentQuestion}
          sessionId={sessionId}
          expectedMethod={expectedMethod}
          onNext={handleNextQuestion}
        />
      )}
    </div>
  );
}
