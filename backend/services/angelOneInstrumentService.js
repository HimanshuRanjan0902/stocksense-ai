
const INSTRUMENT_MASTER_URL =
  "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

let instruments = null;
let lastFetchedAt = 0;
let fetchPromise = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000;

const loadInstrumentMaster = async () => {
  if (
    instruments &&
    Date.now() - lastFetchedAt < CACHE_DURATION
  ) {
    return instruments;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    const response = await fetch(INSTRUMENT_MASTER_URL, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(
        `Instrument master request failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid Angel One instrument master");
    }

    instruments = data;
    lastFetchedAt = Date.now();

    return instruments;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
};

export const getAngelOneStockToken = async (
  symbol,
  exchange = "NSE"
) => {
  const cleanSymbol = String(symbol || "")
    .trim()
    .toUpperCase()
    .replace(/\.(NS|BO)$/, "");

  const selectedExchange = String(exchange || "")
    .trim()
    .toUpperCase();

  if (!["NSE", "BSE"].includes(selectedExchange)) {
    throw new Error("Unsupported exchange");
  }

  if (!/^[A-Z0-9&.-]{1,30}$/.test(cleanSymbol)) {
    throw new Error("Invalid stock symbol");
  }

  const master = await loadInstrumentMaster();

  const tradingSymbol = `${cleanSymbol}-EQ`;

  const instrument = master.find(
    (item) =>
      String(item.exch_seg || "").toUpperCase() === selectedExchange &&
      String(item.symbol || "").toUpperCase() === tradingSymbol
  );

  if (!instrument?.token) {
    throw new Error(
      `${cleanSymbol} equity token not found on ${selectedExchange}`
    );
  }

  return {
    symbol: cleanSymbol,
    exchange: selectedExchange,
    tradingSymbol: instrument.symbol,
    token: String(instrument.token)
  };
};
