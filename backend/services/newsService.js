export const getStockNews = async (symbol = "RELIANCE") => {
  const apiKey = process.env.DRISHTI_API_KEY;

  if (!apiKey) {
    throw new Error("Drishti API key is missing");
  }

  const stockSymbol = String(symbol).trim().toUpperCase();

  const url = new URL("https://developers.manasija.in/v1/news");

  url.searchParams.set("symbols", stockSymbol);
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey
    }
  });

  const responseText = await response.text();

  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error("Drishti returned an invalid JSON response");
  }

  if (!response.ok) {
    console.error("Drishti API error:", response.status, result);
    throw new Error(`Drishti API request failed: ${response.status}`);
  }

  const articles = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.articles)
      ? result.articles
      : [];

  console.log(`Drishti fetched ${articles.length} articles for ${stockSymbol}`);

  return {
    ...result,
    articles
  };
};
