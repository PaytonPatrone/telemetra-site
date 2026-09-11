// TeleMetra — live-data Worker for the /payton page
// Returns: { "market": {ins_1y, ins_5y, as_of}, "counters": {relationships, states, programs, verticals} }
//   market   : Yahoo Finance (KIE insurance ETF), no key.
//   counters : Airtable "Public View" table ONLY (tblBM23wxFZ1Acs2j) — the public-safe table.
//              Requires a READ-ONLY Airtable token in the secret AIRTABLE_TOKEN. Never exposed to the browser.
// Everything falls back silently, so the page never breaks.

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=900",
      "content-type": "application/json; charset=utf-8"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const out = {};

    // ---- Market: US insurance sector (KIE) via Yahoo Finance ----
    try {
      const H = { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }, cf: { cacheTtl: 900, cacheEverything: true } };
      const chart = async host => {
        const r = await fetch("https://" + host + "/v8/finance/chart/KIE?range=5y&interval=1mo", H);
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      };
      let j;
      try { j = await chart("query1.finance.yahoo.com"); } catch (e) { j = await chart("query2.finance.yahoo.com"); }
      const res = j.chart.result[0];
      let closes = (res.indicators.adjclose && res.indicators.adjclose[0] && res.indicators.adjclose[0].adjclose) || res.indicators.quote[0].close;
      closes = closes.filter(x => x != null);
      const last = res.meta.regularMarketPrice || closes[closes.length - 1];
      const pct = b => (b ? Math.round((last / b - 1) * 100) : null);
      const sign = n => (n == null ? null : (n >= 0 ? "+" : "") + n + "%");
      out.market = {
        ins_1y: sign(pct(closes[Math.max(0, closes.length - 13)])),
        ins_5y: sign(pct(closes[0])),
        as_of: new Date((res.meta.regularMarketTime || 0) * 1000).toISOString().slice(0, 10)
      };
    } catch (e) { out.market_error = String(e); }

    // ---- Counters: Airtable "Public View" table only ----
    if (env && env.AIRTABLE_TOKEN) {
      try {
        const url = "https://api.airtable.com/v0/appVt6oC7pFm1zdas/tblBM23wxFZ1Acs2j?pageSize=50";
        const r = await fetch(url, { headers: { Authorization: "Bearer " + env.AIRTABLE_TOKEN } });
        if (r.ok) {
          const data = await r.json();
          const c = {};
          for (const rec of data.records) {
            const f = rec.fields || {};
            const type = (f.Type && f.Type.name) || f.Type;         // REST returns a string; be defensive
            const pub = f["Show publicly"] === true;
            if (type !== "Counter" || !pub || f.Value == null) continue;
            const item = String(f.Item || "").toLowerCase();
            const val = String(f.Value);
            if (item.includes("relationship")) c.relationships = val;
            else if (item.includes("state")) c.states = val;
            else if (item.includes("program")) c.programs = val;
            else if (item.includes("vertical")) c.verticals = val;
          }
          out.counters = c;
        } else { out.counters_error = "http " + r.status; }
      } catch (e) { out.counters_error = String(e); }
    }

    return new Response(JSON.stringify(out), { headers: cors });
  }
};
