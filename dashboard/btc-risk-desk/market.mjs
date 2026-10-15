const URL = "https://api.hyperliquid.xyz/info";
async function hl(body) { const r = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) }); if (!r.ok)
    throw new Error("Hyperliquid HTTP " + r.status); return await r.json(); }
function ema(v, p) { const k = 2 / (p + 1); return v.reduce((a, x) => { a.push(a.length ? k * x + (1 - k) * a[a.length - 1] : x); return a; }, []); }
function rma(v, p) { let x = v.slice(0, p).reduce((a, b) => a + b, 0) / p; for (const y of v.slice(p))
    x = (x * (p - 1) + y) / p; return x; }
export async function getMarket() {
    const now = Date.now(), frames = [["1d", 86400000], ["4h", 14400000], ["1h", 3600000], ["15m", 900000]];
    const [meta, book, ...candles] = await Promise.all([hl({ type: "metaAndAssetCtxs" }), hl({ type: "l2Book", coin: "BTC" }), ...frames.map(([interval, ms]) => hl({ type: "candleSnapshot", req: { coin: "BTC", interval, startTime: now - ms * 1002, endTime: now } }))]);
    const ix = meta[0].universe.findIndex((x) => x.name === "BTC");
    if (ix < 0)
        throw new Error("BTC not found");
    const c = meta[1][ix];
    const technicals = candles.map((raw, i) => {
        const rows = raw.filter(x => x.T < now).sort((a, b) => a.t - b.t), v = rows.map(x => +x.c), vol = rows.map(x => +x.v);
        if (v.length < 250)
            throw new Error("Candle history incomplete");
        if (rows.slice(-250).some((x, j, a) => ![+x.o, +x.h, +x.l, +x.c, +x.v, x.t, x.T].every(Number.isFinite) || +x.l <= 0 || +x.v < 0 || +x.l > Math.min(+x.o, +x.c) || +x.h < Math.max(+x.o, +x.c) || (j > 0 && x.t - a[j - 1].t !== frames[i][1])))
            throw new Error("Invalid or missing candle data");
        const delta = v.slice(1).map((x, j) => x - v[j]), gain = rma(delta.map(x => Math.max(x, 0)), 14), loss = rma(delta.map(x => Math.max(-x, 0)), 14);
        const f = ema(v, 12), s = ema(v, 26), m = f.map((x, j) => x - s[j]), sig = ema(m, 9);
        return { tf: frames[i][0], close: v.at(-1), ema21: ema(v, 21).at(-1), ema50: ema(v, 50).at(-1), ema200: ema(v, 200).at(-1), rsi: loss ? 100 - 100 / (1 + gain / loss) : 100, macdHist: m.at(-1) - sig.at(-1), volumeRatio: vol.at(-1) / (vol.slice(-21, -1).reduce((a, b) => a + b, 0) / 20), closedAt: new Date(rows.at(-1).T + 1).toISOString(), candles: rows.slice(-168).map(x => ({ time: x.t, open: +x.o, high: +x.h, low: +x.l, close: +x.c, volume: +x.v })) };
    });
    const hour = candles[2].filter(x => x.T < now).sort((a, b) => a.t - b.t);
    const values = [+c.markPx, +c.openInterest, +c.funding, +c.prevDayPx, +c.dayNtlVlm];
    if (!values.every(Number.isFinite) || values[0] <= 0 || Math.abs(Date.now() - book.time) > 180000)
        throw new Error("Stale or invalid market snapshot");
    return { fetchedAt: new Date().toISOString(), exchangeAt: new Date(book.time).toISOString(), mark: +c.markPx, oracle: +c.oraclePx, bid: +book.levels[0][0].px, ask: +book.levels[1][0].px, change24h: (+c.markPx / +c.prevDayPx - 1) * 100, change7d: (+hour.at(-1).c / +hour.at(-169).c - 1) * 100, volume: +c.dayNtlVlm, oiBTC: +c.openInterest, oi: +c.openInterest * +c.markPx, fundingHourlyPct: +c.funding * 100, technicals };
}
