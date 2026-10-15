export function eventWindow(report, now) { return report.events.find(e => e.impact === "high" && Math.abs(Date.parse(e.at) - now) <= 1800000) ?? null; }
export function evaluateTracker(report, market, now = Date.now()) {
    const result = { status: "waiting", label: "Menunggu breakout", detail: "Belum ada candle 1H yang memenuhi syarat breakout setelah analisis ini dibuat.", checkedAt: new Date(now).toISOString(), reportAsOf: report.asOf, confirmedAt: null, checks: [] };
    const p = report.plan, cfg = p?.tracker;
    if (now > Date.parse(report.validUntil))
        return { ...result, status: "expired", label: "Kedaluwarsa", detail: "Masa berlaku analisis habis. Tunggu level dan syarat terbaru." };
    if (!market || Math.abs(now - Date.parse(market.exchangeAt)) > 180000)
        return { ...result, status: "unverified", label: "Data belum terverifikasi", detail: "Feed pasar belum segar; konfirmasi otomatis ditahan." };
    if (!p || !cfg)
        return { ...result, status: "unconfigured", label: "Perlu aturan terukur", detail: "Rencana ini belum memiliki aturan tracker terstruktur. Tidak menebak syarat dari teks analisis." };
    const h = market.technicals.find(x => x.tf === "1h")?.candles ?? [], q = market.technicals.find(x => x.tf === "15m")?.candles ?? [], long = p.direction === "LONG";
    const after = h.filter(c => c.time + 3600000 > Date.parse(report.asOf));
    const breakBar = after.find(c => long ? c.close > cfg.breakout : c.close < cfg.breakout);
    const breakoutAt = breakBar ? breakBar.time + 3600000 : null;
    const checks = [{ label: "Candle 1H menembus breakout", passed: !!breakBar, detail: `Close ${long ? ">" : "<"} $${cfg.breakout.toLocaleString("en-US")}` }, { label: "Retest zona entry bertahan", passed: false, detail: "Candle 15m sesudah breakout menyentuh zona dan tutup di sisi yang sesuai." }, { label: long ? "Higher low 15m terkonfirmasi" : "Lower high 15m terkonfirmasi", passed: !cfg.requireHigherLow, detail: "Pivot dua candle di kiri dan kanan dibanding pivot sebelumnya." }, { label: "Volume candle konfirmasi", passed: false, detail: `Minimal ${cfg.volumeMultiplier}x rata-rata 20 candle 15m sebelumnya.` }];
    result.checks = checks;
    if (!breakBar)
        return result;
    if (after.some(c => c.time + 3600000 > breakoutAt && (long ? c.close < cfg.invalidation : c.close > cfg.invalidation)) || (long ? market.mark <= p.stop : market.mark >= p.stop))
        return { ...result, status: "invalidated", label: "Setup batal", detail: "Sesudah breakout, harga menembus stop atau close 1H melewati batas invalidasi." };
    result.status = "breakout";
    result.label = "Breakout tercatat";
    result.detail = "Menunggu retest, pivot, dan volume konfirmasi.";
    const pivots = [];
    for (let i = 2; i < q.length - 2; i++) {
        const zone = q.slice(i - 2, i + 3), v = long ? q[i].low : q[i].high;
        const extreme = long ? v === Math.min(...zone.map(x => x.low)) : v === Math.max(...zone.map(x => x.high));
        const strict = zone.slice(0, 2).some(x => long ? x.low > v : x.high < v) && zone.slice(3).some(x => long ? x.low > v : x.high < v);
        if (extreme && strict)
            pivots.push(i);
    }
    let bestScore = 1;
    for (let i = 2; i < q.length - 2; i++) {
        const c = q[i], j = i + 2, confirm = q[j];
        if (c.time < breakoutAt || c.low > p.entryHigh || c.high < p.entryLow || (long ? c.close < p.entryLow : c.close > p.entryHigh))
            continue;
        result.status = "retest";
        result.label = "Retest tercatat";
        const prior = pivots.filter(k => k < i).at(-1);
        const hl = !cfg.requireHigherLow || (pivots.includes(i) && prior !== undefined && (long ? c.low > q[prior].low : c.high < q[prior].high));
        const avg = q.slice(Math.max(0, j - 20), j).reduce((a, b) => a + b.volume, 0) / 20;
        const volume = j >= 20 && avg > 0 && confirm.volume >= avg * cfg.volumeMultiplier;
        const bullishClose = long ? confirm.close >= p.entryLow && confirm.close > confirm.open : confirm.close <= p.entryHigh && confirm.close < confirm.open;
        const candidate = checks.map((x, k) => ({ ...x, passed: k === 0 || k === 1 ? true : k === 2 ? hl : volume && bullishClose }));
        const score = candidate.filter(x => x.passed).length;
        if (score > bestScore) {
            bestScore = score;
            result.checks = candidate;
        }
        if (hl && volume && bullishClose)
            return { ...result, checks: candidate, status: "confirmed", label: "Syarat mekanis terpenuhi", detail: "Breakout, retest, pivot, dan volume terpenuhi pada rangkaian candle yang sama. Ini belum mengubah keputusan analis.", confirmedAt: new Date(confirm.time + 900000).toISOString() };
    }
    return result;
}
