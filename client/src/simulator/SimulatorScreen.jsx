import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import CoachOverlay from '../coach/CoachOverlay';
import Stepper from '../components/Stepper';

const INDIGO = '#4f46e5';

export default function SimulatorScreen() {
  const location = useLocation();
  const state = location.state || {};
  const { cv_text, jd_text } = state;

  // All hooks declared before any conditional return (React Rules of Hooks)
  const [sessionId] = useState(() => `${localStorage.getItem('userId') || 'user-001'}-${Date.now()}`);
  const [turnNumber, setTurnNumber] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [expectedMethod, setExpectedMethod] = useState('STAR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

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

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
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
      ? 'Loading simulation and generating your first question...'
      : 'Saving response and generating next interview question...';
    setLoading(msg);
    setError('');
    try {
      const res = await fetch('/api/simulator/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_text, jd_text,
          session_id: sessionId,
          turn_number: currentTurn,
          conversation_history: currentHistory,
        }),
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
        background: '#fff', borderRadius: '16px', padding: '3rem 2rem',
        border: '1px solid #e2e8f0', textAlign: 'center',
      }}>
        <span style={{ fontSize: '3rem' }}>📋</span>
        <h3 style={{ marginTop: '1rem', color: '#1e293b' }}>Missing Setup Data</h3>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Please upload your CV and target Job Description to access the simulation.
        </p>
        <Link to="/" style={{
          display: 'inline-block', marginTop: '1.5rem',
          backgroundColor: INDIGO, color: '#fff',
          padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600',
        }}>
          ← Back to Setup
        </Link>
      </div>
    );
  }

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setLoading('AI Coach is analyzing your response...');
    setError('');
    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_text: answerText,
          question_text: currentQuestion,
          expected_method: expectedMethod,
          star_target: 'all',
          topic_tag: 'technical_behavioral',
          session_id: sessionId,
        }),
      });
      if (!res.ok) throw new Error('Failed to process feedback analysis.');
      const data = await res.json();
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
    setConversationHistory(updatedHistory);
    setTurnNumber(nextTurn);
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
          padding: '4rem 2rem', gap: '1.5rem',
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
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem', textAlign: 'center' }}>
            {loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Stepper activeStep={activeStep} />

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', padding: '0.875rem 1rem',
          borderRadius: '10px', marginBottom: '1rem', fontWeight: '500',
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
            padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#c7d2fe', fontWeight: '600', fontSize: '0.85rem' }}>
              🎤 Live Simulation — Turn {turnNumber}
            </span>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff', padding: '0.25rem 0.75rem',
              borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
            }}>
              {expectedMethod} Expected
            </span>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* AI Interviewer avatar + chat bubble */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              }}>
                👩‍💼
              </div>
              <div style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: '0 16px 16px 16px',
                padding: '1rem 1.25rem',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  fontSize: '0.7rem', color: '#a78bfa', fontWeight: '700',
                  marginBottom: '0.4rem', letterSpacing: '0.05em',
                }}>
                  AI INTERVIEWER
                </div>
                <div style={{
                  fontSize: '1.05rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.55',
                }}>
                  {currentQuestion}
                </div>
              </div>
            </div>

            {/* Text answer area */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '14px',
              overflow: 'hidden', backgroundColor: '#fafafa',
            }}>
              <form onSubmit={handleAnswerSubmit} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{
                    fontSize: '0.75rem', fontWeight: '700',
                    color: '#94a3b8', letterSpacing: '0.05em',
                  }}>
                    YOUR ANSWER
                  </label>
                  
                  {/* Mic Controls & Animated Waves */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isRecording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Wave container */}
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
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace' }}>
                          {formatTime(recordingDuration)}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.3rem 0.65rem', borderRadius: '20px',
                        border: '1.5px solid #e2e8f0', backgroundColor: isRecording ? '#fee2e2' : '#fff',
                        cursor: 'pointer', transition: 'all 0.2s',
                        fontSize: '0.75rem', fontWeight: '700',
                        color: isRecording ? '#dc2626' : '#64748b',
                      }}
                    >
                      {isRecording ? '🔴 Stop' : '🎤 Mic'}
                    </button>
                  </div>
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Structure your response (e.g. Situation: ... Task: ... Action: ... Result: ...)"
                  style={{
                    width: '100%', height: '140px',
                    padding: '0.875rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontFamily: 'inherit',
                    fontSize: '0.95rem', color: '#334155', resize: 'vertical',
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
                    marginTop: '0.75rem', width: '100%', padding: '0.875rem',
                    background: answerText.trim()
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : '#e2e8f0',
                    color: answerText.trim() ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: '10px',
                    fontWeight: '700', fontSize: '0.95rem', cursor: answerText.trim() ? 'pointer' : 'default',
                    boxShadow: answerText.trim()
                      ? '0 4px 14px rgba(79,70,229,0.35)'
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ✓ Submit Answer
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
