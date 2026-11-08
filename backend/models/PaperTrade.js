
import mongoose from "mongoose";

const paperTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      trim: true
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    exchange: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["NSE", "BSE"]
    },
    side: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["BUY", "SELL"]
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be a whole number"
      }
    },
    executionPrice: {
      type: Number,
      required: true,
      min: 0
    },
    grossValue: {
      type: Number,
      required: true,
      min: 0
    },
    simulatedFees: {
      type: Number,
      default: 0,
      min: 0
    },
    netValue: {
      type: Number,
      required: true,
      min: 0
    },
    realizedPnL: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["EXECUTED", "REJECTED"],
      default: "EXECUTED"
    }
  },
  {
    timestamps: true
  }
);

paperTradeSchema.index(
  { userId: 1, orderId: 1 },
  { unique: true }
);

paperTradeSchema.index({
  userId: 1,
  createdAt: -1
});

const PaperTrade = mongoose.model("PaperTrade", paperTradeSchema);

export default PaperTrade;
