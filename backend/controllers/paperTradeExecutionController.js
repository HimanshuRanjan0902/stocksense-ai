
import {
  executePaperTrade
} from "../services/paperTradingService.js";

import {
  getLatestStockQuote
} from "../services/stockPriceService.js";

export const placePaperTrade = async (req, res) => {
  try {
    const { symbol, exchange, side, quantity, orderId } = req.body;

    if (!symbol || !exchange || !side || !quantity || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Symbol, exchange, side, quantity and orderId are required"
      });
    }

    if (
      typeof orderId !== "string" ||
      orderId.length < 8 ||
      orderId.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const stockQuantity = Number(quantity);

    if (!Number.isSafeInteger(stockQuantity) || stockQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number"
      });
    }

    const normalizedSide = String(side).trim().toUpperCase();
    const normalizedExchange = String(exchange).trim().toUpperCase();

    if (!["BUY", "SELL"].includes(normalizedSide)) {
      return res.status(400).json({
        success: false,
        message: "Trade type must be BUY or SELL"
      });
    }

    if (!["NSE", "BSE"].includes(normalizedExchange)) {
      return res.status(400).json({
        success: false,
        message: "Exchange must be NSE or BSE"
      });
    }

    const quote = await getLatestStockQuote(
      symbol,
      normalizedExchange
    );

    const result = await executePaperTrade({
      userId: req.user._id,
      symbol: quote.symbol,
      exchange: normalizedExchange,
      side: normalizedSide,
      quantity: stockQuantity,
      executionPrice: quote.price,
      simulatedFees: 0,
      orderId
    });

    return res.status(201).json({
      success: true,
      message: `Paper ${normalizedSide} executed successfully`,
      trade: result.trade,
      portfolio: result.portfolio,
      quote: {
        price: quote.price,
        source: quote.source,
        timestamp: quote.timestamp,
        isLive: quote.isLive,
        isStale: quote.isStale,
        marketState: quote.marketState
      },
      warning: quote.isStale
        ? "Market is closed or quote is stale. This simulated trade used the last available Yahoo Finance price, not a live market price."
        : "This is a virtual trade, not a real broker order."
    });
  } catch (error) {
    console.error("Paper trade execution error:", error.message);

    const clientErrors = [
      "Invalid user",
      "Invalid stock symbol or exchange",
      "Invalid trade type",
      "Quantity must be a positive whole number",
      "Invalid execution price",
      "Invalid simulated fees",
      "Order ID is required",
      "Insufficient virtual balance",
      "You do not own this stock",
      "Insufficient stock quantity",
      "Fees cannot exceed the sale value",
      "This order has already been processed",
      "Invalid exchange",
      "Stock symbol and exchange do not match"
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This order has already been processed"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Paper trade execution failed"
    });
  }
};
