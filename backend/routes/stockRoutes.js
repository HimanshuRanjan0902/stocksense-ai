
import express from "express";
import { getStockSymbols } from "../services/stockUniverseService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const exchange = String(req.query.exchange || "both").toLowerCase();

    if (!["nse", "bse", "both"].includes(exchange)) {
      return res.status(400).json({
        success: false,
        message: "Exchange must be NSE, BSE or both"
      });
    }

    if (exchange === "both") {
      const [nse, bse] = await Promise.all([
        getStockSymbols("nse"),
        getStockSymbols("bse")
      ]);

      return res.status(200).json({
        success: true,
        data: { nse, bse }
      });
    }

    const data = await getStockSymbols(exchange);

    return res.status(200).json({
      success: true,
      exchange: exchange.toUpperCase(),
      data
    });
  } catch (error) {
    console.error("Stock symbols error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to fetch stock symbols",
      error: error.message
    });
  }
});

export default router;
