
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search
} from "lucide-react";
import stockList from "./stockList.js";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const getAuthConfig = () => {
  const token = sessionStorage.getItem("stocksense_token");

  return {
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeout: 15000
  };
};

function MarketWatch({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState("");
  const [error, setError] = useState("");

  const filteredStocks = newSymbol.trim()
    ? stockList
        .filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(newSymbol.trim().toLowerCase()) ||
            stock.name.toLowerCase().includes(newSymbol.trim().toLowerCase())
        )
        .slice(0, 8)
    : [];

  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/watchlist`,
        getAuthConfig()
      );

      const symbols = response.data?.symbols;

      if (!Array.isArray(symbols)) {
        throw new Error("Invalid watchlist response");
      }

      setStocks(symbols);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load watchlist"
      );
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    if (stocks.length === 0) {
      setStockData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.allSettled(
        stocks.map(async (symbol) => {
          const response = await axios.get(
            `${API_URL}/api/stocks/prices`,
            {
              params: {
                symbol,
                period: "1D"
              },
              timeout: 30000
            }
          );

          const prices = response.data?.data?.data;

          if (!Array.isArray(prices) || prices.length === 0) {
            throw new Error("No price data");
          }

          const firstPrice = Number(prices[0].price);
          const latestPrice = Number(
            prices[prices.length - 1].price
          );

          if (
            !Number.isFinite(firstPrice) ||
            !Number.isFinite(latestPrice)
          ) {
            throw new Error("Invalid price data");
          }

          const change = latestPrice - firstPrice;
          const changePercent = firstPrice
            ? (change / firstPrice) * 100
            : 0;

          return {
            symbol,
            price: latestPrice,
            change,
            changePercent
          };
        })
      );

      const successfulResults = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      setStockData(successfulResults);

      if (successfulResults.length === 0) {
        setError("Unable to fetch stock prices. Check your backend.");
      } else if (successfulResults.length < stocks.length) {
        setError("Some stock prices could not be loaded.");
      } else {
        setError("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to fetch stock prices"
      );
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    if (watchlistLoading) return;

    fetchStocks();

    const interval = setInterval(fetchStocks, 60000);

    return () => clearInterval(interval);
  }, [fetchStocks, watchlistLoading]);

  const addStock = async (event) => {
    event.preventDefault();

    const input = newSymbol.trim();

    const matchedStock = stockList.find(
      (stock) =>
        stock.symbol.toLowerCase() === input.toLowerCase() ||
        stock.name.toLowerCase() === input.toLowerCase()
    );

    const symbol = (matchedStock?.symbol || input).toUpperCase();

    if (!symbol || !/^[A-Z0-9&.-]{1,30}$/.test(symbol)) {
      setError("Please enter a valid NSE stock symbol.");
      return;
    }

    if (stocks.includes(symbol)) {
      setError("Stock already exists in your watchlist.");
      return;
    }

    setSaving(true);
    setError("");
    setShowSuggestions(false);

    try {
      const response = await axios.post(
        `${API_URL}/api/watchlist`,
        { symbol },
        getAuthConfig()
      );

      setStocks(response.data.symbols || []);
      setNewSymbol("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to add stock"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeStock = async (symbol) => {
    setRemovingSymbol(symbol);
    setError("");

    try {
      const response = await axios.delete(
        `${API_URL}/api/watchlist/${encodeURIComponent(symbol)}`,
        getAuthConfig()
      );

      setStocks(response.data.symbols || []);

      setStockData((previous) =>
        previous.filter((stock) => stock.symbol !== symbol)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to remove stock"
      );
    } finally {
      setRemovingSymbol("");
    }
  };

  const selectStock = (stock) => {
    setNewSymbol(stock.symbol);
    setShowSuggestions(false);
  };

  const handleStockClick = (symbol) => {
    onSelectStock?.(symbol);
  };

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Market Watch</h2>
          <p className="mt-1 text-sm text-slate-400">
            Track your favourite NSE stocks
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStocks}
          disabled={loading || watchlistLoading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <form onSubmit={addStock} className="mb-5 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-blue-500">
            <Search size={18} className="text-slate-400" />

            <input
              value={newSymbol}
              onChange={(event) => {
                setNewSymbol(event.target.value);
                setShowSuggestions(true);
                setError("");
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder="Search company or stock symbol..."
              disabled={saving || watchlistLoading}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-50"
            />
          </div>

          {showSuggestions && filteredStocks.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-[#172033] shadow-xl">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectStock(stock)}
                  className="flex w-full items-center justify-between border-b border-slate-700/60 px-4 py-3 text-left transition last:border-0 hover:bg-slate-700/60"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {stock.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      NSE: {stock.symbol}
                    </span>
                  </span>

                  <Plus size={17} className="text-blue-400" />
                </button>
              ))}
            </div>
          )}

          {showSuggestions &&
            newSymbol.trim() &&
            filteredStocks.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-700 bg-[#172033] p-4 text-sm text-slate-400 shadow-xl">
                No matching company found in the starter list. You can still add a symbol manually.
              </div>
            )}
        </div>

        <button
          type="submit"
          disabled={saving || watchlistLoading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <th className="px-3 py-4">Stock</th>
              <th className="px-3 py-4 text-right">Price (₹)</th>
              <th className="px-3 py-4 text-right">Session Change</th>
              <th className="px-3 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {watchlistLoading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-3 py-8 text-center text-sm text-slate-400"
                >
                  Loading your watchlist...
                </td>
              </tr>
            ) : (
              <>
                {stocks.map((symbol) => {
                  const stock = stockData.find(
                    (item) => item.symbol === symbol
                  );

                  const company = stockList.find(
                    (item) => item.symbol === symbol
                  );

                  return (
                    <tr
                      key={symbol}
                      className="border-b border-slate-800 transition hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => handleStockClick(symbol)}
                          className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                          title={`View ${symbol} details`}
                        >
                          {symbol}
                        </button>

                        <p className="text-xs font-normal text-slate-500">
                          {company?.name || "NSE"}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-right font-medium">
                        {stock
                          ? stock.price.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          : loading
                            ? "Loading..."
                            : "—"}
                      </td>

                      <td className="px-3 py-4 text-right">
                        {stock ? (
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${
                              stock.change >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {stock.change >= 0 ? (
                              <TrendingUp size={15} />
                            ) : (
                              <TrendingDown size={15} />
                            )}

                            {stock.change >= 0 ? "+" : ""}
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeStock(symbol)}
                          disabled={removingSymbol === symbol}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          aria-label={`Remove ${symbol}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {stocks.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-3 py-8 text-center text-sm text-slate-500"
                    >
                      Your watchlist is empty. Search and add a stock to get started.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Prices are sourced from Yahoo Finance and may be delayed.
        Session change compares the first and latest available intraday
        prices, not the previous day's closing price. Your watchlist
        is saved to your account. Click a stock symbol to view its details
        and advanced chart.
      </p>
    </section>
  );
}

export default MarketWatch;
