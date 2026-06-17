import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import UploadResumeForm from './simulator/UploadResumeForm';
import SimulatorScreen from './simulator/SimulatorScreen';
import QuestionBankScreen from './questionBank/QuestionBankScreen';
import ProgressDashboard from './progress/ProgressDashboard';

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1e293b',
    color: '#ffffff',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: '#ffffff',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#334155',
  },
};

export default function App() {
  return (
    <BrowserRouter>
      <nav style={styles.navbar}>
        <Link to="/" style={styles.logo}>smartinterviewer</Link>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/questions" style={styles.link}>Question Bank</Link>
          <Link to="/progress" style={styles.link}>Progress</Link>
        </div>
      </nav>
      <div style={styles.container}>
        <Routes>
          <Route path="/" element={<UploadResumeForm />} />
          <Route path="/simulator" element={<SimulatorScreen />} />
          <Route path="/questions" element={<QuestionBankScreen />} />
          <Route path="/progress" element={<ProgressDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}