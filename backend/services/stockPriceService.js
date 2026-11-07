
const ranges = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" }
};

export const getStockPriceHistory = async (symbol, period = "1M") => {
  const stock = String(symbol).trim().toUpperCase();
  const selectedRange = ranges[period];

  if (!/^[A-Z0-9&.-]{1,30}$/.test(stock)) {
    throw new Error("Invalid stock symbol");
  }

  if (!selectedRange) {
    throw new Error("Invalid chart period");
  }

  const ticker = stock.endsWith(".NS") || stock.endsWith(".BO")
    ? stock
    : `${stock}.NS`;

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`
  );

  url.searchParams.set("range", selectedRange.range);
  url.searchParams.set("interval", selectedRange.interval);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  const result = await response.json();
  const chart = result.chart?.result?.[0];

  if (!chart) {
    throw new Error("No stock price data available");
  }

  const timestamps = chart.timestamp || [];
  const quote = chart.indicators?.quote?.[0] || {};

  const data = timestamps.map((timestamp, index) => {
    const close = quote.close?.[index];

    return {
      date: new Date(timestamp * 1000).toISOString(),
      open: quote.open?.[index] ?? null,
      high: quote.high?.[index] ?? null,
      low: quote.low?.[index] ?? null,
      close: close ?? null,
      price: close ?? null,
      volume: quote.volume?.[index] ?? 0
    };
  }).filter(item =>
    Number.isFinite(item.open) &&
    Number.isFinite(item.high) &&
    Number.isFinite(item.low) &&
    Number.isFinite(item.close)
  );

  if (data.length === 0) {
    throw new Error("No valid stock price data available");
  }

  return {
    symbol: stock,
    exchange: ticker.endsWith(".BO") ? "BSE" : "NSE",
    period,
    currency: "INR",
    data
  };
};
