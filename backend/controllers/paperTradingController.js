
import PaperPortfolio from "../models/PaperPortfolio.js";
import PaperTrade from "../models/PaperTrade.js";
import { getLatestStockQuote } from "../services/stockPriceService.js";

const roundMoney = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
};

export const getPaperPortfolio = async (req, res) => {
  try {
    const portfolio = await PaperPortfolio.findOneAndUpdate(
      { userId: req.user._id },
      {
        $setOnInsert: {
          userId: req.user._id,
          initialBalance: 500000,
          availableCash: 500000
        }
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    const holdingsWithQuotes = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        const costBasis = roundMoney(
          holding.quantity * holding.averagePrice
        );

        try {
          const quote = await getLatestStockQuote(
            holding.symbol,
            holding.exchange
          );

          const currentPrice = Number(quote?.price);

          if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
            throw new Error("Invalid stock quote");
          }

          const marketValue = roundMoney(
            holding.quantity * currentPrice
          );

          const unrealizedPnL = roundMoney(
            marketValue - costBasis
          );

          const unrealizedPnLPercent =
            costBasis > 0
              ? roundMoney((unrealizedPnL / costBasis) * 100)
              : 0;

          return {
            symbol: holding.symbol,
            exchange: holding.exchange,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            currentPrice,
            costBasis,
            marketValue,
            unrealizedPnL,
            unrealizedPnLPercent,
            quote: {
              timestamp: quote.timestamp || null,
              fetchedAt: quote.fetchedAt || null,
              isLive: quote.isLive ?? false,
              isStale: quote.isStale ?? true,
              marketState: quote.marketState || "UNKNOWN",
              quoteAgeSeconds: quote.quoteAgeSeconds ?? null,
              source: quote.source || "Unknown",
              freshness: quote.freshness || "unknown",
              streaming: quote.streaming ?? false
            },
            quoteAvailable: true
          };
        } catch (error) {
          console.error(
            `Paper portfolio quote failed for ${holding.symbol}:`,
            error.message
          );

          return {
            symbol: holding.symbol,
            exchange: holding.exchange,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            costBasis,
            marketValue: null,
            currentPrice: null,
            unrealizedPnL: null,
            unrealizedPnLPercent: null,
            quote: null,
            quoteAvailable: false
          };
        }
      })
    );

    const holdingsValue = roundMoney(
      holdingsWithQuotes.reduce(
        (total, holding) =>
          total + (holding.marketValue ?? 0),
        0
      )
    );

    const totalCostBasis = roundMoney(
      holdingsWithQuotes.reduce(
        (total, holding) => total + holding.costBasis,
        0
      )
    );

    const unrealizedPnL = roundMoney(
      holdingsWithQuotes.reduce(
        (total, holding) =>
          total + (holding.unrealizedPnL ?? 0),
        0
      )
    );

    const availableCash = roundMoney(portfolio.availableCash);

    const totalPortfolioValue = roundMoney(
      availableCash + holdingsValue
    );

    const realizedPnL = roundMoney(portfolio.realizedPnL || 0);

    const overallPnL = roundMoney(
      realizedPnL + unrealizedPnL
    );

    const initialBalance = roundMoney(portfolio.initialBalance);

    const overallPnLPercent =
      initialBalance > 0
        ? roundMoney((overallPnL / initialBalance) * 100)
        : 0;

    const hasUnavailableQuotes = holdingsWithQuotes.some(
      (holding) => !holding.quoteAvailable
    );

    const hasStaleQuotes = holdingsWithQuotes.some(
      (holding) =>
        holding.quoteAvailable &&
        holding.quote?.isStale
    );

    const quoteSources = [
      ...new Set(
        holdingsWithQuotes
          .filter((holding) => holding.quoteAvailable)
          .map((holding) => holding.quote.source)
      )
    ];

    return res.status(200).json({
      success: true,
      portfolio: {
        ...portfolio.toObject(),
        holdings: holdingsWithQuotes,
        valuation: {
          holdingsValue,
          totalCostBasis,
          availableCash,
          totalPortfolioValue,
          realizedPnL,
          unrealizedPnL,
          overallPnL,
          overallPnLPercent,
          hasUnavailableQuotes,
          hasStaleQuotes,
          quoteSources
        }
      }
    });
  } catch (error) {
    console.error("Paper portfolio error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch paper portfolio"
    });
  }
};

export const getPaperTradeHistory = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {
      userId: req.user._id
    };

    const [trades, total] = await Promise.all([
      PaperTrade.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      PaperTrade.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Paper trade history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch paper trade history"
    });
  }
};
