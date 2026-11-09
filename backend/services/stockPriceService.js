
import { getAngelOneQuote } from "./angelOneService.js";
import { getAngelOneStockToken } from "./angelOneInstrumentService.js";

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
  const baseUrl =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;

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

const getValidatedStock = (symbol) => {
  const stock = String(symbol || "").trim().toUpperCase();

  if (!/^[A-Z0-9&.-]{1,30}$/.test(stock)) {
    throw new Error("Invalid stock symbol");
  }

  return stock;
};

const getTicker = (stock, exchange) => {
  if (stock.endsWith(".NS") || stock.endsWith(".BO")) {
    return stock;
  }

  return `${stock}.${exchange === "BSE" ? "BO" : "NS"}`;
};

const getHistoricalData = async (stock, selectedRange) => {
  const isBSE = stock.endsWith(".BO");
  const isNSE = stock.endsWith(".NS");

  const ticker = getTicker(
    stock,
    isBSE ? "BSE" : "NSE"
  );

  let { chart, data } = await getYahooChart(ticker, selectedRange);

  let dataSourceTicker = ticker;
  let dataSourceExchange = isBSE ? "BSE" : "NSE";
  let isFallback = false;

  if (isBSE && data.length <= 1) {
    const cleanSymbol = stock.replace(/\.BO$/, "");
    const nseTicker = `${cleanSymbol}.NS`;

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

  return {
    chart,
    data,
    ticker,
    exchange: isBSE ? "BSE" : isNSE ? "NSE" : "NSE",
    dataSourceTicker,
    dataSourceExchange,
    isFallback
  };
};

export const getStockPriceHistory = async (
  symbol,
  period = "1M"
) => {
  const stock = getValidatedStock(symbol);
  const selectedRange = ranges[period];

  if (!selectedRange) {
    throw new Error("Invalid chart period");
  }

  const result = await getHistoricalData(stock, selectedRange);

  console.log(
    `Yahoo Finance: ${result.ticker} | ${period} | ${result.data.length} records | Source: ${result.dataSourceTicker}`
  );

  return {
    symbol: stock.replace(/\.(BO|NS)$/, ""),
    ticker: result.ticker,
    exchange: result.exchange,
    period,
    currency: "INR",
    totalRecords: result.data.length,
    dataSourceTicker: result.dataSourceTicker,
    dataSourceExchange: result.dataSourceExchange,
    isFallback: result.isFallback,
    historicalDataAvailable:
      result.data.length > 1 || period === "1D",
    data: result.data
  };
};

export const getStock52WeekStats = async (symbol) => {
  const stock = getValidatedStock(symbol);

  const selectedRange = {
    range: "1y",
    interval: "1d"
  };

  const result = await getHistoricalData(stock, selectedRange);
  const data = result.data;

  if (data.length === 0) {
    throw new Error("No 52-week historical data available");
  }

  const highest = Math.max(...data.map((item) => item.high));
  const lowest = Math.min(...data.map((item) => item.low));
  const currentPrice = data[data.length - 1].close;

  const distanceFromHigh =
    ((currentPrice - highest) / highest) * 100;

  const distanceFromLow =
    ((currentPrice - lowest) / lowest) * 100;

  return {
    symbol: stock.replace(/\.(BO|NS)$/, ""),
    ticker: result.ticker,
    currency: "INR",
    currentPrice: Number(currentPrice.toFixed(2)),
    high52Week: Number(highest.toFixed(2)),
    low52Week: Number(lowest.toFixed(2)),
    distanceFromHigh: Number(distanceFromHigh.toFixed(2)),
    distanceFromLow: Number(distanceFromLow.toFixed(2)),
    totalRecords: data.length,
    dataSourceTicker: result.dataSourceTicker,
    dataSourceExchange: result.dataSourceExchange,
    isFallback: result.isFallback,
    dataStartDate: data[0].date,
    dataEndDate: data[data.length - 1].date
  };
};

export const getLatestStockQuote = async (
  symbol,
  exchange = "NSE"
) => {
  const stock = getValidatedStock(symbol);
  const selectedExchange = String(exchange || "NSE")
    .trim()
    .toUpperCase();

  if (!["NSE", "BSE"].includes(selectedExchange)) {
    throw new Error("Invalid exchange");
  }

  if (
    (stock.endsWith(".NS") && selectedExchange !== "NSE") ||
    (stock.endsWith(".BO") && selectedExchange !== "BSE")
  ) {
    throw new Error("Stock symbol and exchange do not match");
  }

  const cleanSymbol = stock.replace(/\.(NS|BO)$/, "");
  const ticker = getTicker(stock, selectedExchange);

  try {
    const instrument = await getAngelOneStockToken(
      cleanSymbol,
      selectedExchange
    );

    const result = await getAngelOneQuote(
      instrument.exchange,
      instrument.token
    );

    const quote = result?.fetched?.find(
      (item) =>
        String(item.symbolToken) === String(instrument.token)
    );

    const price = Number(quote?.ltp);

    if (quote && Number.isFinite(price) && price > 0) {
      return {
        symbol: cleanSymbol,
        exchange: selectedExchange,
        ticker,
        price: Number(price.toFixed(2)),
        currency: "INR",
        timestamp: null,
        fetchedAt: new Date().toISOString(),
        marketState: "UNKNOWN",
        quoteAgeSeconds: null,
        isLive: false,
        isStale: false,
        freshness: "unknown",
        source: "Angel One SmartAPI",
        streaming: false
      };
    }

    throw new Error("Angel One returned no valid quote");
  } catch (error) {
    console.error(
      `Angel One quote failed for ${cleanSymbol} (${selectedExchange}):`,
      error.message
    );
  }

  try {
    const selectedRange = {
      range: "1d",
      interval: "1m"
    };

    const { chart, data } = await getYahooChart(
      ticker,
      selectedRange
    );

    if (!chart) {
      throw new Error("Stock quote is currently unavailable");
    }

    const meta = chart.meta || {};
    const marketPrice = Number(meta.regularMarketPrice);
    const lastCandle = data[data.length - 1];

    const price =
      Number.isFinite(marketPrice) && marketPrice > 0
        ? marketPrice
        : lastCandle?.close;

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("No valid stock price available");
    }

    const quoteTimestamp =
      Number(meta.regularMarketTime) ||
      lastCandle?.timestamp ||
      null;

    const marketState = meta.marketState || "UNKNOWN";

    const quoteAgeSeconds = quoteTimestamp
      ? Math.max(
          0,
          Math.floor(Date.now() / 1000 - quoteTimestamp)
        )
      : null;

    const isStale =
      marketState !== "REGULAR" ||
      quoteAgeSeconds === null ||
      quoteAgeSeconds > 900;

    return {
      symbol: cleanSymbol,
      exchange: selectedExchange,
      ticker,
      price: Number(price.toFixed(2)),
      currency: "INR",
      timestamp: quoteTimestamp
        ? new Date(quoteTimestamp * 1000).toISOString()
        : null,
      fetchedAt: new Date().toISOString(),
      marketState,
      quoteAgeSeconds,
      isLive: false,
      isStale,
      freshness: isStale ? "stale" : "delayed",
      source: "Yahoo Finance",
      streaming: false
    };
  } catch (error) {
    console.error(
      `Yahoo Finance fallback failed for ${cleanSymbol}:`,
      error.message
    );

    throw new Error(
      `Unable to fetch ${cleanSymbol} quote from Angel One or Yahoo Finance`
    );
  }
};
