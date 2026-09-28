import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { aggregate, makePlan, pickReplacement, matches } from '../src/lib.js';
const R = JSON.parse(fs.readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
const by = Object.fromEntries(R.map((r) => [r.id, r]));
const S = { f: { sodium: true, protein: true, oil: true }, cats: [], methods: [] };
const pool = R.filter((r) => matches(r, S)).map((r) => r.id);

test('every recipe has complete data', () => {
  for (const r of R) {
    assert.ok(r.id && r.name && r.category && r.instructions.length && r.ingredients.length, r.id);
    for (const k of ['calories', 'protein', 'carbohydrates', 'fat', 'sodium']) assert.equal(typeof r.nutrition[k], 'number', r.id + k);
  }
  assert.equal(new Set(R.map((r) => r.id)).size, R.length);
});
test('plan has exactly N days (1, 7, custom) and no duplicates when pool allows', () => {
  for (const n of [1, 3, 7, 12, 14]) {
    const p = makePlan(pool, n);
    assert.equal(p.length, n);
    if (n <= pool.length) assert.equal(new Set(p).size, n);
  }
});
test('replace avoids recipes already in the plan', () => {
  const plan = makePlan(pool, 7);
  for (let i = 0; i < 50; i++) assert.ok(!plan.includes(pickReplacement(pool, plan, 3)));
});
test('chicken from three dishes is one line: 240 g for 1 person, scaled for more', () => {
  const ids = ['chicken-tinola', 'chicken-with-sayote', 'chicken-with-cabbage'];
  for (const p of [1, 2, 4]) {
    const c = aggregate(ids.map((id) => ({ id, people: p })), by).filter((i) => /chicken/i.test(i.name));
    assert.equal(c.length, 1);
    assert.equal(c[0].amount, 240 * p);
  }
});
test('aggregation matches an independent sum for random 7-day plans', () => {
  for (let t = 0; t < 200; t++) {
    const p = 1 + (t % 4), plan = makePlan(pool, 7);
    const got = aggregate(plan.map((id) => ({ id, people: p })), by);
    const want = {};
    for (const id of plan) for (const i of by[id].ingredients) if (i.group !== 'Hidden') want[i.name + '|' + i.unit] = (want[i.name + '|' + i.unit] || 0) + i.amount * p;
    assert.equal(got.length, Object.keys(want).length);
    for (const g of got) assert.ok(Math.abs(g.amount - want[g.name + '|' + g.unit]) < 0.01, g.name);
  }
});
