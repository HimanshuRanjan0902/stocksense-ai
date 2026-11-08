import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";

import {

  Wallet,

  TrendingUp,

  TrendingDown,

  RefreshCw,

  ShoppingCart,

  History,

  AlertCircle,

  CheckCircle2,

  Activity,

  PieChart as PieChartIcon

} from "lucide-react";

import {

  ResponsiveContainer,

  PieChart,

  Pie,

  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from "recharts";



const API_URL = (

  import.meta.env.VITE_API_URL || "http://localhost:5000"

).replace(/\/$/, "");



const formatINR = (value) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 2

  }).format(Number(value || 0));



const formatPercent = (value) =>

  `${Number(value || 0).toFixed(2)}%`;



const formatDate = (value) => {

  if (!value) return "—";



  return new Date(value).toLocaleString("en-IN", {

    dateStyle: "medium",

    timeStyle: "short"

  });

};



const getErrorMessage = (error) =>

  error.response?.data?.message ||

  error.response?.data?.error ||

  error.message ||

  "Something went wrong";



export default function PaperTrading({ token }) {

  const [portfolio, setPortfolio] = useState(null);

  const [trades, setTrades] = useState([]);
  const [historySnapshots, setHistorySnapshots] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [trading, setTrading] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [quoteWarning, setQuoteWarning] = useState("");



  const [form, setForm] = useState({

    symbol: "RELIANCE",

    exchange: "NSE",

    side: "BUY",

    quantity: "1"

  });



  const authHeaders = useMemo(

    () => ({

      Authorization: `Bearer ${token}`

    }),

    [token]

  );



  const fetchData = useCallback(

    async (showRefresh = false) => {

      if (!token) {

        setError("Please log in to use Paper Trading.");

        setLoading(false);

        return;

      }



      if (showRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }



      setError("");



      try {

        const [portfolioResponse, historyResponse, chartResponse] =
          await Promise.all([
            axios.get(`${API_URL}/api/paper-trading/portfolio`, {
              headers: authHeaders
            }),
            axios.get(`${API_URL}/api/paper-trading/history`, {
              headers: authHeaders
            }),
            axios.get(`${API_URL}/api/paper-trading/history-chart`, {
              headers: authHeaders
            })
          ]);



        setPortfolio(

          portfolioResponse.data?.portfolio ||

          portfolioResponse.data?.data ||

          null

        );



        const historyData = historyResponse.data;



        setTrades(

          Array.isArray(historyData?.trades)

            ? historyData.trades

            : Array.isArray(historyData?.data?.trades)

              ? historyData.data.trades

              : []

        );

        setHistorySnapshots(
          Array.isArray(chartResponse.data?.data)
            ? chartResponse.data.data
            : []
        );

      } catch (err) {

        setError(getErrorMessage(err));

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    [token, authHeaders]

  );



  useEffect(() => {

    fetchData();

  }, [fetchData]);



  const handleInputChange = (event) => {

    const { name, value } = event.target;



    setForm((previous) => ({

      ...previous,

      [name]: value

    }));

  };



  const handleTrade = async (event) => {

    event.preventDefault();



    setError("");

    setMessage("");

    setQuoteWarning("");



    const quantity = Number(form.quantity);

    const symbol = form.symbol.trim().toUpperCase();



    if (!symbol) {

      setError("Please enter a stock symbol.");

      return;

    }



    if (!Number.isSafeInteger(quantity) || quantity <= 0) {

      setError("Quantity must be a positive whole number.");

      return;

    }



    setTrading(true);



    try {

      const response = await axios.post(

        `${API_URL}/api/paper-trading/trade`,

        {

          symbol,

          exchange: form.exchange,

          side: form.side,

          quantity,

          orderId: `paper-${crypto.randomUUID()}`

        },

        {

          headers: authHeaders

        }

      );



      setMessage(

        `${form.side} order for ${quantity} ${symbol} share(s) executed successfully.`

      );



      if (

        response.data?.warning ||

        response.data?.quote?.isStale ||

        response.data?.quote?.isLive === false

      ) {

        setQuoteWarning(

          response.data?.warning ||

          "The quote may be delayed or stale. This is a simulated trade, not a live broker execution."

        );

      }



      await fetchData(true);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setTrading(false);

    }

  };



  const holdings = portfolio?.holdings || [];

  const valuation = portfolio?.valuation || {};



  const availableCash = Number(portfolio?.availableCash || 0);

  const initialBalance = Number(portfolio?.initialBalance || 500000);

  const holdingsValue = Number(valuation.holdingsValue || 0);

  const totalPortfolioValue = Number(

    valuation.totalPortfolioValue ?? availableCash + holdingsValue

  );

  const overallPnL = Number(valuation.overallPnL || 0);

  const unrealizedPnL = Number(valuation.unrealizedPnL || 0);

  const realizedPnL = Number(

    valuation.realizedPnL ?? portfolio?.realizedPnL ?? 0

  );

  const overallPnLPercent = Number(valuation.overallPnLPercent || 0);



  const hasUnavailableQuotes = Boolean(

    valuation.hasUnavailableQuotes ||

    holdings.some((holding) => !holding.quoteAvailable)

  );



  const allocationData = [

    {

      name: "Available Cash",

      value: availableCash

    },

    {

      name: "Holdings",

      value: holdingsValue

    }

  ].filter((item) => item.value > 0);



  const pnlPositive = overallPnL >= 0;



  if (loading) {

    return (

      <div className="flex min-h-[350px] items-center justify-center text-slate-400">

        <RefreshCw className="mr-3 animate-spin" size={20} />

        Loading paper trading portfolio...

      </div>

    );

  }



  return (

    <div className="space-y-6 text-slate-100">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <Activity className="text-cyan-400" size={24} />

            <h2 className="text-2xl font-bold">Paper Trading</h2>

          </div>

          <p className="mt-1 text-sm text-slate-400">

            Practice stock trading with a virtual balance of ₹5,00,000.

          </p>

        </div>



        <button

          type="button"

          onClick={() => fetchData(true)}

          disabled={refreshing}

          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800 disabled:opacity-50"

        >

          <RefreshCw

            size={16}

            className={refreshing ? "animate-spin" : ""}

          />

          Refresh

        </button>

      </div>



      {error && (

        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">

          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span>{error}</span>

        </div>

      )}



      {message && (

        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">

          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

          <span>{message}</span>

        </div>

      )}



      {quoteWarning && (

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">

          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span>{quoteWarning}</span>

        </div>

      )}



      {hasUnavailableQuotes && (

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">

          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span>

            Some holdings do not have an available quote. Their market value

            and unrealized P&L may be excluded from the displayed totals.

          </span>

        </div>

      )}



      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <MetricCard

          title="Total Portfolio Value"

          value={formatINR(totalPortfolioValue)}

          icon={<Wallet size={20} />}

          subtitle="Cash + available quoted holdings"

        />



        <MetricCard

          title="Available Cash"

          value={formatINR(availableCash)}

          icon={<Wallet size={20} />}

          subtitle="Virtual buying power"

        />



        <MetricCard

          title="Holdings Market Value"

          value={formatINR(holdingsValue)}

          icon={<PieChartIcon size={20} />}

          subtitle={`${holdings.length} stock(s) held`}

        />



        <MetricCard

          title="Overall P&L"

          value={formatINR(overallPnL)}

          icon={

            pnlPositive

              ? <TrendingUp size={20} />

              : <TrendingDown size={20} />

          }

          subtitle={formatPercent(overallPnLPercent)}

          positive={pnlPositive}

        />



        <MetricCard

          title="Unrealized P&L"

          value={formatINR(unrealizedPnL)}

          icon={<Activity size={20} />}

          subtitle="Open holdings"

          positive={unrealizedPnL >= 0}

        />



        <MetricCard

          title="Realized P&L"

          value={formatINR(realizedPnL)}

          icon={<CheckCircle2 size={20} />}

          subtitle="Completed simulated sells"

          positive={realizedPnL >= 0}

        />

      </div>



      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Portfolio Growth</h3>
            <p className="mt-1 text-sm text-slate-400">
              Historical value of your virtual portfolio
            </p>
          </div>
          <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400">
            Starting balance: {formatINR(initialBalance)}
          </span>
        </div>

        {historySnapshots.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historySnapshots}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis
                  dataKey="snapshotDate"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value) => [formatINR(value), "Portfolio Value"]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <ReferenceLine
                  y={initialBalance}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{
                    value: "Starting Balance",
                    fill: "#94a3b8",
                    fontSize: 11
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalPortfolioValue"
                  name="Portfolio Value"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#06b6d4" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <Activity size={32} className="mb-3 text-slate-600" />
            <p className="font-medium text-slate-300">
              No portfolio growth data yet
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Your chart will appear when the backend records portfolio
              snapshots using an available, non-stale stock quote.
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">

          <div className="mb-5 flex items-center gap-2">

            <ShoppingCart className="text-cyan-400" size={20} />

            <h3 className="text-lg font-semibold">Place Paper Trade</h3>

          </div>



          <form onSubmit={handleTrade} className="space-y-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm text-slate-400">

                  Stock Symbol

                </label>

                <input

                  type="text"

                  name="symbol"

                  value={form.symbol}

                  onChange={handleInputChange}

                  placeholder="e.g. RELIANCE"

                  required

                  maxLength={30}

                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"

                />

              </div>



              <div>

                <label className="mb-2 block text-sm text-slate-400">

                  Exchange

                </label>

                <select

                  name="exchange"

                  value={form.exchange}

                  onChange={handleInputChange}

                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"

                >

                  <option value="NSE">NSE</option>

                  <option value="BSE">BSE</option>

                </select>

              </div>



              <div>

                <label className="mb-2 block text-sm text-slate-400">

                  Trade Type

                </label>

                <select

                  name="side"

                  value={form.side}

                  onChange={handleInputChange}

                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"

                >

                  <option value="BUY">BUY</option>

                  <option value="SELL">SELL</option>

                </select>

              </div>



              <div>

                <label className="mb-2 block text-sm text-slate-400">

                  Quantity

                </label>

                <input

                  type="number"

                  name="quantity"

                  value={form.quantity}

                  onChange={handleInputChange}

                  min="1"

                  step="1"

                  required

                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"

                />

              </div>

            </div>



            <button

              type="submit"

              disabled={trading}

              className={`w-full rounded-lg px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${

                form.side === "BUY"

                  ? "bg-emerald-500 text-white hover:bg-emerald-600"

                  : "bg-red-500 text-white hover:bg-red-600"

              }`}

            >

              {trading

                ? "Processing simulated trade..."

                : `Simulate ${form.side}`}

            </button>



            <p className="text-xs text-slate-500">

              Execution price is fetched by the backend. No real broker order

              is placed.

            </p>

          </form>

        </section>



        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="mb-4 flex items-center gap-2">

            <PieChartIcon className="text-cyan-400" size={20} />

            <h3 className="text-lg font-semibold">Portfolio Allocation</h3>

          </div>



          {allocationData.length > 0 ? (

            <>

              <div className="h-52">

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie

                      data={allocationData}

                      dataKey="value"

                      nameKey="name"

                      cx="50%"

                      cy="50%"

                      innerRadius={55}

                      outerRadius={80}

                      paddingAngle={4}

                    >

                      {allocationData.map((entry, index) => (

                        <Cell

                          key={entry.name}

                          fill={index === 0 ? "#06b6d4" : "#8b5cf6"}

                        />

                      ))}

                    </Pie>

                    <Tooltip

                      formatter={(value) => formatINR(value)}

                      contentStyle={{

                        background: "#0f172a",

                        border: "1px solid #334155",

                        borderRadius: "8px",

                        color: "#fff"

                      }}

                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>



              <div className="space-y-3">

                {allocationData.map((item, index) => (

                  <div

                    key={item.name}

                    className="flex items-center justify-between text-sm"

                  >

                    <div className="flex items-center gap-2 text-slate-400">

                      <span

                        className="h-3 w-3 rounded-full"

                        style={{

                          backgroundColor:

                            index === 0 ? "#06b6d4" : "#8b5cf6"

                        }}

                      />

                      {item.name}

                    </div>

                    <span className="font-medium text-white">

                      {formatINR(item.value)}

                    </span>

                  </div>

                ))}

              </div>

            </>

          ) : (

            <p className="py-16 text-center text-sm text-slate-500">

              No portfolio allocation data yet.

            </p>

          )}

        </section>

      </div>



      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">

        <div className="flex items-center justify-between border-b border-slate-800 p-5">

          <h3 className="text-lg font-semibold">Your Holdings</h3>

          <span className="text-sm text-slate-400">

            {holdings.length} stock(s)

          </span>

        </div>



        {holdings.length === 0 ? (

          <div className="p-10 text-center text-slate-500">

            No holdings yet. Place your first simulated BUY trade.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-slate-950/70 text-slate-400">

                <tr>

                  <th className="px-5 py-4">Stock</th>

                  <th className="px-5 py-4">Exchange</th>

                  <th className="px-5 py-4">Quantity</th>

                  <th className="px-5 py-4">Average Price</th>

                  <th className="px-5 py-4">Current Price</th>

                  <th className="px-5 py-4">Market Value</th>

                  <th className="px-5 py-4">Unrealized P&L</th>

                  <th className="px-5 py-4">Quote Status</th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-800">

                {holdings.map((holding, index) => {

                  const pnl = Number(holding.unrealizedPnL || 0);

                  const quote = holding.quote || {};



                  return (

                    <tr

                      key={`${holding.symbol}-${holding.exchange}-${index}`}

                      className="hover:bg-slate-800/40"

                    >

                      <td className="px-5 py-4 font-semibold text-white">

                        {holding.symbol}

                      </td>

                      <td className="px-5 py-4 text-slate-300">

                        {holding.exchange}

                      </td>

                      <td className="px-5 py-4 text-slate-300">

                        {holding.quantity}

                      </td>

                      <td className="px-5 py-4 text-slate-300">

                        {formatINR(holding.averagePrice)}

                      </td>

                      <td className="px-5 py-4 text-slate-300">

                        {holding.quoteAvailable

                          ? formatINR(holding.currentPrice)

                          : "Unavailable"}

                      </td>

                      <td className="px-5 py-4 text-slate-300">

                        {holding.quoteAvailable

                          ? formatINR(holding.marketValue)

                          : "Unavailable"}

                      </td>

                      <td

                        className={`px-5 py-4 font-medium ${

                          pnl >= 0 ? "text-emerald-400" : "text-red-400"

                        }`}

                      >

                        {holding.quoteAvailable

                          ? formatINR(pnl)

                          : "Unavailable"}

                      </td>

                      <td className="px-5 py-4">

                        {!holding.quoteAvailable ? (

                          <span className="text-amber-400">Unavailable</span>

                        ) : quote.isStale || quote.isLive === false ? (

                          <span className="text-amber-400">

                            Delayed / Stale

                          </span>

                        ) : (

                          <span className="text-emerald-400">Live</span>

                        )}

                        {quote.timestamp && (

                          <p className="mt-1 text-xs text-slate-500">

                            {formatDate(quote.timestamp)}

                          </p>

                        )}

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </section>



      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">

        <div className="flex items-center gap-2 border-b border-slate-800 p-5">

          <History className="text-cyan-400" size={20} />

          <h3 className="text-lg font-semibold">Transaction History</h3>

        </div>



        {trades.length === 0 ? (

          <div className="p-10 text-center text-slate-500">

            No transactions yet.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-left text-sm">

              <thead className="bg-slate-950/70 text-slate-400">

                <tr>

                  <th className="px-5 py-4">Date</th>

                  <th className="px-5 py-4">Stock</th>

                  <th className="px-5 py-4">Exchange</th>

                  <th className="px-5 py-4">Type</th>

                  <th className="px-5 py-4">Quantity</th>

                  <th className="px-5 py-4">Execution Price</th>

                  <th className="px-5 py-4">Net Value</th>

                  <th className="px-5 py-4">Status</th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-800">

                {trades.map((trade, index) => (

                  <tr

                    key={trade._id || trade.orderId || index}

                    className="hover:bg-slate-800/40"

                  >

                    <td className="px-5 py-4 text-slate-400">

                      {formatDate(trade.createdAt)}

                    </td>

                    <td className="px-5 py-4 font-semibold text-white">

                      {trade.symbol}

                    </td>

                    <td className="px-5 py-4 text-slate-300">

                      {trade.exchange}

                    </td>

                    <td

                      className={`px-5 py-4 font-semibold ${

                        trade.side === "BUY"

                          ? "text-emerald-400"

                          : "text-red-400"

                      }`}

                    >

                      {trade.side}

                    </td>

                    <td className="px-5 py-4 text-slate-300">

                      {trade.quantity}

                    </td>

                    <td className="px-5 py-4 text-slate-300">

                      {formatINR(trade.executionPrice)}

                    </td>

                    <td className="px-5 py-4 text-slate-300">

                      {formatINR(trade.netValue)}

                    </td>

                    <td className="px-5 py-4 text-emerald-400">

                      {trade.status || "EXECUTED"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>



      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-400">

        <p className="font-semibold text-amber-300">

          Paper Trading Disclaimer

        </p>

        <p className="mt-1">

          This is a virtual trading simulator. Trades do not reach NSE, BSE,

          Angel One, or any broker. Prices may be delayed or stale. This

          feature is for educational purposes only and is not financial advice.

        </p>

      </div>



      <div className="text-xs text-slate-500">

        Starting virtual balance: {formatINR(initialBalance)}

      </div>

    </div>

  );

}



function MetricCard({ title, value, icon, subtitle, positive }) {

  const pnlCard = typeof positive === "boolean";



  return (

    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">{title}</p>

        <span

          className={

            pnlCard

              ? positive

                ? "text-emerald-400"

                : "text-red-400"

              : "text-cyan-400"

          }

        >

          {icon}

        </span>

      </div>



      <p

        className={`mt-3 text-2xl font-bold ${

          pnlCard

            ? positive

              ? "text-emerald-400"

              : "text-red-400"

            : "text-white"

        }`}

      >

        {value}

      </p>



      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

    </div>

  );

}