
import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  articles: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    expires: 3600
  }
}, {
  timestamps: true
});

const News = mongoose.model("News", newsSchema);

export default News;
