
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialStocks = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN"
];

function MarketWatch() {
  const [stocks, setStocks] = useState(initialStocks);
  const [stockData, setStockData] = useState([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStocks = useCallback(async () => {
    if (stocks.length === 0) {
      setStockData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

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
          const latestPrice = Number(prices[prices.length - 1].price);

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
        .filter(result => result.status === "fulfilled")
        .map(result => result.value);

      setStockData(successfulResults);

      if (successfulResults.length === 0) {
        setError("Unable to fetch stock prices. Check your backend.");
      } else if (successfulResults.length < stocks.length) {
        setError("Some stock prices could not be loaded.");
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
    fetchStocks();

    const interval = setInterval(fetchStocks, 60000);

    return () => clearInterval(interval);
  }, [fetchStocks]);

  const addStock = () => {
    const symbol = newSymbol.trim().toUpperCase();

    if (!symbol || !/^[A-Z0-9&.-]{1,30}$/.test(symbol)) {
      setError("Please enter a valid stock symbol.");
      return;
    }

    if (stocks.includes(symbol)) {
      setError("Stock already exists in your watchlist.");
      return;
    }

    setStocks(previous => [...previous, symbol]);
    setNewSymbol("");
    setError("");
  };

  const removeStock = (symbol) => {
    setStocks(previous => previous.filter(stock => stock !== symbol));

    setStockData(previous =>
      previous.filter(stock => stock.symbol !== symbol)
    );

    setError("");
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
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          addStock();
        }}
        className="mb-5 flex gap-2"
      >
        <input
          value={newSymbol}
          onChange={event => setNewSymbol(event.target.value)}
          placeholder="Enter stock symbol (e.g. WIPRO)"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add
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
            {stocks.map(symbol => {
              const stock = stockData.find(
                item => item.symbol === symbol
              );

              return (
                <tr
                  key={symbol}
                  className="border-b border-slate-800 transition hover:bg-slate-800/40"
                >
                  <td className="px-3 py-4 font-semibold">
                    {symbol}
                    <p className="text-xs font-normal text-slate-500">
                      NSE
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
                        {stock.change >= 0
                          ? <TrendingUp size={15} />
                          : <TrendingDown size={15} />}

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
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
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
                  Your watchlist is empty. Add a stock to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Prices are sourced from Yahoo Finance and may be delayed.
        Session change compares the first and latest available intraday
        prices, not the previous day's closing price. Watchlist changes
        are currently stored in component state and reset on page reload.
      </p>
    </section>
  );
}

export default MarketWatch;
