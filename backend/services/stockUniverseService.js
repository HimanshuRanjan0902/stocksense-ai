
const BASE_URL = "https://api.tejhq.dev";

const getIndiaDate = (daysAgo = 0) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const date = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) - daysAgo
  ));

  return date.toISOString().slice(0, 10);
};

export const getStockSymbols = async (exchange = "nse") => {
  const normalizedExchange = exchange.toLowerCase();

  if (!["nse", "bse"].includes(normalizedExchange)) {
    throw new Error("Invalid exchange. Use NSE or BSE.");
  }

  let lastError = "No trading data found";

  for (let daysAgo = 0; daysAgo <= 10; daysAgo++) {
    const date = getIndiaDate(daysAgo);

    const url = new URL(
      `${BASE_URL}/v1/snapshot/${normalizedExchange}`
    );

    url.searchParams.set("date", date);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    const responseText = await response.text();

    let result;

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("TejHQ returned invalid JSON");
    }

    if (response.ok && Array.isArray(result.data)) {
      if (result.data.length > 0) {
        return {
          exchange: normalizedExchange.toUpperCase(),
          date,
          total: result.data.length,
          stocks: result.data.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name || stock.symbol,
            isin: stock.isin || "",
            series: stock.series || "",
            exchange: normalizedExchange.toUpperCase()
          }))
        };
      }

      lastError = `No trading data for ${date}`;
      continue;
    }

    if (response.status === 400 || response.status === 404) {
      lastError = `No snapshot available for ${date}`;
      continue;
    }

    throw new Error(
      `TejHQ request failed: ${response.status} - ${JSON.stringify(result)}`
    );
  }

  throw new Error(lastError);
};
