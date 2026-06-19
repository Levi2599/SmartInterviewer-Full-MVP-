import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import CoachOverlay from '../coach/CoachOverlay';

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  personaBadge: { display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' },
  questionText: { fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem', lineHeight: '1.5' },
  textarea: { width: '100%', height: '120px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  button: { backgroundColor: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  loading: { fontSize: '1.1rem', color: '#64748b', textAlign: 'center', marginTop: '2rem' },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' },
  fallbackLink: { display: 'inline-block', marginTop: '1rem', color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  spinnerText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  }
};

export default function SimulatorScreen() {
  const location = useLocation();
  const state = location.state || {};
  const { cv_text, jd_text } = state;

  if (!cv_text || !jd_text) {
    return (
      <div style={styles.card}>
        <h3>Missing Setup Data</h3>
        <p>Please upload your CV and target Job Description details to access the active simulation workspace.</p>
        <Link to="/" style={styles.fallbackLink}>← Back to Home Form</Link>
      </div>
    );
  }

  const [sessionId] = useState(() => `user-001-${Date.now()}`);
  const [turnNumber, setTurnNumber] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const [persona, setPersona] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const fetchQuestion = async (currentTurn, currentHistory) => {
    const msg = currentTurn === 1 
      ? 'טוען את נתוני הסימולציה ומייצר שאלת פתיחה...' 
      : 'שומר את תשובתך ומייצר את שאלת הראיון הבאה...';
    setLoading(msg);
    setError('');
    try {
      const res = await fetch('/api/simulator/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_text,
          jd_text,
          session_id: sessionId,
          turn_number: currentTurn,
          conversation_history: currentHistory
        })
      });
      if (!res.ok) throw new Error('Failed to retrieve next question metadata.');
      const data = await res.json();
      setCurrentQuestion(data.next_question);
      if (data.interviewer_persona) setPersona(data.interviewer_persona);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion(1, []);
  }, []);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setLoading('המאמן האישי מנתח את תשובתך ומחשב ציוני STAR/CAR...');
    setError('');
    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_text: answerText,
          question_text: currentQuestion,
          star_target: 'all',
          topic_tag: 'technical_behavioral',
          session_id: sessionId
        })
      });
      if (!res.ok) throw new Error('Failed to process context feedback analysis.');
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
      { role: 'candidate', text: actualAnswer }
    ];
    const nextTurn = turnNumber + 1;
    
    setConversationHistory(updatedHistory);
    setTurnNumber(nextTurn);
    setAnswerText('');
    setFeedback(null);
    fetchQuestion(nextTurn, updatedHistory);
  };

  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  if (loading && !feedback) {
    return (
      <div style={styles.spinnerContainer}>
        <style>{spinnerKeyframes}</style>
        <svg width="50" height="50" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="25" cy="25" r="20" fill="none" stroke="#2563eb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
        <div style={styles.spinnerText}>{loading}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}><strong>Error:</strong> {error}</div>}
      
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: '#64748b' }}>Turn {turnNumber}</span>
          {persona && <span style={styles.personaBadge}>Persona: {persona}</span>}
        </div>
        <div style={styles.questionText}>{currentQuestion}</div>
        
        {!feedback && (
          <form onSubmit={handleAnswerSubmit}>
            <textarea
              style={styles.textarea}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Provide your structural answer response details..."
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading || !answerText.trim()}>
              {loading ? 'Evaluating Structure...' : 'Submit Answer Response'}
            </button>
          </form>
        )}
      </div>

      {feedback && (
        <CoachOverlay 
          feedback={feedback} 
          originalAnswer={answerText}
          questionText={currentQuestion}
          sessionId={sessionId}
          onNext={handleNextQuestion} 
        />
      )}
    </div>
  );
}