import { useState, useEffect, useMemo } from 'react';

const DEFAULT_METRICS = [
  { key: 'communication', label: 'Communication' },
  { key: 'eyeContact', label: 'Eye Contact' },
  { key: 'following', label: 'Following Instructions' },
  { key: 'focus', label: 'Focus Duration' },
  { key: 'social', label: 'Social Interaction' },
  { key: 'emotional', label: 'Emotional Regulation' },
];

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toISOString().split('T')[0];
}

function ProgressTracker({ child, role, onSave, customMetrics }) {
  const metrics = customMetrics || DEFAULT_METRICS;
  const storageKey = 'progressEntries_v1';

  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => {
    const initial = {};
    metrics.forEach((m) => (initial[m.key] = 3));
    initial.notes = '';
    return initial;
  });

  // Re-initialize form if metrics change
  useEffect(() => {
    const initial = {};
    metrics.forEach((m) => (initial[m.key] = 3));
    initial.notes = '';
    setForm(initial);
  }, [metrics]);

  useEffect(() => {
    // reload entries if storage changes externally
    const handler = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        setEntries(raw ? JSON.parse(raw) : []);
      } catch (e) { }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const childEntries = useMemo(() => entries.filter((e) => e.childId === child.id), [entries, child]);

  const latestByRole = useMemo(() => {
    const map = {};
    childEntries.slice().reverse().forEach((e) => {
      if (!map[e.role]) map[e.role] = e;
    });
    return map;
  }, [childEntries]);

  const averages = useMemo(() => {
    const out = {};
    metrics.forEach((m) => {
      const vals = Object.values(latestByRole)
        .map((r) => (r && r.metrics && typeof r.metrics[m.key] === 'number' ? r.metrics[m.key] : null))
        .filter((v) => v !== null && v !== undefined);
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      out[m.key] = { avg, perRole: Object.fromEntries(Object.entries(latestByRole).map(([k, v]) => [k, v?.metrics?.[m.key] ?? null])) };
    });
    return out;
  }, [latestByRole, metrics]);

  const lastUpdate = useMemo(() => {
    if (childEntries.length === 0) return null;
    const latest = childEntries.reduce((a, b) => (new Date(a.timestamp) > new Date(b.timestamp) ? a : b));
    return latest;
  }, [childEntries]);

  const handleSave = () => {
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      childId: child.id,
      role,
      metrics: metrics.reduce((acc, m) => ({ ...acc, [m.key]: Number(form[m.key]) }), {}),
      notes: form.notes || '',
      timestamp: new Date().toISOString(),
    };

    const next = [...entries, entry];
    setEntries(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) { }

    if (typeof onSave === 'function') onSave(entry);
    setOpen(false);
  };

  return (
    <div className="glass p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">🧠 Child Progress Tracker</h3>
        <div className="space-x-2">
          <button onClick={() => setOpen((s) => !s)} className="px-3 py-1 rounded glass">{open ? 'Close' : 'Add Update'}</button>
          <button onClick={() => { }} className="px-3 py-1 rounded glass">View History</button>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-3">{lastUpdate ? `Last Updated: ${formatDate(lastUpdate.timestamp)} by ${lastUpdate.role}` : 'No updates yet'}</div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        {metrics.map((m) => (
          <div key={m.key} className="p-3 bg-white/50 rounded-lg">
            <div className="font-medium text-gray-800 mb-1">{m.label}</div>
            <div className="text-sm text-gray-600 mb-2">Avg: {averages[m.key].avg ? averages[m.key].avg.toFixed(2) : '—'}</div>
            <div className="flex items-center space-x-2 text-xs">
              {Object.entries(averages[m.key].perRole).map(([r, v]) => (
                <div key={r} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${v ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  <div className="text-gray-600">{r}: {v ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="bg-white/50 p-4 rounded-lg">
          <div className="grid md:grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div key={m.key}>
                <label className="block text-sm text-gray-700 mb-1">{m.label} (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form[m.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [m.key]: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600">{form[m.key]} / 5</div>
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Role-specific Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full p-2 rounded glass" rows={4}></textarea>
            </div>
          </div>
          <div className="mt-3">
            <button onClick={handleSave} className="px-4 py-2 bg-purple-500 text-white rounded-lg">Save</button>
            <button onClick={() => setOpen(false)} className="ml-2 px-4 py-2 rounded glass">Cancel</button>
          </div>
        </div>
      )}

      {/* History preview */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Recent Updates</h4>
        <div className="space-y-2">
          {childEntries.slice(-5).reverse().map((e) => (
            <div key={e.id} className="bg-white/50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-700">{formatDate(e.timestamp)} • {e.role}</div>
                  <div className="text-sm text-gray-800 font-medium mt-1">{Object.entries(e.metrics).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' • ')}</div>
                </div>
                <div className="text-sm text-gray-600">{e.notes?.slice(0, 80)}</div>
              </div>
            </div>
          ))}
          {childEntries.length === 0 && <div className="text-gray-500">No updates yet</div>}
        </div>
      </div>
    </div>
  );
}

export default ProgressTracker;
