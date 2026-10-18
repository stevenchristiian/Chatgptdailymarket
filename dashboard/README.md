# Market Notes — dashboard v2

An Indonesian research dashboard built from the dated Markdown files in `crypto-recaps/`. No credentials, market API keys, or runtime backend are needed. It never places orders or refreshes archived quotes as live prices.

![Market Notes v2, verified public dashboard on 15 October 2026](preview.jpg)

## Build and deploy

```sh
python3 dashboard/build.py
```

The output directory remains `dist`. Root `wrangler.jsonc` explicitly runs the Python build and deploys `dist`, so Wrangler cannot accidentally auto-detect and publish the unrendered template. Keep the build root at the repository root and deploy with `npx wrangler deploy`. New recap commits are included on the next automatic deployment. Do not commit `dist`.

## Validate

```sh
python3 -m unittest discover -s dashboard -p 'test_*.py'
python3 dashboard/build.py
node --check dashboard/app.js
node dashboard/test_app.cjs
```

The regression checks cover mixed Indonesian/English financial notation, historical prices without a `$` prefix, separation of signal labels from conditional triggers, exact oil observations, escaped Markdown, ETF completeness, and all six views against every real archive. Node is only needed for development checks; the production build uses the Python standard library.

## Interface

- Overview: source-based briefing, market breadth, dated USD/IDR and ETF observations, changes, agenda, and Stories.
- Market: asset and signal filters, snapshot comparison, sampled archive charts, signal reasons and invalidation, and original drawdown methodology.
- Rotation: perpetual DEX, RWA, and BTC → ETH, with conditional status separate from asset BUY/SELL labels.
- Macro: complete/partial ETF flows, oil observations, dated FX, geopolitical scenarios, and WITA agenda.
- Research: QNT/HYPE/LINK/ONDO, supply warnings, other fundamentals, and the dated Signal Deck comparison.
- Archive: complete source report, table of contents, UTF-8 Markdown download, and source links.
- Portfolio: private, PIN-gated. Not part of the public report set and not included in any build output.

Deep links retain `?date=YYYY-MM-DD` and accept `&view=market|rotation|macro|research|library`. The default is the newest report. Older `#section-N` links open the full report. Theme is stored locally; there is no account, analytics, or tracking backend. The Portfolio view is the one exception to the no-backend rule: it holds no data in the published bundle and fetches a private snapshot at runtime from a PIN-gated Supabase RPC.

## Data contract

Use a main price table headed `Aset | Harga USD | 24 jam`. Supported alternate 24-hour headings remain accepted. The nine fixed assets are BTC, ETH, SOL, BNB, XRP, HYPE, QNT, LINK, and ONDO; older six-asset reports remain readable.

Use `Aset | Support | Resistance | Sinyal | Pemicu & alasan | Invalidasi | Horizon` for technical labels. The dashboard reads the **Sinyal column only**, and never turns trigger text into a new signal. Missing labels stay missing.

Use a second-level heading (`##`) for report sections. The established titles `Rotasi dalam sektor`, `Rotasi BTC → ETH`, `Kurs USD/IDR`, `Skenario geopolitik`, and `Minyak — 1 bulan` enable the specialized views. Sector rotation opening paragraphs remain fully available in Stories and the radar.

Oil plots accept only the consistent two-column table `Tanggal | Brent (USD/barel)` (or explicitly WTI), ISO dates and dot-decimal values. Missing days are never inserted. Chart points keep their actual observation dates and source series; futures settlements are not appended to spot charts.

Crypto charts are **archive snapshot charts**, not OHLC candles or tick histories. Snapshot time, provider and methodology can differ between editions. They must not be used to recompute candle confirmations or claimed rolling drawdowns. Display archived drawdowns only with their original definitions.

ETF headline cards require a recognizable `Sesi AS` table with a status column, an explicit complete session, and a supported USD-million unit. Unrecognized formats remain readable in the full report; they never become a guessed zero or total. Daily research in Markdown remains the source of truth.

## BTC Risk Desk integration

Market Notes serves an anonymous read-only `/api/btc` from `dashboard/worker.mjs`. The Worker has only the static ASSETS binding, no access token and no private Site/database binding. POST and all other `/api/` paths are rejected. `btc-risk-desk/report.json` is a market-only projection of the current persisted analyst report; the build publishes it as `/btc-report.json`. Unknown fields are projected out again by the API. No journal, balance, order, sizing, capital or private credentials are published.

The existing private Risk Desk stays owner-only. `/api/signal-export` on that private Site exports only the approved market fields. Existing analyst/monitor automations mirror that export using the GitHub connection, with a latest-SHA update and no commit when unchanged. They keep original timestamps and never copy private operational endpoints. Updates on main trigger the existing deployment build. See `btc-risk-desk/PUBLISHING.md`.

The public Worker fetches the public Hyperliquid info API and evaluates the same mechanical tracker as the private Desk, using closed candles only. `market.mjs` and `tracker.mjs` are generated from the original typed market/tracker source; update both if those rules change. The panel requests data on open and every 60 seconds while visible. Report validity, feed/tracker freshness and event windows gate status; a mechanical confirmation never changes an analyst signal or a spot label. Private daily risk limits and positions are not used to grant public entry permission. The private hub continues to work unchanged.

## Portfolio view (private)

`dashboard/portfolio.js` renders the Portfolio view. The published bundle contains no balances,
holdings, or returns: the panel asks for a PIN and calls the Supabase RPC `portfolio_load(p_pin)`
at runtime. The backing tables (`portfolio_settings`, `portfolio_snapshots`, `portfolio_holdings`)
have RLS enabled with no policies and all privileges revoked from `anon`, so the publishable key
alone reads nothing — verified by a direct REST read returning `permission denied for table`.
The PIN is kept in `sessionStorage` only and clears when the tab closes.

Rotate the PIN with `portfolio_change_pin(p_pin, p_new_pin)`. Change the default before sharing
the site. Do not move portfolio numbers into `crypto-recaps/` or any file under `dist/`.
