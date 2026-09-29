export const GROUPS = ['Vegetables', 'Protein', 'Aromatics', 'Pantry'];
export const round3 = (n) => Math.round(n * 1000) / 1000;
export function fmt(n, u) {
  if (u === 'g' && n >= 1000) return `${+(n / 1000).toFixed(2)} kg`;
  if (u === 'ml' && n >= 1000) return `${+(n / 1000).toFixed(2)} l`;
  const v = n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
  return `${v} ${u}`;
}
// Combine every ingredient of every planned recipe into one list (same name + unit => summed).
export function aggregate(entries, byId) {
  const m = new Map();
  for (const { id, people } of entries) {
    const r = byId[id];
    if (!r) continue;
    for (const i of r.ingredients) {
      if (i.group === 'Hidden') continue;
      const key = `${i.name.toLowerCase()}|${i.unit}`;
      const e = m.get(key) || { key, name: i.name, unit: i.unit, group: i.group, amount: 0 };
      e.amount = round3(e.amount + (i.amount * people) / r.servings);
      m.set(key, e);
    }
  }
  return [...m.values()];
}
export function matches(r, s) {
  const t = r.tags;
  return (!s.cats.length || s.cats.some((c) => t.includes(c))) && (!s.methods.length || s.methods.some((c) => t.includes(c)));
}
export const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// n unique recipes when the pool allows; otherwise reshuffles and repeats, never back-to-back.
export function makePlan(pool, n) {
  const out = []; let bag = [];
  if (!pool.length) return out;
  while (out.length < n) {
    if (!bag.length) { bag = shuffle(pool); if (out.length && bag.length > 1 && bag[0] === out[out.length - 1]) bag.push(bag.shift()); }
    out.push(bag.shift());
  }
  return out;
}
export function pickReplacement(pool, plan, idx) {
  let c = pool.filter((id) => !plan.includes(id));
  if (!c.length) c = pool.filter((id) => id !== plan[idx]);
  return c.length ? c[Math.floor(Math.random() * c.length)] : plan[idx];
}
const KEY = 'ulam-with-love:v1';
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } };
