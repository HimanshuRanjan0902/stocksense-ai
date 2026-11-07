
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";

const API_URL = "http://localhost:5000";

const periods = ["1D", "1W", "1M", "3M", "1Y"];

function StockChart({ symbol = "RELIANCE" }) {
  const [period, setPeriod] = useState("1M");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchPrices = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${API_URL}/api/stocks/prices`,
          {
            params: { symbol, period },
            timeout: 30000
          }
        );

        const prices = response.data?.data?.data;

        if (!Array.isArray(prices)) {
          throw new Error("Invalid price data received from backend");
        }

        const formattedData = prices
          .filter(item =>
            item &&
            item.date &&
            Number.isFinite(Number(item.price))
          )
          .map(item => ({
            date: item.date,
            price: Number(item.price)
          }));

        if (formattedData.length === 0) {
          throw new Error("No stock price data available");
        }

        if (active) {
          setChartData(formattedData);
        }
      } catch (err) {
        if (active) {
          setChartData([]);
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load stock prices"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPrices();

    return () => {
      active = false;
    };
  }, [symbol, period]);

  const safeData = Array.isArray(chartData) ? chartData : [];

  const firstPrice = safeData[0]?.price ?? 0;
  const lastPrice = safeData[safeData.length - 1]?.price ?? 0;

  const change = lastPrice - firstPrice;

  const changePercent = firstPrice
    ? (change / firstPrice) * 100
    : 0;

  const positive = change >= 0;

  const formatPrice = value =>
    `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const chartWidth = 800;
  const chartHeight = 260;
  const padding = 16;

  const values = safeData.map(item => item.price);

  const minPrice = values.length ? Math.min(...values) : 0;
  const maxPrice = values.length ? Math.max(...values) : 1;
  const priceRange = maxPrice - minPrice || 1;

  const points = safeData.map((item, index) => {
    const x = padding +
      (index / Math.max(safeData.length - 1, 1)) *
      (chartWidth - padding * 2);

    const y = chartHeight - padding -
      ((item.price - minPrice) / priceRange) *
      (chartHeight - padding * 2);

    return { x, y };
  });

  const linePoints = points
    .map(point => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints = points.length
    ? `${points[0].x},${chartHeight} ${linePoints} ${points[points.length - 1].x},${chartHeight}`
    : "";

  const dateLabel = date =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short"
    });

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#111827] p-5 md:p-6">

      <div className="flex flex-wrap justify-between items-start gap-4">

        <div>
          <p className="text-sm text-slate-400">
            Stock Price History
          </p>

          <h2 className="text-2xl font-bold text-white mt-2">
            {symbol}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            NSE · Yahoo Finance
          </p>
        </div>

        {safeData.length > 0 && !loading && (
          <div className="text-right">
            <h3 className="text-2xl font-bold text-white">
              {formatPrice(lastPrice)}
            </h3>

            <p className={`flex items-center justify-end gap-1 text-sm mt-2 ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}>
              {positive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}

              {positive ? "+" : ""}
              {change.toFixed(2)} (
              {positive ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </p>
          </div>
        )}

      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        {periods.map(item => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === item
                ? "bg-emerald-500 text-black"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="w-full h-[280px] mt-6">

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <RefreshCw
              size={25}
              className="animate-spin text-emerald-400"
            />
            <p className="mt-3 text-sm">
              Loading stock chart...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="stockAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#10b981"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="#10b981"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map(line => {
              const y = (chartHeight / 4) * line;

              return (
                <line
                  key={line}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#263244"
                  strokeDasharray="5 5"
                />
              );
            })}

            <polygon
              points={areaPoints}
              fill="url(#stockAreaGradient)"
            />

            <polyline
              points={linePoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        )}

      </div>

      {safeData.length > 0 && !loading && (
        <div className="flex justify-between text-xs text-slate-500 mt-3">
          <span>{dateLabel(safeData[0].date)}</span>
          <span>{dateLabel(safeData[safeData.length - 1].date)}</span>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-5">
        Historical prices · Yahoo Finance data may be delayed and is not guaranteed real-time.
      </p>

    </div>
  );
}

export default StockChart;
