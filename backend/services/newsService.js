
export const getStockNews = async (symbol = "RELIANCE") => {
  const apiKey = process.env.DRISHTI_API_KEY;

  if (!apiKey) {
    throw new Error("Drishti API key is missing");
  }

  const url = new URL("https://developers.manasija.in/v1/news");

  url.searchParams.set("symbols", symbol.toUpperCase());
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey
    }
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Drishti API error:", response.status, result);
    throw new Error(`Drishti API request failed: ${response.status}`);
  }

  return result;
};
