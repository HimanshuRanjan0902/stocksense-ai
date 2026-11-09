
import { getAngelOneQuote } from "./angelOneService.js";

const indices = [
  {
    name: "NIFTY 50",
    symbol: "^NSEI",
    exchange: "NSE",
    token: "99926000"
  },
  {
    name: "SENSEX",
    symbol: "^BSESN",
    exchange: "BSE",
    token: "99919000"
  }
];

const getAngelOneIndexData = async (index) => {
 const response = await getAngelOneQuote(
  index.exchange,
  index.token,
  "OHLC"
);

  const quote = response?.fetched?.[0];

  if (!quote || !Number.isFinite(Number(quote.ltp))) {
    throw new Error(`Angel One quote unavailable for ${index.name}`);
  }

  const currentPrice = Number(quote.ltp);
  const previousClose = Number(quote.close);

  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    throw new Error(`Previous close unavailable for ${index.name}`);
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
    currency: "INR",
    marketTime: null,
    source: "Angel One SmartAPI",
    isLive: false,
    streaming: false
  };
};

const getYahooIndexData = async (index) => {
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
    throw new Error(`Yahoo Finance failed: ${response.status}`);
  }

  const result = await response.json();
  const chart = result.chart?.result?.[0];

  if (!chart) {
    throw new Error(`No Yahoo data available for ${index.name}`);
  }

  const meta = chart.meta;
  const prices = chart.indicators?.quote?.[0]?.close || [];

  const validPrices = prices.filter(
    (price) => price !== null && Number.isFinite(price)
  );

  const currentPrice = Number(
    meta.regularMarketPrice ?? validPrices.at(-1)
  );

  const previousClose = Number(
    meta.chartPreviousClose ?? meta.previousClose
  );

  if (
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(previousClose) ||
    previousClose <= 0
  ) {
    throw new Error(`Invalid Yahoo price data for ${index.name}`);
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
      : null,
    source: "Yahoo Finance (fallback)",
    isLive: false,
    streaming: false
  };
};

const getIndexData = async (index) => {
  try {
    return await getAngelOneIndexData(index);
  } catch (angelError) {
    console.error(
      `Angel One failed for ${index.name}:`,
      angelError.message
    );

    try {
      return await getYahooIndexData(index);
    } catch (yahooError) {
      throw new Error(
        `${index.name}: Angel One: ${angelError.message}; Yahoo: ${yahooError.message}`
      );
    }
  }
};

export const getMarketIndices = async () => {
  const results = await Promise.allSettled(
    indices.map((index) => getIndexData(index))
  );

  return results.map((result, index) => ({
    name: indices[index].name,
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value : null,
    source:
      result.status === "fulfilled"
        ? result.value.source
        : null,
    error:
      result.status === "rejected"
        ? result.reason.message
        : null
  }));
};
