import { useState, useEffect, useMemo } from 'react';
import recipes from './data/recipes.json';
import { GROUPS, fmt, aggregate, matches, makePlan, pickReplacement, load, save } from './lib.js';

const byId = Object.fromEntries(recipes.map((r) => [r.id, r]));
const EMO = { Vegetable: '🥬', Chicken: '🍗', Fish: '🐟', Tofu: '🫘', Egg: '🍳', Soup: '🍲', Beef: '🥩', Salad: '🥗', Pasta: '🍝', Rice: '🍚', Noodles: '🍜', 'Stir-fry': '🥘' };
const CATS = ['Vegetable', 'Chicken', 'Fish', 'Beef', 'Tofu', 'Egg', 'Soup', 'Stir-fry', 'Salad', 'Pasta', 'Rice', 'Noodles'].filter((c) => recipes.some((r) => r.tags.includes(c.toLowerCase())));
const METHODS = [['Steam', 'steam'], ['Grill', 'grill'], ['Bake', 'bake'], ['Air Fry', 'airfry'], ['Boil', 'boil'], ['Sauté', 'saute']];
const DEF = { days: 7, people: 1, times: 1, f: { sodium: true, protein: true, oil: true }, cats: [], methods: [], plan: [], extras: [], checked: {} };
const DISCLAIMER = 'Nutrition values are estimates. If you are following a medically prescribed diet, please verify ingredients, portions, and sodium/protein targets with your healthcare professional.';
const NOTES = ['Eat well today, Zy. I love you.', 'Ingat ka lagi, Zy. Kain ka nang maayos ♡', 'Every ulam here was picked with you in mind.', 'Ikaw ang paborito kong kasabay kumain.', 'Rest, drink water, and enjoy your ulam ♡', 'Proud of you today, Zy.'];
const NOTE = NOTES[new Date().getDate() % NOTES.length];
const hr = new Date().getHours();
const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
const NAV = [['home', '🏠', 'Home'], ['plan', '📅', 'Meal Plan'], ['grocery', '🛒', 'Grocery'], ['recipes', '📖', 'Recipes']];

const Nut = ({ r, p }) => {
  const k = p / r.servings, n = r.nutrition;
  return (
    <div className="nut">
      <span><b>{Math.round(n.calories * k)}</b> kcal</span>
      <span><b>{Math.round(n.protein * k)}</b> g protein</span>
      <span><b>{Math.round(n.sodium * k)}</b> mg sodium</span>
      <span><b>{+(r.oil * k).toFixed(1)}</b> ml oil</span>
    </div>
  );
};
const Disclaimer = () => <p className="fine">{DISCLAIMER}</p>;
const Chips = ({ items, sel, on }) => (
  <div className="chips">{items.map(([label, v]) => <button key={v} className={'chip' + (sel.includes(v) ? ' on' : '')} onClick={() => on(v)}>{label}</button>)}</div>
);
const Serv = ({ s, set }) => (
  <div className="serv">
    <label className="people">👩‍🍳 Cooking for <select value={s.people} onChange={(e) => set({ people: +e.target.value })}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}</select></label>
    <label className="people">🍽️ Each ulam eaten <select value={s.times} onChange={(e) => set({ times: +e.target.value })}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'time' : 'times'}</option>)}</select></label>
  </div>
);

