
import cron from "node-cron";

import {
  createDailyPaperPortfolioSnapshots
} from "../services/paperTradingService.js";

let isRunning = false;

export const startPaperPortfolioScheduler = () => {
  cron.schedule(
    "45 15 * * 1-5",
    async () => {
      if (isRunning) {
        console.log("Portfolio snapshot job is already running.");
        return;
      }

      isRunning = true;

      try {
        console.log("Starting daily paper portfolio snapshots...");

        const result = await createDailyPaperPortfolioSnapshots();

        console.log("Daily portfolio snapshot result:", result);
      } catch (error) {
        console.error(
          "Daily portfolio scheduler failed:",
          error.message
        );
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "Asia/Kolkata"
    }
  );

  console.log("Paper portfolio scheduler initialized.");
};
