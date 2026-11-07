
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Building2
} from "lucide-react";

import stockList from "./stockList.js";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function StockDetails({ symbol = "RELIANCE" }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("1M");
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedSymbol = String(symbol || "RELIANCE")
    .trim()
    .toUpperCase();

  const company = stockList.find(
    (stock) => stock.symbol === selectedSymbol
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
        if (err.name === "CanceledError") return;

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

  const latest = prices[prices.length - 1];
  const first = prices[0];

  const currentPrice = Number(latest?.close ?? latest?.price);
  const startingPrice = Number(first?.close ?? first?.price);

  const change = currentPrice - startingPrice;

  const changePercent = startingPrice
    ? (change / startingPrice) * 100
    : 0;

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
    if (!loading) {
      setRefreshing(false);
    }
  }, [loading]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
            <Building2 size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {company?.name || selectedSymbol}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              NSE: {selectedSymbol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading || refreshing ? "animate-spin" : ""}
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

        {!loading && latest && Number.isFinite(change) && (
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

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Performance compares the first and latest available prices
            in the selected period. Data is sourced from Yahoo Finance
            and may be delayed or incomplete.
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
