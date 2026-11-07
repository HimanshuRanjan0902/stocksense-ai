
import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  symbols: {
    type: [String],
    default: [],
    validate: {
      validator: (symbols) => symbols.length <= 50,
      message: "Watchlist cannot contain more than 50 stocks"
    }
  }
}, {
  timestamps: true
});

watchlistSchema.pre("save", function () {
  this.symbols = [
    ...new Set(
      this.symbols.map((symbol) => String(symbol).trim().toUpperCase())
    )
  ];
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;
