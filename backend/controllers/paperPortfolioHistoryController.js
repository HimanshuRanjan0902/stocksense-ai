
import PaperPortfolioSnapshot from "../models/PaperPortfolioSnapshot.js";

export const getPaperPortfolioHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const requestedLimit = Number(req.query.limit) || 90;
    const limit = Math.min(365, Math.max(1, requestedLimit));

    const filter = {
      userId: req.user._id
    };

    const [snapshots, total] = await Promise.all([
      PaperPortfolioSnapshot.find(filter)
        .sort({ snapshotDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "snapshotDate totalPortfolioValue availableCash holdingsValue realizedPnL unrealizedPnL overallPnL quotesStale"
        )
        .lean(),

      PaperPortfolioSnapshot.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: snapshots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(
      "Paper portfolio history error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch paper portfolio history"
    });
  }
};
