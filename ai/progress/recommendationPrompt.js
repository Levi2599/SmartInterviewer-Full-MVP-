/**
 * Processes user interview performance data locally. Computes numerical baseline scores 
 * and handles raw data sorting/mapping without invoking external LLMs.
 * * @param {Object} input
 * @returns {Promise<Object>} JSON matching Expected Output
 */
async function recommendationPrompt(input) {
  // 1. Strict Validation
  if (!input) {
    throw new Error('Input payload is required.');
  }
  if (!Array.isArray(input.weakness_profile)) {
    throw new Error('Invalid weakness_profile provided. Must be an array.');
  }
  if (typeof input.session_count !== 'number' || isNaN(input.session_count)) {
    throw new Error('Invalid session_count provided. Must be a number.');
  }
  if (!input.star_breakdown || typeof input.star_breakdown !== 'object') {
    throw new Error('Invalid star_breakdown provided. Must be an object containing S, T, A, R metrics.');
  }

  // Extract framework scores with defensive fallbacks to 0
  const s = Number(input.star_breakdown.S) || 0;
  const t = Number(input.star_breakdown.T) || 0;
  const a = Number(input.star_breakdown.A) || 0;
  const r = Number(input.star_breakdown.R) || 0;

  // 2. Pure Data Computations (No external AI calls)
  // Compute overall readiness score as an unweighted mathematical average percentage
  const maxPossibleScorePerComponent = 100;
  const totalComponents = 4;
  const combinedScore = s + t + a + r;
  const calculatedReadiness = Math.round((combinedScore / (maxPossibleScorePerComponent * totalComponents)) * 100);
  
  // Ensure the numerical bounds stay structurally clamped between 0 and 100
  const readiness_score = Math.max(0, Math.min(100, calculatedReadiness));

  // Determine top priority focus area based on the lowest individual STAR metric
  const starMetrics = [
    { component: 'Situation mapping', score: s },
    { component: 'Task definition', score: t },
    { component: 'Action articulation', score: a },
    { component: 'Results and impact quantifications', score: r }
  ];
  
  // Sort ascending to extract the metric with the lowest numerical performance
  starMetrics.sort((first, second) => first.score - second.score);
  const primaryStructuralGap = starMetrics[0].component;

  // Map user weaknesses directly to a structured educational roadmap
  const priority_focus = `Improve structural fidelity regarding ${primaryStructuralGap}.`;
  
  const training_plan = [];
  if (input.weakness_profile.length === 0) {
    training_plan.push('Maintain consistent execution pacing. Proceed with general mockup drills.');
  } else {
    // Generate actionable items for each documented weakness tag
    input.weakness_profile.forEach(tag => {
      training_plan.push(`Targeted technical workshop module: Focused exercises on "${tag}".`);
    });
  }
  
  // Appending framework structural reinforcement to the plan
  training_plan.push(`Complete 3 target simulations isolating structural framework deficits in: ${primaryStructuralGap}.`);

  // 3. Return Standardized Output Payload
  return {
    training_plan,
    priority_focus,
    readiness_score
  };
}

module.exports = recommendationPrompt;