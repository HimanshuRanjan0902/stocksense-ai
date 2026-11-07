
import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0.01
  }
});

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  holdings: {
    type: [holdingSchema],
    default: []
  }
}, {
  timestamps: true
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;
