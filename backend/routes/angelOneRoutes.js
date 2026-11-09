
import express from "express";
import { getLiveStockQuote } from "../controllers/angelOneController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:symbol", protect, getLiveStockQuote);

export default router;
