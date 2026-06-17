import React, { useState } from 'react';

const styles = {
  button: {
    backgroundColor: '#059669',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};

export default function InterviewGuideExport({ question_bank_id }) {
  const [exporting, setExporting] = useState(false);

  if (!question_bank_id) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/questionBank/export/${question_bank_id}`);
      if (!res.ok) throw new Error('Export download execution failed.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'interview-guide.json');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export configuration error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button onClick={handleExport} style={styles.button} disabled={exporting}>
      {exporting ? 'Exporting File...' : 'Export Guide Document (JSON)'}
    </button>
  );
}
