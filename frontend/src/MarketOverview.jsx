
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function MarketOverview() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchIndices = async () => {
    try {
      setError("");
      setRefreshing(true);

      const response = await axios.get(
        `${API_URL}/api/market/indices`,
        { timeout: 15000 }
      );

      const marketData = response.data?.data;

      if (!Array.isArray(marketData)) {
        throw new Error("Invalid market data response");
      }

      setIndices(marketData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load market data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIndices();

    const interval = setInterval(fetchIndices, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-slate-400">
        <RefreshCw size={22} className="mx-auto mb-3 animate-spin text-cyan-400" />
        Loading market data...
      </div>
    );
  }

  if (error && indices.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-[#111827] p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>

        <button
          type="button"
          onClick={fetchIndices}
          disabled={refreshing}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {indices.map((item) => {
        const data = item.data;
        const positive = data && data.change >= 0;

        return (
          <div
            key={item.name}
            className="rounded-2xl border border-white/10 bg-[#111827] p-6 transition hover:border-cyan-400/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  {item.name}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {data
                    ? `₹${Number(data.value).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`
                    : "Unavailable"}
                </h2>
              </div>

              {data && (
                <div
                  className={`rounded-xl p-3 ${
                    positive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {positive ? (
                    <TrendingUp size={25} />
                  ) : (
                    <TrendingDown size={25} />
                  )}
                </div>
              )}
            </div>

            {data ? (
              <div
                className={`mt-4 text-sm font-semibold ${
                  positive ? "text-green-400" : "text-red-400"
                }`}
              >
                {positive ? "+" : ""}
                {Number(data.change).toFixed(2)}
                {" ("}
                {positive ? "+" : ""}
                {Number(data.changePercent).toFixed(2)}
                {"%)"}
              </div>
            ) : (
              <p className="mt-4 text-sm text-red-400">
                {item.error || "Market data unavailable"}
              </p>
            )}

            <p className="mt-3 text-xs text-slate-500">
              {data?.exchange || "Indian Market"} · Yahoo Finance
            </p>
          </div>
        );
      })}

      <div className="md:col-span-2">
        {error && (
          <p className="mb-3 text-center text-xs text-amber-400">
            Refresh failed. Showing previously loaded data.
          </p>
        )}

        <button
          type="button"
          onClick={fetchIndices}
          disabled={refreshing}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-slate-400 transition hover:border-cyan-400/30 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Market Data"}
        </button>
      </div>
    </section>
  );
}

export default MarketOverview;
