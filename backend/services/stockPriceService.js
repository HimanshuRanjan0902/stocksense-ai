
const ranges = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d", days: 35 },
  "3M": { range: "3mo", interval: "1d", days: 100 },
  "1Y": { range: "1y", interval: "1wk", days: 370 }
};

const fetchYahooData = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.chart?.error) {
    throw new Error(
      result.chart.error.description || "Yahoo Finance returned an error"
    );
  }

  return result.chart?.result?.[0] || null;
};

const parseChartData = (chart) => {
  if (!chart) return [];

  const timestamps = chart.timestamp || [];
  const quote = chart.indicators?.quote?.[0] || {};

  return timestamps
    .map((timestamp, index) => {
      const open = Number(quote.open?.[index]);
      const high = Number(quote.high?.[index]);
      const low = Number(quote.low?.[index]);
      const close = Number(quote.close?.[index]);
      const volume = Number(quote.volume?.[index] ?? 0);

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        open <= 0 ||
        high <= 0 ||
        low <= 0 ||
        close <= 0
      ) {
        return null;
      }

      return {
        date: new Date(timestamp * 1000).toISOString(),
        timestamp,
        open,
        high,
        low,
        close,
        price: close,
        volume: Number.isFinite(volume) ? volume : 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
};

const getYahooChart = async (ticker, selectedRange) => {
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;

  const url = new URL(baseUrl);

  url.searchParams.set("range", selectedRange.range);
  url.searchParams.set("interval", selectedRange.interval);
  url.searchParams.set("events", "history");

  let chart = await fetchYahooData(url);
  let data = parseChartData(chart);

  if (data.length <= 1 && selectedRange.days) {
    const fallbackUrl = new URL(baseUrl);
    const now = Math.floor(Date.now() / 1000);
    const period1 = now - selectedRange.days * 24 * 60 * 60;

    fallbackUrl.searchParams.set("period1", String(period1));
    fallbackUrl.searchParams.set("period2", String(now));
    fallbackUrl.searchParams.set("interval", selectedRange.interval);
    fallbackUrl.searchParams.set("events", "history");

    chart = await fetchYahooData(fallbackUrl);
    data = parseChartData(chart);
  }

  return { chart, data };
};

export const getStockPriceHistory = async (
  symbol,
  period = "1M"
) => {
  const stock = String(symbol || "").trim().toUpperCase();
  const selectedRange = ranges[period];

  if (!/^[A-Z0-9&.-]{1,30}$/.test(stock)) {
    throw new Error("Invalid stock symbol");
  }

  if (!selectedRange) {
    throw new Error("Invalid chart period");
  }

  const isBSE = stock.endsWith(".BO");
  const isNSE = stock.endsWith(".NS");

  const ticker = isBSE || isNSE ? stock : `${stock}.NS`;

  let { chart, data } = await getYahooChart(ticker, selectedRange);

  let dataSourceTicker = ticker;
  let dataSourceExchange = isBSE ? "BSE" : "NSE";
  let isFallback = false;

  if (isBSE && data.length <= 1) {
    const nseTicker = `${stock.replace(/\.BO$/, "")}.NS`;

    try {
      const nseResult = await getYahooChart(nseTicker, selectedRange);
      const nseSymbol = nseResult.chart?.meta?.symbol;
      const nseExchange = String(
        nseResult.chart?.meta?.exchangeName || ""
      ).toUpperCase();

      if (
        nseSymbol === nseTicker &&
        (nseExchange.includes("NSE") || nseExchange.includes("NSI")) &&
        nseResult.data.length > 1
      ) {
        chart = nseResult.chart;
        data = nseResult.data;
        dataSourceTicker = nseTicker;
        dataSourceExchange = "NSE";
        isFallback = true;
      }
    } catch (error) {
      console.error("NSE historical fallback failed:", error.message);
    }
  }

  console.log(
    `Yahoo Finance: ${ticker} | ${period} | ${data.length} records | Source: ${dataSourceTicker}`
  );

  return {
    symbol: stock.replace(/\.(BO|NS)$/, ""),
    ticker,
    exchange: isBSE ? "BSE" : "NSE",
    period,
    currency: "INR",
    totalRecords: data.length,
    dataSourceTicker,
    dataSourceExchange,
    isFallback,
    historicalDataAvailable: data.length > 1 || period === "1D",
    data
  };
};
