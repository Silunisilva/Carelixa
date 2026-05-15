// Lightweight heuristic 'AI' that aggregates role updates and returns teaching suggestions
export function generateInsights(childId) {
  const storageKey = 'progressEntries_v1';
  let entries = [];
  try {
    const raw = localStorage.getItem(storageKey);
    entries = raw ? JSON.parse(raw) : [];
  } catch (e) {
    entries = [];
  }

  const childEntries = entries.filter((e) => e.childId === childId);
  if (childEntries.length === 0) {
    return {
      weekOf: new Date().toISOString().split('T')[0],
      content: 'Not enough data yet. Encourage teacher/parent/doctor to submit updates to generate insights.',
      recommendations: [],
    };
  }

  // latest per role
  const latestByRole = {};
  childEntries.slice().reverse().forEach((e) => {
    if (!latestByRole[e.role]) latestByRole[e.role] = e;
  });

  // compute averages across roles for each metric
  const metricKeys = Object.keys(childEntries[0].metrics || {});
  const metrics = {};
  metricKeys.forEach((k) => {
    const vals = Object.values(latestByRole).map((r) => (r?.metrics?.[k] ?? null)).filter((v) => v != null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    metrics[k] = { avg, perRole: Object.fromEntries(Object.entries(latestByRole).map(([role, entry]) => [role, entry?.metrics?.[k] ?? null])) };
  });

  // generate recommendations heuristically
  const recommendations = [];

  // focus on low average metrics
  Object.entries(metrics).forEach(([k, v]) => {
    if (v.avg !== null && v.avg <= 3) {
      let focus = k.charAt(0).toUpperCase() + k.slice(1);
      let method = '';
      switch (k) {
        case 'communication':
          method = 'Increase modeling of language during routines, use picture-choice boards, and embed 1-2 targeted communication targets per day.';
          break;
        case 'eyeContact':
          method = 'Short, motivating eye-contact practice (2 minutes) paired with preferred items; fade prompts gradually.';
          break;
        case 'following':
          method = 'Break tasks into 1–2 step chunks and use visual schedules; provide immediate, specific praise.';
          break;
        case 'focus':
          method = 'Shorter task durations with built-in movement breaks; reduce auditory distractions when possible.';
          break;
        case 'social':
          method = 'Structured peer-pairing activities and scripted play prompts to scaffold interaction.';
          break;
        case 'emotional':
          method = 'Teach short calming strategies and a consistent calm-down routine; use visual supports.';
          break;
        default:
          method = 'Observe routines and scaffold small, measurable steps.';
      }

      // include role notes context when available
      const contextNotes = Object.entries(v.perRole).map(([r, val]) => {
        const note = latestByRole[r]?.notes ? ` (${r}: ${latestByRole[r].notes.slice(0,60)})` : '';
        return `${r}${note}`;
      }).join(' | ');

      recommendations.push({ focus, method, avg: v.avg, context: contextNotes });
    }
  });

  // if none low, recommend maintenance + enrichment
  if (recommendations.length === 0) {
    recommendations.push({ focus: 'General Progress', method: 'Maintain successful strategies; consider adding slight challenge increments and monitor weekly.', avg: null, context: '' });
  }

  const contentLines = [];
  contentLines.push(`Weekly Insights for child ${childId} — generated ${new Date().toISOString().split('T')[0]}`);
  recommendations.forEach((r, i) => {
    contentLines.push(`${i + 1}. ${r.focus} (Avg: ${r.avg ? r.avg.toFixed(2) : '—'})`);
    contentLines.push(`   - ${r.method}`);
    if (r.context) contentLines.push(`   - Context: ${r.context}`);
  });

  return {
    weekOf: new Date().toISOString().split('T')[0],
    content: contentLines.join('\n'),
    recommendations,
  };
}

export default generateInsights;
