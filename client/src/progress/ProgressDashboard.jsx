import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAuthHeaders } from '../utils/auth';
import { useLanguage } from '../utils/LanguageContext';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#f5f3ff';

function StatCard({ label, value, sub, icon, delta }) {
  const { t } = useLanguage();
  const trendUp = delta !== null && delta !== undefined && delta > 0;
  const trendDown = delta !== null && delta !== undefined && delta < 0;

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '14px',
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '1.25rem', flex: '1 1 180px', minWidth: '150px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
        {value}
      </div>
      {trendUp && (
        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', marginTop: '0.3rem' }}>
          ▲ {t('progressTrendingUp')} (+{delta})
        </div>
      )}
      {trendDown && (
        <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600', marginTop: '0.3rem' }}>
          ▼ {t('progressTrendingDown')} ({delta})
        </div>
      )}
      {sub && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>
        <span style={{ color: '#1e293b' }}>{label}</span>
        <span style={{ color }}>{score}/100</span>
      </div>
      <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`,
          backgroundColor: color, borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

export default function ProgressDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    const fetchProgress = async () => {
      const activeUserId = localStorage.getItem('userId') || 'user-001';
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/progress/${activeUserId}?lang=${language}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
          cache: 'no-store',
        });
        if (res.status === 404) { setData(null); setLoading(false); return; }
        if (!res.ok) throw new Error('Failed to retrieve progress data.');
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchProgress();

    // Also re-fetch whenever another screen fires the global refresh event
    // (e.g. SimulatorScreen after saving progress, without requiring navigation).
    const handleRefreshEvent = () => fetchProgress();
    window.addEventListener('dashboard:refresh', handleRefreshEvent);

    return () => {
      controller.abort();
      window.removeEventListener('dashboard:refresh', handleRefreshEvent);
    };
  // location.key changes on every navigation — guarantees a fresh fetch whenever
  // the user arrives at this route, even if the component instance is reused.
  }, [language, location.key]);

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '5rem 2rem', gap: '1rem',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: '44px', height: '44px', border: '4px solid #e0d9ff',
        borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{ fontWeight: '600', color: '#64748b' }}>{t('progressLoadingAnalytics')}</div>
    </div>
  );

  if (error) return (
    <div style={{
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', padding: '1rem', borderRadius: '10px', fontWeight: '500',
    }}>
      ⚠️ {error}
    </div>
  );

  if (!data || (!data.session_history?.length && !data.readiness_score)) {
    return (
      <div style={{
        textAlign: 'center', padding: '4rem 2rem',
        backgroundColor: '#fff', borderRadius: '16px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <span style={{ fontSize: '3rem' }}>📊</span>
        <h2 style={{ marginTop: '1rem', color: '#1e293b', fontWeight: '800' }}>{t('progressNoProgressTitle')}</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '380px', margin: '0.5rem auto 1.5rem' }}>
          {t('progressNoProgressDesc')}
        </p>
        <button
          onClick={() => navigate('/prepare')}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '0.75rem 2rem', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}
        >
          {t('progressFirstSimBtn')}
        </button>
      </div>
    );
  }

  const sessions = data.session_history || [];
  const star = data.star_breakdown || {};
  const S = star.S ?? 0, T = star.T ?? 0, A = star.A ?? 0, R = star.R ?? 0;
  const bestScore = sessions.reduce((max, s) => Math.max(max, s.readiness_score ?? 0), 0);
  const avgStar = Math.round((S + T + A + R) / 4);

  // Compute actual trend from last two sessions
  const scoreTrend = sessions.length >= 2
    ? (sessions[sessions.length - 1].readiness_score ?? 0) - (sessions[sessions.length - 2].readiness_score ?? 0)
    : null;

  // Area chart data – readiness trend
  const trendData = sessions.map((s, i) => ({
    session: `#${i + 1}`,
    Score: s.readiness_score ?? 0,
  }));

  // Radar chart data
  const radarData = [
    { subject: t('starSituation'), score: S },
    { subject: t('starTask'), score: T },
    { subject: t('starAction'), score: A },
    { subject: t('starResult'), score: R },
    { subject: t('starReflection'), score: Math.round((S + R) / 2) },
  ];

  const getBarColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.75rem)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            📊 {t('progressDashTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {t('progressDashSubtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate('/prepare')}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '0.75rem 1.5rem', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.9rem',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}
        >
          <span>{t('progressStartNewSim')}</span>
          <span>🚀</span>
        </button>
      </div>

      {/* ─── Stats Grid ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <StatCard label={t('progressOverallScore')} value={`${data.readiness_score}%`} icon="🎯" delta={scoreTrend} />
        <StatCard label={t('progressSimulations')} value={sessions.length} icon="🎤" sub={t('progressCompletedSessions')} />
        <StatCard label={t('progressAvgStarScore')} value={avgStar} icon="⭐" sub={t('progressAcrossComponents')} />
        <StatCard label={t('progressBestScoreLabel')} value={`${bestScore}%`} icon="🏆" sub={t('progressPersonalBest')} />
      </div>

      {/* ─── Score Trend Chart ─── */}
      {trendData.length > 0 && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          padding: '1.5rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
              {t('progressScoreTrendTitle')}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              {t('progressScoreTrendDesc')}
            </p>
          </div>
          {trendData.length === 1 && (
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
              {language === 'he'
                ? 'השלם עוד סשנים כדי לראות מגמת ציוניך'
                : 'Complete more sessions to see your score trend'}
            </p>
          )}
          <div style={{ width: '100%', height: 200 }} dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="session" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: '700', color: '#1e293b' }}
                />
                <ReferenceLine 
                  y={Number(localStorage.getItem('pref-readiness-threshold') || '75')} 
                  label={{ value: `${t('chartTargetLabel')} (${localStorage.getItem('pref-readiness-threshold') || '75'}%)`, fill: '#ef4444', fontSize: 10, position: 'top' }}
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                />
                <Area
                  type="monotone"
                  dataKey="Score"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#colorScore)"
                  dot={trendData.length === 1
                    ? { fill: '#6366f1', r: 8, strokeWidth: 3, stroke: '#fff' }
                    : { fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── STAR Breakdown ─── */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Radar chart */}
        <div style={{
          flex: '1 1 280px',
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          padding: '1.5rem',
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
            {t('progressFrameworkBalance')}
          </h2>
          <div style={{ width: '100%', height: 280 }} dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                outerRadius={60}
                margin={{ top: 20, right: 45, bottom: 10, left: 45 }}
              >
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: '600' }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="score"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress bars */}
        <div style={{
          flex: '1 1 280px',
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          padding: '1.5rem',
        }}>
          <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
            {t('progressComponentScores')}
          </h2>
          <ProgressBar label={t('starSituation')} score={S} color={getBarColor(S)} />
          <ProgressBar label={t('starTask')} score={T} color={getBarColor(T)} />
          <ProgressBar label={t('starAction')} score={A} color={getBarColor(A)} />
          <ProgressBar label={t('starResult')} score={R} color={getBarColor(R)} />
        </div>
      </div>

      {/* ─── Weakness + Recommendations ─── */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Weakness card */}
        {data.weakness_profile && data.weakness_profile.length > 0 && (
          <div style={{
            flex: '1 1 280px',
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1rem',
              }}>⚠️</div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#991b1b' }}>
                {t('progressWeaknessProfile')}
              </h2>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.weakness_profile.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.45' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations card */}
        {data.training_plan && data.training_plan.length > 0 && (
          <div style={{
            flex: '1 1 280px',
            backgroundColor: '#fff', borderRadius: '16px',
            border: '1px solid #bfdbfe', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1rem',
              }}>🎯</div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1d4ed8' }}>
                {t('progressRecommendedTraining')}
              </h2>
            </div>
            <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.training_plan.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.45' }}>{item}</li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/prepare')}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              }}
            >
              {t('progressPracticeThis')}
            </button>
          </div>
        )}
      </div>

      {/* GDPR Data Deletion */}
      <div style={{
        marginTop: '2rem',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #fecaca',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#991b1b' }}>
            {t('progressGdprTitle')}
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
          {t('progressGdprDesc')}
        </p>

        {deleteStatus && deleteStatus !== '' && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: '500' }}>
            ⚠️ {deleteStatus}
          </div>
        )}

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#fee2e2', color: '#dc2626',
              border: '1px solid #fecaca', borderRadius: '10px',
              fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t('progressDeleteAllBtn')}
          </button>
        ) : (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#991b1b', margin: '0 0 0.75rem 0' }}>
              {t('progressDeleteConfirmText')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('progressCancel')}
              </button>
              <button
                onClick={async () => {
                  const activeUserId = localStorage.getItem('userId') || 'user-001';
                  try {
                    const res = await fetch(`/api/progress/${activeUserId}/data-only`, {
                      method: 'DELETE',
                      headers: getAuthHeaders(),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Delete failed');
                    }
                    if (!isMountedRef.current) return;
                    setData(null);
                    setDeleteConfirm(false);
                    setDeleteStatus('');
                  } catch (e) {
                    console.error('Dashboard delete error:', e.message);
                    if (!isMountedRef.current) return;
                    setDeleteStatus(t('progressDeleteFailMsg'));
                    setDeleteConfirm(false);
                  }
                }}
                style={{ flex: 2, padding: '0.65rem', borderRadius: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                {t('progressDeleteYes')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}