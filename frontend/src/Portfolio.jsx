
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthConfig = () => {
  const token = sessionStorage.getItem("stocksense_token");

  return {
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeout: 15000
  };
};

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const config = getAuthConfig();

      if (!config.headers.Authorization || config.headers.Authorization === "Bearer null") {
        throw new Error("Please login again to access your portfolio.");
      }

      const response = await axios.get(
        `${API_URL}/api/portfolio`,
        config
      );

      const items = response.data?.holdings || [];

      setHoldings(items);

      const results = await Promise.allSettled(
        items.map(async (holding) => {
          const response = await axios.get(
            `${API_URL}/api/stocks/prices`,
            {
              params: {
                symbol: holding.symbol,
                period: "1D"
              },
              timeout: 30000
            }
          );

          const data = response.data?.data?.data;

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Price unavailable");
          }

          const currentPrice = Number(data[data.length - 1].price);

          if (!Number.isFinite(currentPrice)) {
            throw new Error("Invalid price data");
          }

          return {
            symbol: holding.symbol,
            price: currentPrice
          };
        })
      );

      const priceMap = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          priceMap[result.value.symbol] = result.value.price;
        }
      });

      setPrices(priceMap);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please logout and login again.");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load portfolio."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const addHolding = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const stock = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    const price = Number(averagePrice);

    if (!/^[A-Z0-9&.-]{1,30}$/.test(stock)) {
      setError("Enter a valid stock symbol.");
      return;
    }

    if (
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError("Enter valid quantity and purchase price.");
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        `${API_URL}/api/portfolio`,
        {
          symbol: stock,
          quantity: qty,
          averagePrice: price
        },
        getAuthConfig()
      );

      setSymbol("");
      setQuantity("");
      setAveragePrice("");
      setMessage("Stock added to your portfolio.");

      await fetchPortfolio();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to add stock."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const removeHolding = async (stock) => {
    setError("");
    setMessage("");

    try {
      await axios.delete(
        `${API_URL}/api/portfolio/${encodeURIComponent(stock)}`,
        getAuthConfig()
      );

      setMessage(`${stock} removed from portfolio.`);

      await fetchPortfolio();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to remove stock."
        );
      }
    }
  };

  const invested = holdings.reduce(
    (total, item) =>
      total + Number(item.quantity) * Number(item.averagePrice),
    0
  );

  const currentValue = holdings.reduce(
    (total, item) => {
      const currentPrice = prices[item.symbol] ?? Number(item.averagePrice);

      return total + Number(item.quantity) * currentPrice;
    },
    0
  );

  const profitLoss = currentValue - invested;

  const profitPercentage = invested > 0
    ? (profitLoss / invested) * 100
    : 0;

  const money = (value) =>
    `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="text-blue-400" size={23} />
            <h2 className="text-xl font-bold">My Portfolio</h2>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Track your virtual stock investments
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPortfolio}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Portfolio Value</p>
          <h3 className="mt-3 text-2xl font-bold">
            {money(currentValue)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Invested Amount</p>
          <h3 className="mt-3 text-2xl font-bold">
            {money(invested)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Profit / Loss</p>

          <div
            className={`mt-3 flex items-center gap-2 text-2xl font-bold ${
              profitLoss >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {profitLoss >= 0
              ? <TrendingUp size={22} />
              : <TrendingDown size={22} />
            }

            {money(profitLoss)}
          </div>

          <p className="mt-2 text-xs text-slate-400">
            {profitPercentage.toFixed(2)}% return
          </p>
        </div>

      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 font-semibold">Add Stock Holding</h3>

        <form
          onSubmit={addHolding}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="Stock symbol e.g. RELIANCE"
            className="min-w-0 rounded-lg border border-slate-700 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
            required
          />

          <input
            type="number"
            min="0.000001"
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantity"
            className="min-w-0 rounded-lg border border-slate-700 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
            required
          />

          <input
            type="number"
            min="0.01"
            step="any"
            value={averagePrice}
            onChange={(event) => setAveragePrice(event.target.value)}
            placeholder="Purchase price (₹)"
            className="min-w-0 rounded-lg border border-slate-700 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={17} />
            {saving ? "Adding..." : "Add Holding"}
          </button>
        </form>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
          {message}
        </p>
      )}

      <div>
        <h3 className="mb-4 font-semibold">Your Holdings</h3>

        {holdings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
            <Wallet
              size={35}
              className="mx-auto mb-3 text-slate-500"
            />

            <p className="font-medium">No holdings yet</p>

            <p className="mt-2 text-sm text-slate-500">
              Add your first stock to start tracking your portfolio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <th className="px-3 py-4">Stock</th>
                  <th className="px-3 py-4 text-right">Quantity</th>
                  <th className="px-3 py-4 text-right">Avg. Price</th>
                  <th className="px-3 py-4 text-right">Current Price</th>
                  <th className="px-3 py-4 text-right">P&L</th>
                  <th className="px-3 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {holdings.map((item) => {
                  const hasPrice = prices[item.symbol] !== undefined;

                  const currentPrice = hasPrice
                    ? prices[item.symbol]
                    : Number(item.averagePrice);

                  const pnl =
                    (currentPrice - Number(item.averagePrice)) *
                    Number(item.quantity);

                  return (
                    <tr
                      key={item.symbol}
                      className="border-b border-slate-800"
                    >
                      <td className="px-3 py-4 font-semibold">
                        {item.symbol}
                      </td>

                      <td className="px-3 py-4 text-right">
                        {item.quantity}
                      </td>

                      <td className="px-3 py-4 text-right">
                        {money(item.averagePrice)}
                      </td>

                      <td className="px-3 py-4 text-right">
                        {hasPrice
                          ? money(currentPrice)
                          : "Unavailable"}
                      </td>

                      <td
                        className={`px-3 py-4 text-right font-semibold ${
                          !hasPrice
                            ? "text-slate-500"
                            : pnl >= 0
                              ? "text-green-400"
                              : "text-red-400"
                        }`}
                      >
                        {hasPrice ? money(pnl) : "—"}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeHolding(item.symbol)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`Remove ${item.symbol}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Paper portfolio for educational purposes. Current prices use
        Yahoo Finance historical data and may be delayed. Unavailable
        prices are excluded from individual P&L calculations. This is
        not a real brokerage account.
      </p>

    </section>
  );
}

export default Portfolio;
