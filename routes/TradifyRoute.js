const express = require('express');
const YahooFinance = require('yahoo-finance2').default;
const router = express.Router();


const yahooFinance = new YahooFinance();

// 1. Bulk Quotes: /tradify/market/quotes/list?symbols=AAPL,TSLA
router.get('/market/quotes/list', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: "No symbols provided" });

    const symbolsArray = symbols.split(',');
    const results = await yahooFinance.quote(symbolsArray);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Single Symbol/Chart: /tradify/market/:symbol
router.get('/market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval, range } = req.query;

    if (interval && range) {
      const endDate = new Date();
      let startDate = new Date();

      switch (range) {
        case '1d': startDate.setDate(endDate.getDate() - 1); break;
        case '5d': startDate.setDate(endDate.getDate() - 5); break;
        case '1mo': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3mo': startDate.setMonth(endDate.getMonth() - 3); break;
        case '6mo': startDate.setMonth(endDate.getMonth() - 6); break;
        case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        default: startDate.setMonth(endDate.getMonth() - 1);
      }

      const result = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: interval,
      });
      
      return res.json(result);
    } else {
      const result = await yahooFinance.quote(symbol);
      return res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




const FRANKFURTER = "https://api.frankfurter.app";
const TIMEOUT_MS = 8000;
 
/** Fetch with a hard timeout. Throws on network error or timeout. */
async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
 
router.get("/forex", async (req, res) => {
  const { bases, chartFrom, startDate, endDate } = req.query;
 
  // ── Validate ────────────────────────────────────────────────────────────
  if (!bases || !chartFrom || !startDate || !endDate) {
    return res.status(400).json({
      error: "Missing required query params: bases, chartFrom, startDate, endDate",
    });
  }
 
  const baseList = bases.split(",").map((b) => b.trim()).filter(Boolean);
  if (!baseList.length) {
    return res.status(400).json({ error: "bases must contain at least one currency code" });
  }
 
  // Basic ISO date sanity check (YYYY-MM-DD)
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!ISO_RE.test(startDate) || !ISO_RE.test(endDate)) {
    return res.status(400).json({ error: "startDate and endDate must be YYYY-MM-DD" });
  }
 
  // ── Fire all upstream requests in parallel ──────────────────────────────
  const latestUrls = baseList.map(
    (base) => `${FRANKFURTER}/latest?from=${encodeURIComponent(base)}`
  );
  const seriesUrl = `${FRANKFURTER}/${startDate}..${endDate}?from=${encodeURIComponent(chartFrom)}`;
 
  try {
    const [latestResponses, seriesResponse] = await Promise.all([
      Promise.all(latestUrls.map((url) => fetchWithTimeout(url).catch(() => null))),
      fetchWithTimeout(seriesUrl).catch(() => null),
    ]);
 
    // ── Parse latest ──────────────────────────────────────────────────────
    const latest = {};
    for (let i = 0; i < baseList.length; i++) {
      const r = latestResponses[i];
      if (r && r.ok) {
        try {
          latest[baseList[i]] = await r.json();
        } catch (_) {
          // skip malformed
        }
      }
    }
 
    // ── Parse series ──────────────────────────────────────────────────────
    let series = null;
    if (seriesResponse && seriesResponse.ok) {
      try {
        series = await seriesResponse.json();
      } catch (_) {
        series = null;
      }
    }
 
    if (!Object.keys(latest).length && !series) {
      return res.status(502).json({ error: "All upstream Frankfurter requests failed" });
    }
 
    return res.json({ latest, series });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Upstream Frankfurter request timed out" });
    }
    console.error("[forex route]", err);
    return res.status(502).json({ error: "Upstream request failed", detail: err.message });
  }
});



module.exports = router;