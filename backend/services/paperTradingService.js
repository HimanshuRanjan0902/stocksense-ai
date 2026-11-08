
import mongoose from "mongoose";

import PaperPortfolio from "../models/PaperPortfolio.js";
import PaperTrade from "../models/PaperTrade.js";
import PaperPortfolioSnapshot from "../models/PaperPortfolioSnapshot.js";

import { getLatestStockQuote } from "./stockPriceService.js";

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getIndiaDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const dateParts = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      dateParts[part.type] = part.value;
    }
  }

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

const savePortfolioSnapshot = async (portfolio) => {
  try {
    let holdingsValue = 0;
    let totalCostBasis = 0;
    let quotesStale = false;

    for (const holding of portfolio.holdings || []) {
      const quote = await getLatestStockQuote(
        holding.symbol,
        holding.exchange
      );

      const currentPrice = Number(quote?.price);

      if (
        !quote ||
        !Number.isFinite(currentPrice) ||
        currentPrice <= 0
      ) {
        console.warn(
          `Snapshot skipped: quote unavailable for ${holding.symbol}`
        );

        return false;
      }

      if (quote.isStale || quote.isLive === false) {
        quotesStale = true;
      }

      holdingsValue += holding.quantity * currentPrice;

      totalCostBasis +=
        holding.quantity * holding.averagePrice;
    }

    holdingsValue = roundMoney(holdingsValue);
    totalCostBasis = roundMoney(totalCostBasis);

    const availableCash = roundMoney(portfolio.availableCash);

    const totalPortfolioValue = roundMoney(
      availableCash + holdingsValue
    );

    const realizedPnL = roundMoney(portfolio.realizedPnL || 0);

    const unrealizedPnL = roundMoney(
      holdingsValue - totalCostBasis
    );

    const overallPnL = roundMoney(
      realizedPnL + unrealizedPnL
    );

    const snapshotDate = getIndiaDate();

    await PaperPortfolioSnapshot.findOneAndUpdate(
      {
        userId: portfolio.userId,
        snapshotDate
      },
      {
        $set: {
          totalPortfolioValue,
          availableCash,
          holdingsValue,
          realizedPnL,
          unrealizedPnL,
          overallPnL,
          quotesStale
        },
        $setOnInsert: {
          userId: portfolio.userId,
          snapshotDate
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(
      `Portfolio snapshot saved for ${snapshotDate}. Stale quotes: ${quotesStale}`
    );

    return true;
  } catch (error) {
    console.error(
      "Portfolio snapshot error:",
      error.message
    );

    return false;
  }
};

export const executePaperTrade = async ({
  userId,
  symbol,
  exchange,
  side,
  quantity,
  executionPrice,
  simulatedFees = 0,
  orderId
}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const normalizedSymbol = String(symbol || "")
    .trim()
    .toUpperCase();

  const normalizedExchange = String(exchange || "")
    .trim()
    .toUpperCase();

  const normalizedSide = String(side || "")
    .trim()
    .toUpperCase();

  const normalizedOrderId = String(orderId || "").trim();

  const tradeQuantity = Number(quantity);
  const price = Number(executionPrice);
  const fees = Number(simulatedFees);

  if (!normalizedSymbol) {
    throw new Error("Stock symbol is required");
  }

  if (normalizedSymbol.length > 30) {
    throw new Error("Invalid stock symbol");
  }

  if (!["NSE", "BSE"].includes(normalizedExchange)) {
    throw new Error("Exchange must be NSE or BSE");
  }

  if (!["BUY", "SELL"].includes(normalizedSide)) {
    throw new Error("Trade side must be BUY or SELL");
  }

  if (
    !Number.isSafeInteger(tradeQuantity) ||
    tradeQuantity <= 0
  ) {
    throw new Error("Quantity must be a positive whole number");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid execution price");
  }

  if (!Number.isFinite(fees) || fees < 0) {
    throw new Error("Invalid simulated fees");
  }

  if (
    normalizedOrderId.length < 8 ||
    normalizedOrderId.length > 100
  ) {
    throw new Error("Invalid order ID");
  }

  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(async () => {
      const existingTrade = await PaperTrade.findOne({
        userId,
        orderId: normalizedOrderId
      }).session(session);

      if (existingTrade) {
        throw new Error("This order has already been processed");
      }

      const portfolio = await PaperPortfolio.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            initialBalance: 500000,
            availableCash: 500000,
            realizedPnL: 0,
            holdings: []
          }
        },
        {
          upsert: true,
          returnDocument: "after",
          session,
          setDefaultsOnInsert: true,
          runValidators: true
        }
      );

      if (!portfolio) {
        throw new Error("Unable to create paper portfolio");
      }

      const holding = portfolio.holdings.find(
        (item) =>
          item.symbol === normalizedSymbol &&
          item.exchange === normalizedExchange
      );

      const grossValue = roundMoney(
        price * tradeQuantity
      );

      let netValue = 0;
      let realizedPnL = 0;

      if (normalizedSide === "BUY") {
        netValue = roundMoney(grossValue + fees);

        if (portfolio.availableCash < netValue) {
          throw new Error("Insufficient virtual balance");
        }

        if (holding) {
          const existingCost =
            holding.averagePrice * holding.quantity;

          const newCost = price * tradeQuantity;

          const newQuantity =
            holding.quantity + tradeQuantity;

          holding.averagePrice = roundMoney(
            (existingCost + newCost) / newQuantity
          );

          holding.quantity = newQuantity;
        } else {
          portfolio.holdings.push({
            symbol: normalizedSymbol,
            exchange: normalizedExchange,
            quantity: tradeQuantity,
            averagePrice: price
          });
        }

        portfolio.availableCash = roundMoney(
          portfolio.availableCash - netValue
        );
      }

      if (normalizedSide === "SELL") {
        if (!holding || holding.quantity < tradeQuantity) {
          throw new Error("Insufficient shares to sell");
        }

        netValue = roundMoney(grossValue - fees);

        if (netValue < 0) {
          throw new Error("Simulated fees exceed trade value");
        }

        realizedPnL = roundMoney(
          (price - holding.averagePrice) * tradeQuantity - fees
        );

        holding.quantity -= tradeQuantity;

        if (holding.quantity === 0) {
          portfolio.holdings = portfolio.holdings.filter(
            (item) =>
              !(
                item.symbol === normalizedSymbol &&
                item.exchange === normalizedExchange
              )
          );
        }

        portfolio.availableCash = roundMoney(
          portfolio.availableCash + netValue
        );

        portfolio.realizedPnL = roundMoney(
          portfolio.realizedPnL + realizedPnL
        );
      }

      const trade = new PaperTrade({
        userId,
        orderId: normalizedOrderId,
        symbol: normalizedSymbol,
        exchange: normalizedExchange,
        side: normalizedSide,
        quantity: tradeQuantity,
        executionPrice: price,
        grossValue,
        simulatedFees: fees,
        netValue,
        realizedPnL,
        status: "EXECUTED"
      });

      await trade.save({ session });

      await portfolio.save({ session });

      result = {
        trade,
        portfolio
      };
    });
  } finally {
    await session.endSession();
  }

  if (result?.portfolio) {
    await savePortfolioSnapshot(result.portfolio);
  }

  return result;
};

export const createDailyPaperPortfolioSnapshots = async () => {
  const portfolios = await PaperPortfolio.find({})
    .select("userId availableCash realizedPnL holdings")
    .lean();

  let saved = 0;
  let skipped = 0;

  for (const portfolio of portfolios) {
    const result = await savePortfolioSnapshot(portfolio);

    if (result) {
      saved++;
    } else {
      skipped++;
    }
  }

  return {
    total: portfolios.length,
    saved,
    skipped
  };
};
