
import express from "express";

import {
  getPaperPortfolio,
  getPaperTradeHistory
} from "../controllers/paperTradingController.js";

import {
  placePaperTrade
} from "../controllers/paperTradeExecutionController.js";

import {
  getPaperPortfolioHistory
} from "../controllers/paperPortfolioHistoryController.js";

import {
  protect
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/portfolio", protect, getPaperPortfolio);
router.get("/history", protect, getPaperTradeHistory);
router.get("/history-chart", protect, getPaperPortfolioHistory);
router.post("/trade", protect, placePaperTrade);

export default router;
