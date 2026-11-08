

import express from "express";
import { getHeatmapData } from "../services/heatmapService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await getHeatmapData();

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Heatmap API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load stock heatmap",
      error: error.message
    });
  }
});

export default router;
