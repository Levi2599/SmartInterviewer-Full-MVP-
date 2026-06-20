import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import CoachOverlay from '../coach/CoachOverlay';
import Stepper from '../components/Stepper';

const INDIGO = '#4f46e5';

// Animated voice-wave SVG bars
function VoiceWave({ active }) {
  const heights = [0.4, 0.7, 1.0, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8, 0.5, 1.0, 0.6, 0.4];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '36px' }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            height: `${h * 36}px`,
            backgroundColor: active ? '#ef4444' : '#cbd5e1',
            borderRadius: '2px',
            transition: 'height 0.1s ease',
            animation: active ? `wave${i % 4} 0.8s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave0 { from { transform: scaleY(0.4); } to { transform: scaleY(1.0); } }
        @keyframes wave1 { from { transform: scaleY(0.6); } to { transform: scaleY(0.9); } }
        @keyframes wave2 { from { transform: scaleY(0.5); } to { transform: scaleY(1.1); } }
        @keyframes wave3 { from { transform: scaleY(0.3); } to { transform: scaleY(0.85); } }
      `}</style>
    </div>
  );
}

export default function SimulatorScreen() {
  const location = useLocation();
  const state = location.state || {};
  const { cv_text, jd_text } = state;

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

  const [sessionId] = useState(() => `user-001-${Date.now()}`);
  const [turnNumber, setTurnNumber] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [persona, setPersona] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [expectedMethod, setExpectedMethod] = useState('STAR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

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
      if (data.interviewer_persona) setPersona(data.interviewer_persona);
      if (data.expected_method) setExpectedMethod(data.expected_method);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestion(1, []); }, []);

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

  // Loading spinner
  if (loading && !feedback) {
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
      <Stepper activeStep={feedback ? 4 : 2} />

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
              {/* Avatar */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              }}>
                👩‍💼
              </div>
              {/* Chat bubble */}
              <div style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: '0 16px 16px 16px',
                padding: '1rem 1.25rem',
                border: '1px solid #e2e8f0',
                position: 'relative',
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

            {/* Voice recorder widget */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '14px',
              overflow: 'hidden', backgroundColor: '#fafafa',
            }}>
              {/* Simulated recorder header */}
              <div style={{
                padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: isRecording ? '#fff5f5' : '#f8fafc',
              }}>
                {/* Mic button */}
                <button
                  type="button"
                  onClick={() => setIsRecording(!isRecording)}
                  style={{
                    width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                    background: isRecording
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isRecording
                      ? '0 0 0 6px rgba(239,68,68,0.2)'
                      : '0 4px 12px rgba(239,68,68,0.35)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isRecording ? '⏹' : '🎙️'}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: '700',
                    color: isRecording ? '#dc2626' : '#64748b',
                    marginBottom: '0.35rem',
                  }}>
                    {isRecording ? '● Recording...' : 'Tap to start recording'}
                  </div>
                  <VoiceWave active={isRecording} />
                </div>
                {isRecording && (
                  <span style={{
                    fontSize: '0.7rem', color: '#ef4444', fontWeight: '700',
                    animation: 'blink 1s step-end infinite',
                  }}>
                    LIVE
                    <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
                  </span>
                )}
              </div>

              {/* Text answer area */}
              <form onSubmit={handleAnswerSubmit} style={{ padding: '1rem 1.25rem' }}>
                <label style={{
                  display: 'block', fontSize: '0.75rem', fontWeight: '700',
                  color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem',
                }}>
                  OR WRITE YOUR ANSWER BELOW
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Structure your response (e.g. Situation: ... Task: ... Action: ... Result: ...)"
                  disabled={!!loading}
                  style={{
                    width: '100%', height: '120px',
                    padding: '0.875rem', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontFamily: 'inherit',
                    fontSize: '0.95rem', color: '#334155', resize: 'vertical',
                    outline: 'none', lineHeight: '1.5',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = INDIGO}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="submit"
                  disabled={!!loading || !answerText.trim()}
                  style={{
                    marginTop: '0.75rem', width: '100%', padding: '0.875rem',
                    background: (!loading && answerText.trim())
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : '#e2e8f0',
                    color: (!loading && answerText.trim()) ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: '10px',
                    fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
                    boxShadow: (!loading && answerText.trim())
                      ? '0 4px 14px rgba(79,70,229,0.35)'
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Analyzing response...' : '✓ Submit Answer'}
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