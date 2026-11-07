
import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { testGemini } from "./services/geminiService.js";
import { getStockNews } from "./services/newsService.js";
import { analyzeStockNewsBatch } from "./services/analysisService.js";
import { getStockPriceHistory } from "./services/stockPriceService.js";
import { getMarketIndices } from "./services/marketIndexService.js";

import News from "./models/News.js";
import Portfolio from "./models/Portfolio.js";

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const DEMO_USER = "demo-user";

app.use(cors({
  origin: CLIENT_URL
}));

app.use(express.json());

const extractArticles = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.articles)) {
    return response.articles;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StockSense AI API is running"
  });
});

app.get("/api/ai/test", async (req, res) => {
  try {
    const result = await testGemini();

    res.json({
      success: true,
      message: "Gemini connected successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "RELIANCE")
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9&.-]{1,30}$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock symbol"
      });
    }

    const newsResponse = await getStockNews(symbol);
    const articles = extractArticles(newsResponse);

    console.log(`Returning ${articles.length} articles for ${symbol}`);

    res.json({
      success: true,
      symbol,
      articles
    });
  } catch (error) {
    console.error("News fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/news/analyze", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "RELIANCE")
      .trim()
      .toUpperCase();

    const forceRefresh = req.query.refresh === "true";

    if (!/^[A-Z0-9&.-]{1,30}$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock symbol"
      });
    }

    const cachedNews = await News.findOne({ symbol });

    const oneHour = 60 * 60 * 1000;

    const cacheIsFresh = cachedNews &&
      Date.now() - new Date(cachedNews.fetchedAt).getTime() < oneHour;

    if (!forceRefresh && cacheIsFresh) {
      return res.json({
        success: true,
        symbol,
        cached: true,
        articles: cachedNews.articles
      });
    }

    const newsResponse = await getStockNews(symbol);
    const articles = extractArticles(newsResponse);

    if (articles.length === 0) {
      return res.json({
        success: true,
        symbol,
        cached: false,
        articles: []
      });
    }

    const analyzedArticles = await analyzeStockNewsBatch(
      articles.slice(0, 3)
    );

    const savedNews = await News.findOneAndUpdate(
      { symbol },
      {
        $set: {
          articles: analyzedArticles,
          fetchedAt: new Date()
        }
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      symbol,
      cached: false,
      articles: savedNews.articles
    });
  } catch (error) {
    console.error("News analysis error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message || "Unable to analyze stock news"
    });
  }
});

app.get("/api/stocks/prices", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "RELIANCE")
      .trim()
      .toUpperCase();

    const period = String(req.query.period || "1M")
      .trim()
      .toUpperCase();

    const result = await getStockPriceHistory(symbol, period);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Stock price error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/market/indices", async (req, res) => {
  try {
    const indices = await getMarketIndices();

    res.json({
      success: true,
      data: indices
    });
  } catch (error) {
    console.error("Market indices error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/portfolio", async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      userId: DEMO_USER
    });

    res.json({
      success: true,
      holdings: portfolio?.holdings || []
    });
  } catch (error) {
    console.error("Portfolio fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch portfolio"
    });
  }
});

app.post("/api/portfolio", async (req, res) => {
  try {
    const symbol = String(req.body.symbol || "")
      .trim()
      .toUpperCase();

    const quantity = Number(req.body.quantity);
    const averagePrice = Number(req.body.averagePrice);

    if (!/^[A-Z0-9&.-]{1,30}$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock symbol"
      });
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(averagePrice) ||
      averagePrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid quantity and purchase price"
      });
    }

    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: DEMO_USER },
      {
        $setOnInsert: {
          userId: DEMO_USER
        }
      },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    const existingHolding = portfolio.holdings.find(
      item => item.symbol === symbol
    );

    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;

      existingHolding.averagePrice = (
        existingHolding.quantity * existingHolding.averagePrice +
        quantity * averagePrice
      ) / totalQuantity;

      existingHolding.quantity = totalQuantity;
    } else {
      portfolio.holdings.push({
        symbol,
        quantity,
        averagePrice
      });
    }

    await portfolio.save();

    res.status(201).json({
      success: true,
      message: "Holding added successfully",
      holdings: portfolio.holdings
    });
  } catch (error) {
    console.error("Portfolio update error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update portfolio"
    });
  }
});

app.delete("/api/portfolio/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol)
      .trim()
      .toUpperCase();

    const portfolio = await Portfolio.findOne({
      userId: DEMO_USER
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found"
      });
    }

    const existingHolding = portfolio.holdings.some(
      item => item.symbol === symbol
    );

    if (!existingHolding) {
      return res.status(404).json({
        success: false,
        message: "Stock not found in portfolio"
      });
    }

    portfolio.holdings = portfolio.holdings.filter(
      item => item.symbol !== symbol
    );

    await portfolio.save();

    res.json({
      success: true,
      message: "Holding removed successfully",
      holdings: portfolio.holdings
    });
  } catch (error) {
    console.error("Portfolio delete error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to remove holding"
    });
  }
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`StockSense AI server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
