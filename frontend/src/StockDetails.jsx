
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Building2,
  ArrowDown,
  ArrowUp
} from "lucide-react";

import stockList from "./stockList.js";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function StockDetails({ symbol = "RELIANCE" }) {
  const [prices, setPrices] = useState([]);
  const [weekStats, setWeekStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [weekError, setWeekError] = useState("");
  const [period, setPeriod] = useState("1M");
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedSymbol = String(symbol || "RELIANCE")
    .trim()
    .toUpperCase();

  const isBSE = selectedSymbol.endsWith(".BO");

  const displaySymbol = selectedSymbol
    .replace(/\.BO$/, "")
    .replace(/\.NS$/, "");

  const exchange = isBSE ? "BSE" : "NSE";

  const company = stockList.find(
    (stock) =>
      String(stock.symbol).toUpperCase() === displaySymbol
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${API_URL}/api/stocks/prices`,
          {
            params: {
              symbol: selectedSymbol,
              period
            },
            timeout: 30000,
            signal: controller.signal
          }
        );

        const data = response.data?.data?.data;

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No stock price data available.");
        }

        setPrices(data);
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        setPrices([]);

        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load stock details."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => controller.abort();
  }, [selectedSymbol, period, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetch52WeekStats = async () => {
      setWeekLoading(true);
      setWeekError("");
      setWeekStats(null);

      try {
        const response = await axios.get(
          `${API_URL}/api/stocks/list/52-week/${encodeURIComponent(selectedSymbol)}`,
          {
            timeout: 30000,
            signal: controller.signal
          }
        );

        if (!response.data?.success || !response.data?.data) {
          throw new Error("52-week statistics unavailable.");
        }

        setWeekStats(response.data.data);
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        setWeekStats(null);
        setWeekError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load 52-week statistics."
        );
      } finally {
        if (!controller.signal.aborted) {
          setWeekLoading(false);
        }
      }
    };

    fetch52WeekStats();

    return () => controller.abort();
  }, [selectedSymbol, refreshKey]);

  const latest = prices[prices.length - 1];
  const first = prices[0];

  const currentPrice = Number(latest?.close ?? latest?.price);
  const startingPrice = Number(first?.close ?? first?.price);

  const change = currentPrice - startingPrice;

  const changePercent = startingPrice
    ? (change / startingPrice) * 100
    : 0;

  const hasPeriodChange =
    prices.length > 1 &&
    Number.isFinite(currentPrice) &&
    Number.isFinite(startingPrice);

  const formatPrice = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((previous) => previous + 1);
  };

  useEffect(() => {
    if (!loading && !weekLoading) {
      setRefreshing(false);
    }
  }, [loading, weekLoading]);

  const high52 = Number(weekStats?.high52Week);
  const low52 = Number(weekStats?.low52Week);
  const weekCurrent = Number(weekStats?.currentPrice);

  const validWeekRange =
    Number.isFinite(high52) &&
    Number.isFinite(low52) &&
    high52 > low52 &&
    Number.isFinite(weekCurrent);

  const rangePosition = validWeekRange
    ? Math.min(
        100,
        Math.max(
          0,
          ((weekCurrent - low52) / (high52 - low52)) * 100
        )
      )
    : 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
            <Building2 size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {company?.name || displaySymbol}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {exchange}: {displaySymbol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || weekLoading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Latest available price
          </p>

          <p className="mt-2 text-3xl font-bold">
            {loading
              ? "Loading..."
              : latest
                ? `₹${formatPrice(currentPrice)}`
                : "—"}
          </p>
        </div>

        {!loading && latest && hasPeriodChange && (
          <div
            className={`flex items-center gap-2 text-sm font-semibold ${
              change >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )}

            {change >= 0 ? "+" : ""}
            {formatPrice(change)} ({changePercent.toFixed(2)}%)
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["1D", "1W", "1M", "3M", "1Y"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPeriod(item)}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              period === item
                ? "bg-cyan-400 font-semibold text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-400">
          <RefreshCw size={17} className="animate-spin text-cyan-400" />
          Loading stock details...
        </div>
      ) : latest ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Open", latest.open],
              ["High", latest.high],
              ["Low", latest.low],
              ["Close", latest.close ?? latest.price]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <p className="text-xs text-slate-400">{label}</p>

                <p className="mt-2 font-semibold">
                  ₹{formatPrice(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">
              Latest available volume
            </p>

            <p className="mt-2 font-semibold">
              {Number(latest.volume || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Annual price range
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  52-Week High & Low
                </h3>
              </div>

              <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
                1 Year
              </span>
            </div>

            {weekLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
                <RefreshCw size={16} className="animate-spin text-cyan-400" />
                Loading 52-week statistics...
              </div>
            ) : validWeekRange ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <TrendingDown size={15} />
                      52-week low
                    </div>

                    <p className="mt-2 text-xl font-bold">
                      ₹{formatPrice(low52)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <TrendingUp size={15} />
                      52-week high
                    </div>

                    <p className="mt-2 text-xl font-bold">
                      ₹{formatPrice(high52)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Current position in range
                    </span>

                    <span className="font-semibold text-cyan-400">
                      {rangePosition.toFixed(1)}%
                    </span>
                  </div>

                  <div className="relative h-3 overflow-visible rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400"
                      style={{ width: "100%" }}
                    />

                    <div
                      className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-400 shadow-lg shadow-cyan-400/30"
                      style={{ left: `${rangePosition}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>₹{formatPrice(low52)}</span>
                    <span>₹{formatPrice(high52)}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-800/70 p-3">
                    <p className="text-xs text-slate-400">
                      Distance from high
                    </p>

                    <p className="mt-1 flex items-center gap-1 font-semibold text-red-400">
                      <ArrowDown size={15} />
                      {Math.abs(Number(weekStats.distanceFromHigh)).toFixed(2)}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-800/70 p-3">
                    <p className="text-xs text-slate-400">
                      Distance from low
                    </p>

                    <p className="mt-1 flex items-center gap-1 font-semibold text-green-400">
                      <ArrowUp size={15} />
                      {Number(weekStats.distanceFromLow).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Data source: Yahoo Finance ({weekStats.dataSourceExchange})
                  {weekStats.isFallback ? " · NSE fallback used" : ""}
                </p>
              </>
            ) : (
              <p className="py-6 text-sm text-slate-400">
                {weekError || "52-week range is currently unavailable."}
              </p>
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Performance compares the first and latest available prices
            in the selected period. Historical data from Yahoo Finance
            may be delayed or incomplete. This information is for
            educational purposes and is not investment advice.
          </p>
        </>
      ) : (
        !error && (
          <p className="py-10 text-center text-sm text-slate-400">
            No stock details available.
          </p>
        )
      )}
    </section>
  );
}

export default StockDetails;
