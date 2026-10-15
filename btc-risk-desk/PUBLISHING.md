# Public BTC signal publishing contract

The user authorized anonymous reading of BTC market signals, while journal, capital, balances, positions, settings and all writes remain private.

1. Using the existing private Site's supported service access, GET `/api/signal-export`. That route only reads the analyst reports table and returns `{schema:1, report:{asOf,validUntil,signal,headline,reason,levels,events,invalidations,sources,plan}}`. The plan contains only direction/status, market entry zone/stop and explicit tracker rules; no position sizing. Do not publish `/api/report`, `/api/desk`, journal, alerts, settings, paper trades or credentials wholesale.
2. Inspect this market projection for personal/account information in free text. Omit or redact such text, preserving actual market facts and original timestamps. Never fabricate a current timestamp or turn a conditional plan into an active signal.
3. With GitHub, read `stevenchristiian/Chatgptdailymarket`, branch `main`, file `btc-risk-desk/report.json` and latest SHA. If the public projection is unchanged, make no commit. Otherwise replace only that file as UTF-8 valid JSON. Create it if missing. Use the current SHA/lease; on conflict re-read and never overwrite a newer report with an older asOf. No secrets are needed in this repository.
4. Verify commit/readback and the deployment check. Keep existing updater/monitor schedules. This routine only updates data, never source, access policy or schedules. On failure keep the previous snapshot with its original timestamp and report the publication failure. Do not expose raw service credentials.

The public Worker reads this deployed static copy. Hyperliquid market data and mechanical checks are refreshed separately on page requests. A missing, stale or expired report/feed never becomes a fresh entry confirmation. Public signal analysis is not private risk management or order execution.
