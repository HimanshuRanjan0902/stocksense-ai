
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PAGE_SIZE = 15;

const debtPattern =
  /\b(NCD|DEBENTURE|BOND|STRPP|SEC RED|SEC REDEEMABLE|NON CONVERTIBLE|COMMERCIAL PAPER|CP SERIES)\b/i;


 
const isEquityStock = (stock) => {
  const debtPattern =
    /\b(NCD|DEBENTURE|BOND|STRPP|NON CONVERTIBLE|NON-CONVERTIBLE|COMMERCIAL PAPER|SEC RED|SEC REDEEMABLE|TAX FREE BOND|ZERO COUPON)\b/i;

  const symbol = String(stock.symbol || "").trim();
  const name = String(stock.name || "").trim();

  if (debtPattern.test(`${symbol} ${name}`)) {
    return false;
  }

  if (/^\d{6,}$/.test(symbol)) {
    return false;
  }

  if (stock.exchange === "NSE") {
    const allowedSeries = ["EQ", "BE", "BZ", "SM"];
    const series = String(stock.series || "").toUpperCase();

    if (!allowedSeries.includes(series)) {
      return false;
    }
  }

  return true;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getLogoUrl = (isin) => {
  if (!isin) return null;

  return `https://company-logo.shareperks.in/logo/${encodeURIComponent(
    isin
  )}/icon.svg`;
};

function CompanyLogo({ stock }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [stock.isin]);

  const logoUrl = getLogoUrl(stock.isin);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white">
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt={`${stock.name} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-bold text-slate-800">
          {String(stock.symbol || "ST").slice(0, 3)}
        </span>
      )}
    </div>
  );
}

export default function StockHeatmap({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [exchange, setExchange] = useState("ALL");
  const [sort, setSort] = useState("movement");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/stocks/heatmap`
      );

      if (!response.data?.success) {
        throw new Error("Unable to load stock market data");
      }

      setStocks(response.data.data?.stocks || []);
      setSummary(response.data.data || null);
      setPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load heatmap"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const equityStocks = useMemo(
    () => stocks.filter(isEquityStock),
    [stocks]
  );

  const filteredStocks = useMemo(() => {
    let result = equityStocks.filter((stock) => {
      const symbol = String(stock.symbol || "").toLowerCase();
      const name = String(stock.name || "").toLowerCase();
      const query = search.trim().toLowerCase();

      const matchesSearch =
        symbol.includes(query) || name.includes(query);

      const exchanges = stock.exchanges || [stock.exchange];

      const matchesExchange =
        exchange === "ALL" || exchanges.includes(exchange);

      const change = Number(stock.changePercent) || 0;

      const matchesCategory =
        category === "ALL" ||
        (category === "GAINERS" && change > 0) ||
        (category === "LOSERS" && change < 0) ||
        (category === "UNCHANGED" && change === 0);

      return matchesSearch && matchesExchange && matchesCategory;
    });

    result = [...result];

    if (sort === "gainers") {
      result.sort(
        (a, b) => b.changePercent - a.changePercent
      );
    } else if (sort === "losers") {
      result.sort(
        (a, b) => a.changePercent - b.changePercent
      );
    } else if (sort === "volume") {
      result.sort((a, b) => b.volume - a.volume);
    } else {
      result.sort(
        (a, b) =>
          Math.abs(b.changePercent) - Math.abs(a.changePercent)
      );
    }

    return result;
  }, [equityStocks, search, exchange, category, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, exchange, category, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStocks.length / PAGE_SIZE)
  );

  const visibleStocks = filteredStocks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const stats = useMemo(
    () => ({
      total: equityStocks.length,
      gainers: equityStocks.filter(
        (stock) => Number(stock.changePercent) > 0
      ).length,
      losers: equityStocks.filter(
        (stock) => Number(stock.changePercent) < 0
      ).length,
      unchanged: equityStocks.filter(
        (stock) => Number(stock.changePercent) === 0
      ).length
    }),
    [equityStocks]
  );

  const getTileStyle = (change) => {
    const intensity = Math.min(Math.abs(change) / 5, 1);

    if (change > 0) {
      return {
        background: `linear-gradient(145deg, rgba(5, 150, 105, ${
          0.25 + intensity * 0.55
        }), rgba(6, 78, 59, 0.8))`,
        borderColor: "rgba(52, 211, 153, 0.2)"
      };
    }

    if (change < 0) {
      return {
        background: `linear-gradient(145deg, rgba(220, 38, 38, ${
          0.25 + intensity * 0.55
        }), rgba(127, 29, 29, 0.8))`,
        borderColor: "rgba(248, 113, 113, 0.2)"
      };
    }

    return {
      background: "linear-gradient(145deg, #202b3c, #151e2d)",
      borderColor: "rgba(148, 163, 184, 0.15)"
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1220]">
        <div className="text-center">
          <RefreshCw
            className="mx-auto mb-4 animate-spin text-cyan-400"
            size={30}
          />
          <p className="text-sm text-slate-400">
            Loading Indian stock market data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <Activity
          className="mx-auto mb-3 text-red-400"
          size={30}
        />

        <p className="text-sm text-red-300">{error}</p>

        <button
          onClick={fetchHeatmap}
          className="mt-5 rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101b2d] via-[#0c1422] to-[#090f1a] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <Activity size={19} />
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Market Visualization
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Indian Market Heatmap
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Explore daily performance of NSE and BSE equity stocks.
            </p>
          </div>

          <button
            onClick={fetchHeatmap}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
            NSE + BSE
          </span>

          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            End of Day
          </span>

          <span className="text-xs text-slate-500">
            Data date: {summary?.date || "Unavailable"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Equity Stocks",
            value: stats.total,
            icon: Activity,
            color: "text-cyan-300",
            bg: "bg-cyan-400/10"
          },
          {
            label: "Gainers",
            value: stats.gainers,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
          },
          {
            label: "Losers",
            value: stats.losers,
            icon: TrendingDown,
            color: "text-red-400",
            bg: "bg-red-400/10"
          },
          {
            label: "Unchanged",
            value: stats.unchanged,
            icon: Activity,
            color: "text-slate-300",
            bg: "bg-slate-400/10"
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#111b2b] p-4 transition hover:border-white/20 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 sm:text-sm">
                  {item.label}
                </p>

                <span
                  className={`rounded-lg p-2 ${item.bg} ${item.color}`}
                >
                  <Icon size={17} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {formatNumber(item.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c1422] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company name or stock symbol..."
              className="w-full rounded-xl border border-white/10 bg-[#111b2b] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={exchange}
              onChange={(event) => setExchange(event.target.value)}
              className="min-w-32 rounded-xl border border-white/10 bg-[#111b2b] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="ALL">All Exchanges</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="min-w-40 rounded-xl border border-white/10 bg-[#111b2b] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="movement">Highest Movement</option>
              <option value="gainers">Top Gainers</option>
              <option value="losers">Top Losers</option>
              <option value="volume">Highest Volume</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {[
            ["ALL", "All Stocks"],
            ["GAINERS", "Gainers"],
            ["LOSERS", "Losers"],
            ["UNCHANGED", "Unchanged"]
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                category === value
                  ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                  : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">
            Market Performance
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Showing {formatNumber(visibleStocks.length)} of{" "}
            {formatNumber(filteredStocks.length)} stocks
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Positive
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            Negative
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
            Unchanged
          </span>
        </div>
      </div>

      {visibleStocks.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleStocks.map((stock) => {
            const change = Number(stock.changePercent) || 0;
            const positive = change > 0;
            const negative = change < 0;

            return (
              <button
                key={stock.isin || `${stock.exchange}-${stock.symbol}`}
                onClick={() =>
                  onSelectStock?.(stock.symbol, stock)
                }
                style={getTileStyle(change)}
                className="group relative min-h-36 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-white/40 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CompanyLogo stock={stock} />

                    <span className="truncate text-sm font-bold text-white">
                      {stock.symbol}
                    </span>
                  </div>

                  {positive ? (
                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-emerald-200"
                    />
                  ) : negative ? (
                    <ArrowDownRight
                      size={17}
                      className="shrink-0 text-red-200"
                    />
                  ) : (
                    <Activity
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                  )}
                </div>

                <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-4 text-white/70">
                  {stock.name}
                </p>

                <p className="mt-3 text-xl font-extrabold tracking-tight text-white">
                  {positive ? "+" : ""}
                  {change.toFixed(2)}%
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-white/70">
                    ₹{Number(stock.price || 0).toFixed(2)}
                  </span>

                  <span className="rounded-md bg-black/15 px-2 py-1 text-[10px] font-semibold text-white/70">
                    {(stock.exchanges || [stock.exchange]).join(" / ")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#111b2b] px-5 py-16 text-center">
          <Search
            className="mx-auto mb-3 text-slate-500"
            size={30}
          />

          <h3 className="font-semibold text-white">
            No stocks found
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Try another search or change the selected filters.
          </p>
        </div>
      )}

      {filteredStocks.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1422] p-4">
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-[#0c1422] p-4">
        <p className="text-xs leading-6 text-slate-500">
          Source: {summary?.source || "NSE and BSE Bhavcopy"} · Date:{" "}
          {summary?.date || "Unavailable"}. Prices and percentage
          changes are end-of-day data, not live market prices.
          Tiles are equally sized because market capitalization data
          is not connected. Equity filtering is preliminary and should
          be validated against official exchange classifications.
          Company logos are provided by a third-party logo directory.
        </p>
      </div>
    </section>
  );
}
