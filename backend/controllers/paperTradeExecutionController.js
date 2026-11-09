
import {
  executePaperTrade
} from "../services/paperTradingService.js";

export const placePaperTrade = async (req, res) => {
  try {
    const {
      symbol,
      exchange,
      side,
      quantity,
      orderId
    } = req.body;

    if (
      !symbol ||
      !exchange ||
      !side ||
      quantity === undefined ||
      quantity === null ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Symbol, exchange, side, quantity and orderId are required"
      });
    }

    if (
      typeof symbol !== "string" ||
      typeof exchange !== "string" ||
      typeof side !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trade request"
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

    const normalizedSymbol = symbol.trim().toUpperCase();
    const normalizedExchange = exchange.trim().toUpperCase();
    const normalizedSide = side.trim().toUpperCase();
    const stockQuantity = Number(quantity);

    if (!/^[A-Z0-9&.-]{1,30}$/.test(normalizedSymbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock symbol"
      });
    }

    if (!["NSE", "BSE"].includes(normalizedExchange)) {
      return res.status(400).json({
        success: false,
        message: "Exchange must be NSE or BSE"
      });
    }

    if (!["BUY", "SELL"].includes(normalizedSide)) {
      return res.status(400).json({
        success: false,
        message: "Trade type must be BUY or SELL"
      });
    }

    if (
      !Number.isSafeInteger(stockQuantity) ||
      stockQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number"
      });
    }

    const result = await executePaperTrade({
      userId: req.user._id,
      symbol: normalizedSymbol,
      exchange: normalizedExchange,
      side: normalizedSide,
      quantity: stockQuantity,
      simulatedFees: 0,
      orderId: orderId.trim()
    });

    return res.status(201).json({
      success: true,
      message: `Paper ${normalizedSide} executed successfully`,
      trade: result.trade,
      portfolio: result.portfolio,
      quote: result.quote,
      warning: result.quote?.isStale
        ? "Quote is stale. This is a simulated trade using the last available price."
        : result.quote?.source === "Angel One SmartAPI"
        ? "Angel One REST LTP used for this simulated trade. This is not a continuous streaming quote."
        : "This is a virtual trade, not a real broker order."
    });
  } catch (error) {
    console.error(
      "Paper trade execution error:",
      error.message
    );

    const clientErrors = [
      "Invalid user",
      "Invalid stock symbol",
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