export default function App() {
  const [s, setS] = useState(() => ({ ...DEF, ...load() }));
  const [view, setView] = useState('home');
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState('');
  useEffect(() => save(s), [s]);
  useEffect(() => { window.scrollTo(0, 0); }, [view, open]);
  const set = (p) => setS((o) => ({ ...o, ...p }));
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };
  const pool = useMemo(() => recipes.filter((r) => matches(r, s)), [s.f, s.cats, s.methods]);
  const ids = pool.map((r) => r.id);
  const toggle = (key) => (v) => set({ [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] });
  const setDays = (v) => set({ days: Math.max(1, Math.min(31, Math.floor(+v) || 1)) });

  const generate = () => {
    if (!pool.length) return say('No recipes match these filters. Try turning one off.');
    set({ plan: makePlan(ids, s.days), extras: [], checked: {}, hide: false }); say('Your meal plan is ready, Zy ♡');
    setView('plan');
  };
  const replace = (i) => {
    if (!pool.length) return say('No recipes match the filters.');
    set({ plan: s.plan.map((id, x) => (x === i ? pickReplacement(ids, s.plan, i) : id)) });
  };
  const addToPlan = (id) => {
    if (s.plan.includes(id)) return say('Already in your meal plan');
    set({ plan: [...s.plan, id], hide: false }); say('Added to your meal plan, Zy ♡');
  };
  const addGroceries = (id) => { set({ extras: [...s.extras, id] }); say('Ingredients added to grocery list 🛒'); };

  const cook = s.people * s.times;
  const clearPlan = () => { if (window.confirm('Clear the whole meal plan?')) { set({ plan: [], extras: [], checked: {} }); say('Meal plan cleared'); } };
  const clearList = () => { if (window.confirm('Clear the grocery list?')) { set({ extras: [], checked: {}, hide: true }); say('Grocery list cleared'); } };
  const items = useMemo(() => aggregate([...(s.hide ? [] : s.plan), ...s.extras].map((id) => ({ id, people: cook })), byId), [s.plan, s.extras, cook, s.hide]);
  const listText = () => GROUPS.map((g) => {
    const l = items.filter((i) => i.group === g).sort((a, b) => a.name.localeCompare(b.name));
    return l.length ? `${g}\n` + l.map((i) => `${s.checked[i.key] ? '✓' : '☐'} ${i.name} — ${fmt(i.amount, i.unit)}`).join('\n') : '';
  }).filter(Boolean).join('\n\n');
  const copy = async () => {
    try { await navigator.clipboard.writeText('🛒 Zy\'s Grocery List\n\n' + listText()); say('Grocery list copied'); }
    catch { const t = document.createElement('textarea'); t.value = listText(); document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); say('Grocery list copied'); }
  };

  const Filters = () => (
    <div className="card">
      <h3>Pick what you feel like</h3>
      <p className="fine">Every ulam here is made to be low sodium, lower protein and low oil (estimates).</p>
      <details><summary>Kinds of ulam {s.cats.length ? `(${s.cats.length})` : ''}</summary><Chips items={CATS.map((c) => [c, c.toLowerCase()])} sel={s.cats} on={toggle('cats')} /></details>
      <details><summary>Cooking methods {s.methods.length ? `(${s.methods.length})` : ''}</summary><Chips items={METHODS} sel={s.methods} on={toggle('methods')} /></details>
      <p className="fine">{pool.length} of {recipes.length} recipes match.</p>
    </div>
  );

  const Home = () => (
    <>
      <section className="hero">
        <p className="heart">♡</p>
        <p className="hi">{greet}, Zy</p>
        <h1>What are we having today, Zy?</h1>
        <p className="sub">Plan your meals, discover your next ulam, and let me handle the grocery list.</p>
        <p className="note">“{NOTE}”</p>
        <div className="row"><button className="btn big" onClick={() => document.getElementById('planner').scrollIntoView({ behavior: 'smooth' })}>📅 Plan My Meals</button></div>
      </section>
      <section id="planner" className="card">
        <h2>How many days are we planning?</h2>
        <div className="chips">{[1, 3, 5, 7, 14].map((d) => <button key={d} className={'chip' + (s.days === d ? ' on' : '')} onClick={() => setDays(d)}>{d} {d === 1 ? 'Day' : 'Days'}</button>)}</div>
        <label className="custom">or custom: <input type="number" inputMode="numeric" min="1" max="31" value={s.days} onChange={(e) => setDays(e.target.value)} /> days</label>
        <h2>How many people, and how many meals per ulam?</h2>
        <Serv s={s} set={set} />
        <p className="fine">Example: 3 days with each ulam eaten 2 times = 6 meals. You cook 3 ulam, and the grocery list is doubled to match.</p>
      </section>
      <Filters />
      <button className="btn big wide" onClick={generate}>❤️ Generate My Meal Plan</button>
      <div className="card soon"><b>✨ What can we cook with what we have?</b><p className="fine">Coming later: tell me what’s in the kitchen and I’ll suggest an ulam.</p></div>
      <p className="fine ctr">Made with love for Zy, by Wendell ♡</p>
      <Disclaimer />
    </>
  );

  const Plan = () => (
    <>
      <h2 className="title">Zy's meal plan</h2>
      <p className="fine">{s.plan.length} ulam × {s.times} = {s.plan.length * s.times} meals</p>
      <Serv s={s} set={set} />
      {!s.plan.length ? (
        <div className="card empty"><p>No meal plan yet, Zy.</p><button className="btn" onClick={() => setView('home')}>Plan My Meals</button></div>
      ) : (
        <>
          <div className="cards">
            {s.plan.map((id, i) => { const r = byId[id]; return (
              <article className="card meal" key={i + id}>
                <div className="art">{EMO[r.category] || '🍽️'}</div>
                <div className="body">
                  <small>Day {i + 1} · cook {cook} {cook === 1 ? 'serving' : 'servings'}</small>
                  <h3>{r.name}</h3>
                  <p>{r.description}</p>
                  <Nut r={r} p={s.people} />
                  <div className="row"><button className="btn sm" onClick={() => setOpen(id)}>View Recipe</button><button className="btn sm ghost" onClick={() => replace(i)}>🔄 Replace Ulam</button></div>
                </div>
              </article>); })}
          </div>
          <div className="row sticky"><button className="btn big" onClick={() => { set({ hide: false }); setView('grocery'); }}>🛒 Generate Grocery List</button><button className="btn ghost" onClick={generate}>New plan</button><button className="btn ghost" onClick={clearPlan}>🗑️ Clear plan</button></div>
        </>
      )}
      <Disclaimer />
    </>
  );

  const Grocery = () => (
    <>
      <h2 className="title">🛒 Zy's Grocery List</h2>
      <p className="fine noprint">For {s.people} {s.people === 1 ? 'person' : 'people'}, {s.plan.length} ulam, each eaten {s.times}×. Change servings and it recalculates.</p>
      <div className="noprint"><Serv s={s} set={set} /></div>
      {!items.length ? <div className="card empty"><p>Your grocery list is empty, Zy. Make a meal plan and it will appear here.</p><button className="btn" onClick={() => setView('home')}>Plan My Meals</button></div> : (
        <>
          <div className="row noprint"><button className="btn sm" onClick={copy}>📋 Copy List</button><button className="btn sm" onClick={() => window.print()}>🖨️ Print List</button><button className="btn sm ghost" onClick={() => set({ checked: {} })}>Clear Checked Items</button><button className="btn sm ghost" onClick={clearList}>🗑️ Clear Grocery List</button></div>
          {GROUPS.map((g) => { const l = items.filter((i) => i.group === g).sort((a, b) => a.name.localeCompare(b.name)); return l.length > 0 && (
            <section className="card" key={g}>
              <h3>{g} <small>{l.filter((i) => s.checked[i.key]).length}/{l.length}</small></h3>
              {l.map((i) => (
                <label key={i.key} className={'gi' + (s.checked[i.key] ? ' done' : '')}>
                  <input type="checkbox" checked={!!s.checked[i.key]} onChange={() => set({ checked: { ...s.checked, [i.key]: !s.checked[i.key] } })} />
                  <span className="box">{s.checked[i.key] ? '✓' : ''}</span><span className="nm">{i.name}</span><b>{fmt(i.amount, i.unit)}</b>
                </label>))}
            </section>); })}
          {s.extras.length > 0 && <div className="card noprint"><h3>Extra recipes added</h3>{s.extras.map((id, i) => <div className="ex" key={i}>{byId[id].name}<button className="x" aria-label="Remove" onClick={() => set({ extras: s.extras.filter((_, k) => k !== i) })}>✕</button></div>)}</div>}
        </>
      )}
    </>
  );

  const Recipes = () => {
    const [q, setQ] = useState('');
    const list = recipes.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
    return (
      <>
        <h2 className="title">Recipes</h2>
        <input className="search" placeholder="Search recipes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="cards">{list.map((r) => (
          <button className="card rec" key={r.id} onClick={() => setOpen(r.id)}><span className="art sm">{EMO[r.category] || '🍽️'}</span><span><b>{r.name}</b><small>{r.category} · {r.nutrition.calories} kcal</small></span></button>))}</div>
        <Disclaimer />
      </>
    );
  };

  const RecipeView = ({ r }) => {
    const k = s.people / r.servings, kc = cook / r.servings;
    const oil = r.ingredients.find((i) => i.name === 'Cooking oil'), water = r.ingredients.find((i) => i.name === 'Water');
    const txt = (t) => t.replace('{oil}', oil ? fmt(oil.amount * kc, 'ml') : '').replace('{water}', water ? fmt(water.amount * kc, 'ml') : '');
    const n = r.nutrition;
    return (
      <div className="page">
        <button className="back" onClick={() => setOpen(null)}>← Back</button>
        <div className="art big">{EMO[r.category] || '🍽️'}</div>
        <h1 className="rt">{r.name}</h1>
        <p>{r.description}</p>
        <Serv s={s} set={set} />
        <div className="card"><h3>Nutrition <small>estimate per meal for {s.people} {s.people === 1 ? 'person' : 'people'}</small></h3>
          <div className="nutg">{[['Calories', n.calories, 'kcal'], ['Protein', n.protein, 'g'], ['Carbohydrates', n.carbohydrates, 'g'], ['Fat', n.fat, 'g'], ['Sodium', n.sodium, 'mg'], ['Oil', r.oil, 'ml']].map(([l, v, u]) => <div key={l}><b>{+(v * k).toFixed(1)} {u}</b><small>{l}</small></div>)}</div></div>
        <div className="card"><h3>Ingredients <small>for {cook} {cook === 1 ? 'serving' : 'servings'}</small></h3><table><thead><tr><th>Ingredient</th><th>Amount</th></tr></thead><tbody>{r.ingredients.map((i) => <tr key={i.name}><td>{i.name}</td><td>{fmt(i.amount * kc, i.unit)}</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Instructions</h3><ol className="steps">{r.instructions.map((t, i) => <li key={i}>{txt(t)}</li>)}</ol></div>
        <div className="row"><button className="btn" onClick={() => addToPlan(r.id)}>❤️ Add to Meal Plan</button><button className="btn ghost" onClick={() => addGroceries(r.id)}>🛒 Add Ingredients to Grocery List</button></div>
        <Disclaimer />
      </div>
    );
  };

  const views = { home: Home, plan: Plan, grocery: Grocery, recipes: Recipes };
  const V = views[view];
  return (
    <>
      <header className="hdr"><div className="brand" onClick={() => { setOpen(null); setView('home'); }}>♡ Ulam, With Love<small>Made with love, one ulam at a time.</small></div>
        <nav className="nav">{NAV.map(([k, e, l]) => <button key={k} className={view === k && !open ? 'on' : ''} onClick={() => { setOpen(null); setView(k); }}><span>{e}</span>{l}</button>)}</nav></header>
      <main>{open ? <RecipeView r={byId[open]} /> : <V />}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
