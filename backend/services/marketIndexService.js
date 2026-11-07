
const indices = [
  {
    name: "NIFTY 50",
    symbol: "^NSEI",
    exchange: "NSE"
  },
  {
    name: "SENSEX",
    symbol: "^BSESN",
    exchange: "BSE"
  }
];

const getIndexData = async (index) => {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(index.symbol)}`
  );

  url.searchParams.set("range", "5d");
  url.searchParams.set("interval", "1d");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch ${index.name}: ${response.status}`);
  }

  const result = await response.json();
  const chart = result.chart?.result?.[0];

  if (!chart) {
    throw new Error(`No data available for ${index.name}`);
  }

  const meta = chart.meta;
  const prices = chart.indicators?.quote?.[0]?.close || [];
  const validPrices = prices.filter(
    price => price !== null && Number.isFinite(price)
  );

  const currentPrice = meta.regularMarketPrice ?? validPrices.at(-1);
  const previousClose = meta.chartPreviousClose ?? meta.previousClose;

  if (
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(previousClose) ||
    previousClose === 0
  ) {
    throw new Error(`Invalid price data for ${index.name}`);
  }

  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    name: index.name,
    symbol: index.symbol,
    exchange: index.exchange,
    value: currentPrice,
    previousClose,
    change,
    changePercent,
    currency: meta.currency || "INR",
    marketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null
  };
};

export const getMarketIndices = async () => {
  const results = await Promise.allSettled(
    indices.map(index => getIndexData(index))
  );

  return results.map((result, index) => ({
    name: indices[index].name,
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected"
      ? result.reason.message
      : null
  }));
};
