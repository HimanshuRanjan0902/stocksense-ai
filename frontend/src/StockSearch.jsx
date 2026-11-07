
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, X, Loader2, TrendingUp } from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function StockSearch({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [exchange, setExchange] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError("");

        const [nseResponse, bseResponse] = await Promise.all([
          axios.get(`${API}/api/stocks/list?exchange=nse`),
          axios.get(`${API}/api/stocks/list?exchange=bse`)
        ]);

        const nseStocks = nseResponse.data?.data?.stocks || [];
        const bseStocks = bseResponse.data?.data?.stocks || [];

        const combined = [...nseStocks, ...bseStocks]
          .filter((stock) => {
            const isin = String(stock.isin || "").toUpperCase();
            const name = String(stock.name || "").toUpperCase();

            return (
              stock.symbol &&
              !isin.startsWith("INF") &&
              !name.includes("MUTUAL FUND")
            );
          })
          .map((stock) => ({
            ...stock,
            symbol: String(stock.symbol).trim(),
            name: String(stock.name || stock.symbol).trim()
          }));

        const uniqueStocks = Array.from(
          new Map(
            combined.map((stock) => [
              `${stock.exchange}-${stock.symbol}`,
              stock
            ])
          ).values()
        );

        if (active) {
          setStocks(uniqueStocks);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load stock database. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStocks();

    return () => {
      active = false;
    };
  }, []);

  const filteredStocks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stocks
      .filter((stock) => {
        const matchesExchange =
          exchange === "ALL" || stock.exchange === exchange;

        const matchesSearch =
          !query ||
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query);

        return matchesExchange && matchesSearch;
      })
      .slice(0, 30);
  }, [stocks, search, exchange]);

  const selectStock = (stock) => {
    onSelectStock?.(stock.symbol, stock);
    setSearch("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search any NSE or BSE stock..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-white outline-none focus:border-blue-500"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["ALL", "NSE", "BSE"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setExchange(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                exchange === item
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400">
          {loading ? "Loading stocks..." : `${stocks.length} securities loaded`}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            Loading NSE and BSE stocks...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 block w-full text-sm text-blue-400"
            >
              Reload page
            </button>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No matching stocks found.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {filteredStocks.map((stock) => (
              <button
                key={`${stock.exchange}-${stock.symbol}`}
                type="button"
                onClick={() => selectStock(stock)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <TrendingUp size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {stock.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stock.symbol}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-xs text-gray-300">
                  {stock.exchange}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && filteredStocks.length > 0 && (
          <div className="border-t border-white/10 p-3 text-center text-xs text-gray-500">
            Showing up to 30 matching stocks
          </div>
        )}
      </div>
    </div>
  );
}

export default StockSearch;
