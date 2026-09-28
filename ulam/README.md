# ♡ Ulam, With Love

*Made with love, one ulam at a time.* A warm little meal planner for Filipino home cooking: spin for an ulam, plan 1–31 days, swap any day, read the recipe, and get **one combined grocery list** with exact quantities. Runs entirely in the browser (React + Vite). No backend, no login, no paid APIs. Everything is saved in `localStorage`.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # recipe data + grocery math tests
npm run build    # outputs dist/
```

## Deploy free on GitHub Pages
1. Create a new empty GitHub repository (any name, e.g. `ulam-with-love`).
2. In this folder run:
   ```bash
   git init && git add . && git commit -m "Ulam, With Love"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ulam-with-love.git
   git push -u origin main
   ```
3. On GitHub open **Settings → Pages**. Under **Build and deployment → Source** choose **GitHub Actions**.
4. Open the **Actions** tab. The *Deploy to GitHub Pages* workflow runs on every push to `main` (tests first, then build, then deploy). When it turns green, your app is live at `https://<your-username>.github.io/ulam-with-love/`.
5. On her phone: open the link, then **Share → Add to Home Screen**.

`vite.config.js` uses `base: './'`, so it works under any repo name with no edits.

## Add recipes
Recipes live in `src/data/recipes.json`, separate from the UI. Copy an entry and edit it. Amounts are for `servings: 1` and are scaled automatically.
- `ingredients[].group` is one of `Vegetables`, `Protein`, `Aromatics`, `Pantry`, or `Hidden` (kept out of the grocery list, e.g. water).
- The same ingredient `name` + `unit` is merged across recipes in the grocery list, so keep names consistent (e.g. always `Chicken breast`).
- `tags`: `low-sodium`, `lower-protein`, `low-oil` power the filters. The lowercase category (`chicken`, `soup`, `egg`…) and method tags (`steam`, `grill`, `bake`, `airfry`, `boil`, `saute`) power the optional filters.
- In instructions, `{oil}` and `{water}` are replaced with the scaled amounts.
- Or add a line to `scripts/build-recipes.mjs` and run `npm run recipes` to regenerate the JSON.

## Future AI feature
`src/ai/suggest.js` is a stub for "✨ What can we cook with what we have?". Version 1 makes no network calls.

## Notes
Nutrition values are estimates, not medical advice. The default filters use these rules: low sodium ≤ 350 mg, lower protein ≤ 20 g, less oil ≤ 5 ml per serving. Tune them in `scripts/build-recipes.mjs`.
