import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  row: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
  col: { flex: 1, minWidth: '300px' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  scoreBadge: { fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' },
  list: { paddingLeft: '1.25rem', margin: '0.5rem 0' },
  listItem: { marginBottom: '0.5rem', lineHeight: '1.4' },
  emptyState: { textAlign: 'center', padding: '3rem 1rem', color: '#64748b' },
  loading: { fontSize: '1.1rem', color: '#64748b', textAlign: 'center', marginTop: '2rem' },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '6px' }
};

export default function ProgressDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/progress/user-001');
        if (!res.ok) throw new Error('Failed to retrieve performance progression data.');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) return <div style={styles.loading}>Analyzing analytics telemetry...</div>;
  if (error) return <div style={styles.error}><strong>Telemetry error:</strong> {error}</div>;

  // Render empty state if profile telemetry is uninitialized
  if (!data || (!data.session_history?.length && !data.readiness_score)) {
    return (
      <div style={styles.card}>
        <div style={styles.emptyState}>
          <h2>No Simulation Progress Tracked Yet</h2>
          <p>Complete your first active simulation interview cycle to initialize historical breakdown profiling.</p>
        </div>
      </div>
    );
  }

  // Map star structural score metrics for chart rendering
  const chartData = data.star_breakdown ? Object.entries(data.star_breakdown).map(([key, val]) => ({
    name: key.toUpperCase(),
    Score: val
  })) : [];

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={{ ...styles.card, flex: '1 1 250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Global Profile Readiness</span>
          <div style={styles.scoreBadge}>{data.readiness_score}%</div>
        </div>

        {chartData.length > 0 && (
          <div style={{ ...styles.card, flex: '2 1 450px' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>STAR Structural Component Breakdown</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div style={styles.row}>
        {data.weakness_profile && data.weakness_profile.length > 0 && (
          <div style={{ ...styles.card, ...styles.col }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Identified Growth Factors</h3>
            <ul style={styles.list}>
              {data.weakness_profile.map((item, idx) => (
                <li key={idx} style={styles.listItem}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {data.training_plan && data.training_plan.length > 0 && (
          <div style={{ ...styles.card, ...styles.col }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Target Execution Blueprint</h3>
            <ul style={styles.list}>
              {data.training_plan.map((item, idx) => (
                <li key={idx} style={styles.listItem}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}