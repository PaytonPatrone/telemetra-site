# How to turn on the live market stats (/payton)

The two stats with the green "live" dot on the Why-Insurance row (insurance sector 1-year
and 5-year return) can update on their own from real market data. Until this is switched on,
the page shows sensible seeded numbers, so it never looks broken.

## What's happening
- `worker-live-stats.js` is a tiny Cloudflare Worker. It reads the US insurance sector ETF (KIE)
  from a free public source (Stooq), computes the 1-year and 5-year return, and returns them as JSON.
- No API key. No login. Nothing sensitive is exposed. It just does the math and hands back two numbers.
- The /payton page fetches those numbers and drops them into the two live slots. If the fetch ever
  fails, the seeded numbers stay. It can't break the page.

## Steps (about 5 minutes)
1. In Cloudflare: **Workers & Pages → Create → Create Worker**. Name it `tm-live`.
2. Click **Edit code**, delete the sample, paste the entire contents of `worker-live-stats.js`, **Deploy**.
3. Copy the Worker's URL (looks like `https://tm-live.<your-subdomain>.workers.dev`).
4. Open it in a browser once. You should see JSON like:
   `{"market":{"ins_1y":"+14%","ins_5y":"+72%","as_of":"2026-08-28"}}`
5. **Send that URL to Payton's website session.** One line gets pasted into the /payton page
   (the `API` value), the page redeploys, and the two stats go live.

## Notes
- The numbers are cached ~30 minutes, so the page is fast and Stooq isn't hammered.
- To verify a number by hand, click the "S&P Insurance ETF" link under the stat, it opens KIE's quote.
- The other two stats (≈0 cat-bond correlation, 6+ years of E&S growth) are structural facts with
  source links, not live tickers, on purpose. They don't swing day to day.
