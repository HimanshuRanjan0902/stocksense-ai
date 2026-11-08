
import crypto from "crypto";

import {
  createDailyPaperPortfolioSnapshots
} from "../services/paperTradingService.js";

export const runPaperPortfolioCron = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const receivedSecret = req.headers["x-cron-secret"];

    if (!cronSecret || !receivedSecret) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const expected = Buffer.from(cronSecret);
    const received = Buffer.from(receivedSecret);

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await createDailyPaperPortfolioSnapshots();

    return res.status(200).json({
      success: true,
      message: "Daily paper portfolio snapshots completed",
      result
    });
  } catch (error) {
    console.error("Paper portfolio cron error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Snapshot job failed"
    });
  }
};
