const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const router = express.Router();

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

module.exports = router;