
import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    exchange: {
      type: String,
      enum: ["NSE", "BSE"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    averagePrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const paperPortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    initialBalance: {
      type: Number,
      default: 500000,
      immutable: true
    },
    availableCash: {
      type: Number,
      default: 500000,
      min: 0
    },
    realizedPnL: {
      type: Number,
      default: 0
    },
    holdings: {
      type: [holdingSchema],
      default: []
    }
  },
  { timestamps: true }
);

const PaperPortfolio = mongoose.model(
  "PaperPortfolio",
  paperPortfolioSchema
);

export default PaperPortfolio;
