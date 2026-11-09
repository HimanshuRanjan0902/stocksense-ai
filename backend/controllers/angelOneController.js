
import { getAngelOneQuote } from "../services/angelOneService.js";

const STOCK_TOKENS = {
  RELIANCE: "2885",
  TCS: "11536",
  INFY: "1594",
  HDFCBANK: "1333",
  ICICIBANK: "4963",
  SBIN: "3045",
  ITC: "1660",
  TATAMOTORS: "3456",
  LT: "11483",
  WIPRO: "3787"
};

export const getLiveStockQuote = async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "")
      .trim()
      .toUpperCase();

    const token = STOCK_TOKENS[symbol];

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Stock symbol is not supported yet"
      });
    }

    const data = await getAngelOneQuote("NSE", token);

    const quote = data?.fetched?.[0];

    if (!quote) {
      return res.status(502).json({
        success: false,
        message: "Angel One did not return a quote"
      });
    }

    return res.status(200).json({
      success: true,
      source: "Angel One SmartAPI",
      isLive: true,
      data: {
        symbol: quote.tradingSymbol,
        token: quote.symbolToken,
        exchange: quote.exchange,
        price: quote.ltp
      }
    });
  } catch (error) {
    console.error("Angel One quote error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
