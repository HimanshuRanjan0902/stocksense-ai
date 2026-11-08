
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(currentDirectory, "../data");

const files = {
  NSE: path.join(dataDirectory, "nse-bhavcopy.csv"),
  BSE: path.join(dataDirectory, "bse-bhavcopy.csv")
};

const nseEquitySeries = new Set(["EQ", "BE", "BZ", "SM"]);

const bseEquitySeries = new Set([
  "A",
  "B",
  "X",
  "XT",
  "T",
  "Z",
  "M",
  "MT",
  "P",
  "MS"
]);

const debtPattern =
  /\b(NCD|DEBENTURE|BOND|STRPP|NON CONVERTIBLE|NON-CONVERTIBLE|COMMERCIAL PAPER|SEC RED|SEC REDEEMABLE|TAX FREE BOND|ZERO COUPON)\b/i;

const readBhavcopy = async (exchange) => {
  const content = await fs.readFile(files[exchange], "utf8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
};

const getNumber = (value) => {
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .trim();

  if (!normalized) return NaN;

  return Number(normalized);
};

const normalizeRecord = (row, exchange) => {
  const symbol = String(row.TckrSymb || "")
    .trim()
    .toUpperCase();

  const isin = String(row.ISIN || "")
    .trim()
    .toUpperCase();

  const name = String(row.FinInstrmNm || "").trim();

  const series = String(row.SctySrs || "")
    .trim()
    .toUpperCase();

  const instrumentType = String(row.FinInstrmTp || "")
    .trim()
    .toUpperCase();

  const close = getNumber(row.ClsPric);
  const previousClose = getNumber(row.PrvsClsgPric);
  const volume = getNumber(row.TtlTradgVol);

  if (
    instrumentType !== "STK" ||
    !symbol ||
    !name ||
    !/^INE[A-Z0-9]{9}$/.test(isin) ||
    !Number.isFinite(close) ||
    !Number.isFinite(previousClose) ||
    close <= 0 ||
    previousClose <= 0
  ) {
    return null;
  }

  if (debtPattern.test(`${symbol} ${name}`)) {
    return null;
  }

  if (exchange === "NSE" && !nseEquitySeries.has(series)) {
    return null;
  }

  if (exchange === "BSE" && !bseEquitySeries.has(series)) {
    return null;
  }

  if (/^\d{6,}$/.test(symbol)) {
    return null;
  }

  const change = close - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    symbol,
    name,
    isin,
    exchange,
    series,
    price: close,
    previousClose,
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume: Number.isFinite(volume) ? volume : 0,
    date: row.TradDt || null
  };
};

export const getHeatmapData = async () => {
  const [nseRows, bseRows] = await Promise.all([
    readBhavcopy("NSE"),
    readBhavcopy("BSE")
  ]);

  const normalizedRecords = [
    ...nseRows.map((row) => normalizeRecord(row, "NSE")),
    ...bseRows.map((row) => normalizeRecord(row, "BSE"))
  ].filter(Boolean);

  const groupedStocks = new Map();

  for (const stock of normalizedRecords) {
    const existing = groupedStocks.get(stock.isin);

    if (!existing) {
      groupedStocks.set(stock.isin, {
        ...stock,
        exchanges: [stock.exchange],
        listings: [
          {
            symbol: stock.symbol,
            exchange: stock.exchange,
            series: stock.series
          }
        ]
      });

      continue;
    }

    if (!existing.exchanges.includes(stock.exchange)) {
      existing.exchanges.push(stock.exchange);
    }

    existing.listings.push({
      symbol: stock.symbol,
      exchange: stock.exchange,
      series: stock.series
    });

    if (stock.exchange === "NSE" && existing.exchange !== "NSE") {
      Object.assign(existing, {
        ...stock,
        exchanges: existing.exchanges,
        listings: existing.listings
      });
    }
  }

  const stocks = Array.from(groupedStocks.values()).sort(
    (a, b) =>
      Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );

  const date = stocks.find((stock) => stock.date)?.date || null;

  const positive = stocks.filter(
    (stock) => stock.changePercent > 0
  ).length;

  const negative = stocks.filter(
    (stock) => stock.changePercent < 0
  ).length;

  const unchanged = stocks.filter(
    (stock) => stock.changePercent === 0
  ).length;

  return {
    date,
    total: stocks.length,
    positive,
    negative,
    unchanged,
    source: "NSE and BSE official EOD Bhavcopy",
    dataType: "End of Day",
    stocks
  };
};
