
import mongoose from "mongoose";

const paperPortfolioSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    snapshotDate: {
      type: String,
      required: true
    },
    totalPortfolioValue: {
      type: Number,
      required: true,
      min: 0
    },
    availableCash: {
      type: Number,
      required: true,
      min: 0
    },
    holdingsValue: {
      type: Number,
      required: true,
      min: 0
    },
    realizedPnL: {
      type: Number,
      default: 0
    },
    unrealizedPnL: {
      type: Number,
      default: 0
    },
    overallPnL: {
      type: Number,
      default: 0
    },
    quotesStale: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

paperPortfolioSnapshotSchema.index(
  { userId: 1, snapshotDate: 1 },
  { unique: true }
);

const PaperPortfolioSnapshot = mongoose.model(
  "PaperPortfolioSnapshot",
  paperPortfolioSnapshotSchema
);

export default PaperPortfolioSnapshot;
