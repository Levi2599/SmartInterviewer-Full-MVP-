/**
 * Detects the lowest performing STAR framework component and constructs a weakness profile.
 * @param {Array} star_history - Array of objects containing scores: { situation, task, action, result }
 */
async function detectWeaknesses(star_history, language = 'en') {
  if (!star_history || star_history.length === 0) {
    const noDataMsg = language === 'he'
      ? 'אין עדיין נתוני התנהגות היסטוריים.'
      : 'No historic behavioral data captured yet.';
    return { weakness_profile: [noDataMsg], lowest_component: "N/A" };
  }

  const totals = { situation: 0, task: 0, action: 0, result: 0 };
  const counts = { situation: 0, task: 0, action: 0, result: 0 };

  star_history.forEach(session => {
    // Standardize key access regardless of structure variation
    const s = session.situation ?? session.S;
    const t = session.task ?? session.T;
    const a = session.action ?? session.A;
    const r = session.result ?? session.R;

    if (s !== undefined) { totals.situation += s; counts.situation++; }
    if (t !== undefined) { totals.task += t; counts.task++; }
    if (a !== undefined) { totals.action += a; counts.action++; }
    if (r !== undefined) { totals.result += r; counts.result++; }
  });

  const averages = {};
  Object.keys(totals).forEach(key => {
    averages[key] = counts[key] > 0 ? totals[key] / counts[key] : 5; // Default middle-ground baseline
  });

  let lowest_component = 'situation';
  let minScore = averages.situation;

  Object.entries(averages).forEach(([component, score]) => {
    if (score < minScore) {
      minScore = score;
      lowest_component = component;
    }
  });

  const componentMapping = {
    situation: "Context Setting (Situation)",
    task: "Objective Alignment (Task)",
    action: "Execution Tactics (Action)",
    result: "Impact Presentation (Result)"
  };

  const heComponentMapping = {
    situation: "הגדרת הקשר (מצב)",
    task: "יישור מטרות (משימה)",
    action: "טקטיקות ביצוע (פעולה)",
    result: "הצגת השפעה (תוצאה)"
  };

  const profile = language === 'he'
    ? `המועמד מדגים צורך בצמיחה במדדים המבניים של ${heComponentMapping[lowest_component]}.`
    : `Candidate demonstrates room for growth inside structural ${componentMapping[lowest_component]} metrics.`;

  return {
    weakness_profile: [profile],
    lowest_component: lowest_component.toUpperCase()
  };
}

module.exports = { detectWeaknesses };