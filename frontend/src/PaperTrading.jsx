

import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";

import { motion } from "framer-motion";

import {

  Activity,

  ArrowDownRight,

  ArrowUpRight,

  BarChart3,

  BriefcaseBusiness,

  Clock3,

  Coins,

  RefreshCw,

  ShieldCheck,

  Sparkles,

  TrendingDown,

  TrendingUp,

  Wallet,

  AlertTriangle,

  CircleHelp,

  X,

  CheckCircle2,

  Zap,

  Search,

  ChevronLeft,

  ChevronRight,
  BookOpen,
  Pencil,
  Save,
  XCircle,

} from "lucide-react";

import {

  Area,

  AreaChart,

  CartesianGrid,

  Cell,

  Pie,

  PieChart,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";



const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PAGE_SIZE = 8;



const currency = (value) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 2,

  }).format(Number(value) || 0);



const number = (value) =>

  new Intl.NumberFormat("en-IN", {

    maximumFractionDigits: 2,

  }).format(Number(value) || 0);



const percent = (value) =>

  `${Number(value || 0) >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;



const dateTime = (value) => {

  if (!value) return "—";

  const date = new Date(value);



  return Number.isNaN(date.getTime())

    ? "—"

    : date.toLocaleString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

      });

};



const getErrorMessage = (error) =>

  error?.response?.data?.message ||

  error?.response?.data?.error ||

  error?.message ||

  "Something went wrong. Please try again.";



const getQuoteStatus = (holding) => {

  const quote = holding?.quote || {};



  if (!holding?.quoteAvailable) {

    return {

      label: "Unavailable",

      tone: "text-red-400",

      dot: "bg-red-400",

    };

  }



  if (quote.isStale === true) {

    return {

      label: "Stale quote",

      tone: "text-amber-400",

      dot: "bg-amber-400",

    };

  }



  if (quote.source === "Angel One SmartAPI") {

    return {

      label: "Angel One · REST LTP",

      tone: "text-cyan-300",

      dot: "bg-cyan-400",

    };

  }



  if (quote.streaming === true && quote.isLive === true) {

    return {

      label: "Live streaming",

      tone: "text-emerald-400",

      dot: "bg-emerald-400",

    };

  }



  if (quote.source) {

    return {

      label: `${quote.source} · REST`,

      tone: "text-slate-300",

      dot: "bg-slate-400",

    };

  }



  return {

    label: "Freshness unknown",

    tone: "text-slate-400",

    dot: "bg-slate-500",

  };

};



function Panel({ children, className = "", delay = 0 }) {

  return (

    <motion.section

      initial={{ opacity: 0, y: 18 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.45, delay }}

      whileHover={{ y: -2 }}

      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]/90 shadow-[0_12px_50px_rgba(0,0,0,0.22)] ${className}`}

    >

      {children}

    </motion.section>

  );

}



function MetricCard({

  title,

  value,

  change,

  icon: Icon,

  color = "cyan",

  subtitle,

}) {

  const positive = Number(change || 0) >= 0;



  const colorMap = {

    cyan: "from-cyan-400/20 to-cyan-400/[0.02] text-cyan-300",

    violet: "from-violet-400/20 to-violet-400/[0.02] text-violet-300",

    emerald: "from-emerald-400/20 to-emerald-400/[0.02] text-emerald-300",

    amber: "from-amber-400/20 to-amber-400/[0.02] text-amber-300",

    rose: "from-rose-400/20 to-rose-400/[0.02] text-rose-300",

    blue: "from-blue-400/20 to-blue-400/[0.02] text-blue-300",

  };



  return (

    <motion.div

      whileHover={{ y: -5, scale: 1.015 }}

      transition={{ type: "spring", stiffness: 260, damping: 18 }}

      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-5"

    >

      <div

        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colorMap[color]}`}

      />

      <div className="relative flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">

            {title}

          </p>

          <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">

            {value}

          </p>

          {subtitle && (

            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

          )}

          {change !== undefined && (

            <p

              className={`mt-2 flex items-center gap-1 text-xs font-semibold ${

                positive ? "text-emerald-400" : "text-rose-400"

              }`}

            >

              {positive ? (

                <ArrowUpRight size={14} />

              ) : (

                <ArrowDownRight size={14} />

              )}

              {percent(change)}

            </p>

          )}

        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">

          <Icon

            size={20}

            className={colorMap[color].split(" ").slice(-1)[0]}

          />

        </div>

      </div>

    </motion.div>

  );

}



function SectionHeading({ icon: Icon, title, subtitle, action }) {

  return (

    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

      <div className="flex items-center gap-3">

        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-2.5 text-cyan-300">

          <Icon size={18} />

        </div>

        <div>

          <h2 className="font-semibold text-white">{title}</h2>

          {subtitle && (

            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>

          )}

        </div>

      </div>

      {action}

    </div>

  );

}



function EmptyState({

  icon: Icon = BriefcaseBusiness,

  title,

  description,

}) {

  return (

    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">

      <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-slate-500">

        <Icon size={26} />

      </div>

      <p className="font-medium text-slate-300">{title}</p>

      <p className="mt-1 max-w-sm text-sm text-slate-500">

        {description}

      </p>

    </div>

  );

}



export default function PaperTrading() {

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

    quantity: "1",

  });

const [tradeSearch, setTradeSearch] = useState("");

const [tradeFilter, setTradeFilter] = useState("ALL");

const [tradeFromDate, setTradeFromDate] = useState("");

const [tradeToDate, setTradeToDate] = useState("");

const [tradePage, setTradePage] = useState(1);
const [performancePeriod, setPerformancePeriod] = useState("DAILY");
const [journalNotes, setJournalNotes] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("stocksense_paper_trade_journal") || "{}");
  } catch {
    return {};
  }
});
const [editingJournalId, setEditingJournalId] = useState(null);
const [journalDraft, setJournalDraft] = useState("");

const getJournalTradeId = (trade) =>
  String(trade._id || trade.orderId || `${trade.symbol}-${trade.createdAt}-${trade.side}`);

const openJournalEditor = (trade) => {
  const id = getJournalTradeId(trade);
  setEditingJournalId(id);
  setJournalDraft(journalNotes[id] || "");
};

const saveJournalNote = (id) => {
  const updated = { ...journalNotes, [id]: journalDraft.trim() };
  if (!journalDraft.trim()) delete updated[id];
  setJournalNotes(updated);
  try {
    localStorage.setItem("stocksense_paper_trade_journal", JSON.stringify(updated));
  } catch {
    setError("Could not save the journal note in this browser.");
  }
  setEditingJournalId(null);
  setJournalDraft("");
};



  const authHeaders = useCallback(() => {

    const token = sessionStorage.getItem("stocksense_token");

    return token ? { Authorization: `Bearer ${token}` } : {};

  }, []);



  const fetchData = useCallback(

    async (showRefresh = false) => {

      if (showRefresh) setRefreshing(true);

      else setLoading(true);



      setError("");



      try {

        const headers = authHeaders();



        const [

          portfolioResponse,

          historyResponse,

          chartResponse,

        ] = await Promise.all([

          axios.get(`${API_URL}/api/paper-trading/portfolio`, {

            headers,

          }),

          axios.get(`${API_URL}/api/paper-trading/history`, {

            headers,

          }),

          axios.get(`${API_URL}/api/paper-trading/history-chart`, {

            headers,

          }),

        ]);



        const portfolioData =

          portfolioResponse.data?.portfolio ||

          portfolioResponse.data?.data?.portfolio ||

          portfolioResponse.data?.data ||

          portfolioResponse.data;



        const historyData =

          historyResponse.data?.data || historyResponse.data;



        const chartData =

          chartResponse.data?.data || chartResponse.data;



        setPortfolio(portfolioData || null);



        setTrades(

          Array.isArray(historyData)

            ? historyData

            : historyData?.trades || []

        );



        setHistorySnapshots(

          Array.isArray(chartData)

            ? chartData

            : chartData?.snapshots || []

        );

      } catch (err) {

        setError(getErrorMessage(err));

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    [authHeaders]

  );



  useEffect(() => {

    fetchData();

  }, [fetchData]);



  const holdings = portfolio?.holdings || [];



  const metrics = useMemo(() => {

    const initialBalance = Number(

      portfolio?.initialBalance ?? 500000

    );



    const availableCash = Number(

      portfolio?.availableCash ?? initialBalance

    );



    const holdingsValue = Number(

      portfolio?.holdingsValue ?? 0

    );



    const totalPortfolioValue = Number(

      portfolio?.totalPortfolioValue ??

        availableCash + holdingsValue

    );



    const realizedPnL = Number(

      portfolio?.realizedPnL ?? 0

    );



    const unrealizedPnL = Number(

      portfolio?.unrealizedPnL ?? 0

    );



    const overallPnL = Number(

      portfolio?.overallPnL ?? realizedPnL + unrealizedPnL

    );



    const overallPnLPercent = Number(

      portfolio?.overallPnLPercent ??

        (initialBalance

          ? (overallPnL / initialBalance) * 100

          : 0)

    );



    return {

      initialBalance,

      availableCash,

      holdingsValue,

      totalPortfolioValue,

      realizedPnL,

      unrealizedPnL,

      overallPnL,

      overallPnLPercent,

    };

  }, [portfolio]);



  const allocationData = useMemo(() => {

    return [

      {

        name: "Available cash",

        value: metrics.availableCash,

      },

      {

        name: "Invested",

        value: metrics.holdingsValue,

      },

    ].filter((item) => item.value > 0);

  }, [metrics]);



  const chartData = useMemo(() => {

    const snapshots = [...historySnapshots]

      .filter(

        (item) =>

          item?.snapshotDate &&

          Number.isFinite(Number(item.totalPortfolioValue))

      )

      .sort(

        (a, b) =>

          new Date(a.snapshotDate) - new Date(b.snapshotDate)

      );



    if (!snapshots.length) {

      return [

        {

          date: "Starting",

          value: metrics.initialBalance,

        },

        {

          date: "Current",

          value: metrics.totalPortfolioValue,

        },

      ];

    }



    return snapshots.map((item) => ({

      date: new Date(item.snapshotDate).toLocaleDateString(

        "en-IN",

        {

          day: "2-digit",

          month: "short",

        }

      ),

      value: Number(item.totalPortfolioValue),

    }));

  }, [

    historySnapshots,

    metrics.initialBalance,

    metrics.totalPortfolioValue,

  ]);



  const pnlAnalytics = useMemo(() => {
    const closedTrades = trades
      .map((trade) => ({
        ...trade,
        realizedPnL: Number(trade.realizedPnL || 0),
        timestamp: new Date(trade.createdAt).getTime(),
      }))
      .filter(
        (trade) =>
          trade.side === "SELL" &&
          Number.isFinite(trade.timestamp) &&
          Number.isFinite(trade.realizedPnL)
      );

    const winningTrades = closedTrades.filter(
      (trade) => trade.realizedPnL > 0
    );
    const losingTrades = closedTrades.filter(
      (trade) => trade.realizedPnL < 0
    );
    const totalRealizedPnL = closedTrades.reduce(
      (total, trade) => total + trade.realizedPnL,
      0
    );
    const winRate = closedTrades.length
      ? (winningTrades.length / closedTrades.length) * 100
      : 0;
    const bestTrade = closedTrades.reduce(
      (best, trade) =>
        !best || trade.realizedPnL > best.realizedPnL ? trade : best,
      null
    );
    const worstTrade = closedTrades.reduce(
      (worst, trade) =>
        !worst || trade.realizedPnL < worst.realizedPnL ? trade : worst,
      null
    );

    const grossProfit = winningTrades.reduce(
      (total, trade) => total + trade.realizedPnL,
      0
    );
    const grossLoss = Math.abs(
      losingTrades.reduce((total, trade) => total + trade.realizedPnL, 0)
    );
    const averageWin = winningTrades.length
      ? grossProfit / winningTrades.length
      : 0;
    const averageLoss = losingTrades.length
      ? grossLoss / losingTrades.length
      : 0;

    let runningEquity = Number(metrics.initialBalance) || 0;
    let peakEquity = runningEquity;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let currentStreak = 0;
    let currentStreakType = "NONE";
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    const chronologicalTrades = [...closedTrades].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    chronologicalTrades.forEach((trade) => {
      runningEquity += trade.realizedPnL;
      peakEquity = Math.max(peakEquity, runningEquity);
      const drawdown = peakEquity - runningEquity;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      const drawdownPercent = peakEquity > 0
        ? (drawdown / peakEquity) * 100
        : 0;
      maxDrawdownPercent = Math.max(maxDrawdownPercent, drawdownPercent);

      const outcome = trade.realizedPnL > 0
        ? "WIN"
        : trade.realizedPnL < 0
          ? "LOSS"
          : "BREAKEVEN";

      if (outcome === "BREAKEVEN") {
        currentStreak = 0;
        currentStreakType = "NONE";
      } else if (outcome === currentStreakType) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
        currentStreakType = outcome;
      }

      if (outcome === "WIN") {
        longestWinStreak = Math.max(longestWinStreak, currentStreak);
      } else if (outcome === "LOSS") {
        longestLossStreak = Math.max(longestLossStreak, currentStreak);
      }
    });

    const dailyTotals = new Map();
    closedTrades.forEach((trade) => {
      const day = new Date(trade.timestamp).toLocaleDateString("en-CA");
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + trade.realizedPnL);
    });

    const dailyData = Array.from(dailyTotals, ([day, value]) => ({
      date: new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value,
      sortDate: day,
    }))
      .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
      .map(({ date, value }) => ({ date, value }));

    return {
      closedCount: closedTrades.length,
      winningCount: winningTrades.length,
      losingCount: losingTrades.length,
      totalRealizedPnL,
      winRate,
      averagePnL: closedTrades.length
        ? totalRealizedPnL / closedTrades.length
        : 0,
      bestTrade,
      worstTrade,
      grossProfit,
      grossLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
      averageWin,
      averageLoss,
      riskRewardRatio: averageLoss > 0 ? averageWin / averageLoss : null,
      maxDrawdown,
      maxDrawdownPercent,
      currentStreak,
      currentStreakType,
      longestWinStreak,
      longestLossStreak,
      dailyData,
    };
  }, [trades, metrics.initialBalance]);

  const performanceAnalytics = useMemo(() => {
    const initialBalance = Number(metrics.initialBalance) || 0;
    const closedTrades = trades
      .filter((trade) => trade.side === "SELL")
      .map((trade) => ({
        timestamp: new Date(trade.createdAt).getTime(),
        realizedPnL: Number(trade.realizedPnL || 0),
      }))
      .filter((trade) => Number.isFinite(trade.timestamp) && Number.isFinite(trade.realizedPnL))
      .sort((a, b) => a.timestamp - b.timestamp);

    const buckets = new Map();
    closedTrades.forEach((trade) => {
      const date = new Date(trade.timestamp);
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let key;
      let label;
      if (performancePeriod === "WEEKLY") {
        const monday = new Date(day);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        label = `Week ${monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
      } else if (performancePeriod === "MONTHLY") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        label = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      }
      const bucket = buckets.get(key) || { key, label, pnl: 0, trades: 0 };
      bucket.pnl += trade.realizedPnL;
      bucket.trades += 1;
      buckets.set(key, bucket);
    });

    let cumulativePnL = 0;
    const chartData = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key)).map((bucket) => {
      cumulativePnL += bucket.pnl;
      return { ...bucket, equity: initialBalance + cumulativePnL };
    });
    const totalPnL = chartData.reduce((sum, item) => sum + item.pnl, 0);
    return {
      chartData,
      totalPnL,
      totalTrades: chartData.reduce((sum, item) => sum + item.trades, 0),
      profitablePeriods: chartData.filter((item) => item.pnl > 0).length,
      totalReturnPercent: initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0,
      bestPeriod: chartData.reduce((best, item) => (!best || item.pnl > best.pnl ? item : best), null),
      worstPeriod: chartData.reduce((worst, item) => (!worst || item.pnl < worst.pnl ? item : worst), null),
    };
  }, [trades, metrics.initialBalance, performancePeriod]);

  const handleTrade = async (event) => {

    event.preventDefault();

    setError("");

    setMessage("");

    setQuoteWarning("");



    const symbol = form.symbol.trim().toUpperCase();

    const quantity = Number(form.quantity);



    if (!symbol) {

      setError("Please enter a stock symbol.");

      return;

    }



    if (!Number.isInteger(quantity) || quantity <= 0) {

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

          orderId: `paper-${crypto.randomUUID()}`,

        },

        {

          headers: authHeaders(),

        }

      );



      setMessage(

        response.data?.message ||

          "Paper trade executed successfully."

      );



      if (response.data?.quote?.isStale === true) {

        setQuoteWarning(

          "The quote used for this simulated trade was marked stale."

        );

      } else if (response.data?.warning) {

        setQuoteWarning(response.data.warning);

      }



      await fetchData(true);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setTrading(false);

    }

  };



  const filteredTrades = useMemo(() => {

  const search = tradeSearch.trim().toLowerCase();



  if (

    tradeFromDate &&

    tradeToDate &&

    tradeFromDate > tradeToDate

  ) {

    return [];

  }



  const startTime = tradeFromDate

    ? new Date(`${tradeFromDate}T00:00:00`).getTime()

    : null;



  let endTime = null;



  if (tradeToDate) {

    const endDate = new Date(`${tradeToDate}T00:00:00`);

    endDate.setDate(endDate.getDate() + 1);

    endTime = endDate.getTime();

  }



  return trades.filter((trade) => {

    const matchesSearch =

      !search ||

      trade.symbol?.toLowerCase().includes(search) ||

      trade.exchange?.toLowerCase().includes(search);



    const matchesSide =

      tradeFilter === "ALL" ||

      trade.side === tradeFilter;



    const tradeTime = new Date(trade.createdAt).getTime();



    const matchesFromDate =

      startTime === null ||

      (Number.isFinite(tradeTime) && tradeTime >= startTime);



    const matchesToDate =

      endTime === null ||

      (Number.isFinite(tradeTime) && tradeTime < endTime);



    return (

      matchesSearch &&

      matchesSide &&

      matchesFromDate &&

      matchesToDate

    );

  });

}, [

  trades,

  tradeSearch,

  tradeFilter,

  tradeFromDate,

  tradeToDate,

]);

  const totalTradePages = Math.max(
    1,
    Math.ceil(filteredTrades.length / PAGE_SIZE)
  );

  const currentTradePage = Math.min(

    tradePage,

    totalTradePages

  );



  const recentTrades = useMemo(() => {

    const start = (currentTradePage - 1) * PAGE_SIZE;



    return filteredTrades.slice(

      start,

      start + PAGE_SIZE

    );

  }, [filteredTrades, currentTradePage]);



  const handleTradeSearch = (value) => {

    setTradeSearch(value);

    setTradePage(1);

  };



  const handleTradeFilter = (value) => {

    setTradeFilter(value);

    setTradePage(1);

  };



  if (loading) {

    return (

      <div className="min-h-screen bg-[#080d18] px-5 py-12 text-white">

        <div className="mx-auto max-w-7xl">

          <div className="mb-8 h-8 w-64 animate-pulse rounded-lg bg-white/10" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {Array.from({ length: 6 }).map((_, index) => (

              <div

                key={index}

                className="h-36 animate-pulse rounded-2xl bg-white/[0.05]"

              />

            ))}

          </div>

          <div className="mt-6 h-80 animate-pulse rounded-2xl bg-white/[0.05]" />

        </div>

      </div>

    );

  }



  return (

    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#14243a_0%,_#080d18_48%,_#060a12_100%)] px-4 py-7 text-slate-200 sm:px-6 lg:px-8">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/[0.09] blur-[130px]" />

        <div className="absolute -right-40 top-80 h-96 w-96 rounded-full bg-violet-500/[0.09] blur-[130px]" />

        <div className="absolute left-1/2 top-[55%] h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/[0.035] blur-[140px]" />

        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      </div>



      <main className="relative mx-auto max-w-7xl space-y-6">

        <motion.header

          initial={{ opacity: 0, y: 15 }}

          animate={{ opacity: 1, y: 0 }}

          className="flex flex-col justify-between gap-5 md:flex-row md:items-center"

        >

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">

              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

              Simulation environment

            </div>



            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">

              Paper Trading{" "}

              <span className="text-cyan-300">Terminal</span>

            </h1>



            <p className="mt-2 max-w-xl text-sm text-slate-400">

              Practice your trading strategy with virtual funds.

              No real orders are placed.

            </p>

          </div>



          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2.5 text-xs font-medium text-emerald-300">

              <ShieldCheck size={16} />

              Virtual funds only

            </div>



            <button

              onClick={() => fetchData(true)}

              disabled={refreshing}

              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-50"

            >

              <RefreshCw

                size={15}

                className={refreshing ? "animate-spin" : ""}

              />

              Refresh

            </button>

          </div>

        </motion.header>



        {error && (

          <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-300">

            <AlertTriangle size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>

            <button

              onClick={() => setError("")}

              className="ml-auto"

            >

              <X size={16} />

            </button>

          </div>

        )}



        {message && (

          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-300">

            <CheckCircle2 size={18} />

            {message}

            <button

              onClick={() => setMessage("")}

              className="ml-auto"

            >

              <X size={16} />

            </button>

          </div>

        )}



        {quoteWarning && (

          <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-sm text-amber-300">

            <CircleHelp size={18} />

            {quoteWarning}

          </div>

        )}



        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

          <MetricCard

            title="Total portfolio value"

            value={currency(metrics.totalPortfolioValue)}

            change={metrics.overallPnLPercent}

            icon={Wallet}

            color="cyan"

            subtitle="Cash + current holdings value"

          />



          <MetricCard

            title="Available cash"

            value={currency(metrics.availableCash)}

            icon={Coins}

            color="violet"

            subtitle="Virtual buying power"

          />



          <MetricCard

            title="Invested value"

            value={currency(metrics.holdingsValue)}

            icon={BriefcaseBusiness}

            color="blue"

            subtitle={`${holdings.length} open holdings`}

          />



          <MetricCard

            title="Overall P&L"

            value={currency(metrics.overallPnL)}

            change={metrics.overallPnLPercent}

            icon={

              metrics.overallPnL >= 0

                ? TrendingUp

                : TrendingDown

            }

            color={

              metrics.overallPnL >= 0 ? "emerald" : "rose"

            }

            subtitle="Realized + unrealized"

          />



          <MetricCard

            title="Unrealized P&L"

            value={currency(metrics.unrealizedPnL)}

            icon={Activity}

            color={

              metrics.unrealizedPnL >= 0 ? "emerald" : "rose"

            }

            subtitle="Open positions"

          />



          <MetricCard

            title="Realized P&L"

            value={currency(metrics.realizedPnL)}

            icon={BarChart3}

            color="amber"

            subtitle="Closed positions"

          />

        </div>



        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">

          <Panel className="p-5 sm:p-6" delay={0.1}>

            <SectionHeading

              icon={Activity}

              title="Portfolio performance"

              subtitle="Historical value of your virtual portfolio"

              action={

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">

                  INR

                </span>

              }

            />



            <div className="h-[280px] w-full">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart

                  data={chartData}

                  margin={{

                    top: 10,

                    right: 8,

                    left: 0,

                    bottom: 0,

                  }}

                >

                  <defs>

                    <linearGradient

                      id="portfolioGradient"

                      x1="0"

                      y1="0"

                      x2="0"

                      y2="1"

                    >

                      <stop

                        offset="0%"

                        stopColor="#22d3ee"

                        stopOpacity={0.3}

                      />

                      <stop

                        offset="95%"

                        stopColor="#22d3ee"

                        stopOpacity={0}

                      />

                    </linearGradient>

                  </defs>



                  <CartesianGrid

                    stroke="#ffffff0c"

                    strokeDasharray="4 5"

                    vertical={false}

                  />



                  <XAxis

                    dataKey="date"

                    tick={{ fill: "#64748b", fontSize: 11 }}

                    axisLine={false}

                    tickLine={false}

                  />



                  <YAxis

                    width={75}

                    tickFormatter={(value) =>

                      `₹${(value / 1000).toFixed(0)}k`

                    }

                    tick={{ fill: "#64748b", fontSize: 11 }}

                    axisLine={false}

                    tickLine={false}

                  />



                  <Tooltip

                    contentStyle={{

                      background: "#111827",

                      border: "1px solid #ffffff1a",

                      borderRadius: 12,

                      color: "#fff",

                    }}

                    formatter={(value) => [

                      currency(value),

                      "Portfolio value",

                    ]}

                  />



                  <Area

                    type="monotone"

                    dataKey="value"

                    stroke="#22d3ee"

                    strokeWidth={2.5}

                    fill="url(#portfolioGradient)"

                    activeDot={{

                      r: 5,

                      fill: "#22d3ee",

                      stroke: "#0f172a",

                      strokeWidth: 2,

                    }}

                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>



            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-xs">

              <span className="text-slate-500">

                Starting balance:{" "}

                <span className="font-medium text-slate-300">

                  {currency(metrics.initialBalance)}

                </span>

              </span>



              <span className="text-slate-500">

                Current value:{" "}

                <span className="font-medium text-cyan-300">

                  {currency(metrics.totalPortfolioValue)}

                </span>

              </span>

            </div>

          </Panel>



          <Panel className="p-5 sm:p-6" delay={0.16}>

            <SectionHeading

              icon={BarChart3}

              title="Portfolio allocation"

              subtitle="Cash versus invested capital"

            />



            {allocationData.length ? (

              <>

                <div className="relative h-[220px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                      <Pie

                        data={allocationData}

                        dataKey="value"

                        nameKey="name"

                        innerRadius={65}

                        outerRadius={88}

                        paddingAngle={4}

                        stroke="none"

                      >

                        {allocationData.map((entry, index) => (

                          <Cell

                            key={entry.name}

                            fill={

                              index === 0 ? "#8b5cf6" : "#22d3ee"

                            }

                          />

                        ))}

                      </Pie>



                      <Tooltip

                        formatter={(value) => currency(value)}

                        contentStyle={{

                          background: "#111827",

                          border: "1px solid #ffffff1a",

                          borderRadius: 12,

                        }}

                      />

                    </PieChart>

                  </ResponsiveContainer>



                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                    <span className="text-xs text-slate-500">

                      Portfolio

                    </span>

                    <span className="mt-1 text-lg font-bold text-white">

                      {currency(metrics.totalPortfolioValue)}

                    </span>

                  </div>

                </div>



                <div className="mt-3 space-y-3">

                  {allocationData.map((item, index) => {

                    const share = metrics.totalPortfolioValue

                      ? (item.value /

                          metrics.totalPortfolioValue) *

                        100

                      : 0;



                    return (

                      <div key={item.name}>

                        <div className="mb-1.5 flex justify-between text-xs">

                          <span className="flex items-center gap-2 text-slate-400">

                            <span

                              className={`h-2 w-2 rounded-full ${

                                index === 0

                                  ? "bg-violet-400"

                                  : "bg-cyan-400"

                              }`}

                            />

                            {item.name}

                          </span>



                          <span className="font-medium text-slate-200">

                            {share.toFixed(1)}%

                          </span>

                        </div>



                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">

                          <div

                            className={`h-full rounded-full ${

                              index === 0

                                ? "bg-violet-400"

                                : "bg-cyan-400"

                            }`}

                            style={{ width: `${share}%` }}

                          />

                        </div>

                      </div>

                    );

                  })}

                </div>

              </>

            ) : (

              <EmptyState

                icon={BarChart3}

                title="No allocation data"

                description="Your allocation will appear after portfolio data is available."

              />

            )}

          </Panel>

        </div>



        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

          <Panel className="p-5 sm:p-6" delay={0.2}>

            <SectionHeading

              icon={Zap}

              title="Place paper trade"

              subtitle="Simulated order · No real money involved"

            />



            <form

              onSubmit={handleTrade}

              className="space-y-5"

            >

              <div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">

                  Stock symbol

                </label>



                <input

                  value={form.symbol}

                  onChange={(event) =>

                    setForm((current) => ({

                      ...current,

                      symbol: event.target.value.toUpperCase(),

                    }))

                  }

                  placeholder="e.g. RELIANCE"

                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"

                  required

                />

              </div>



              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">

                    Exchange

                  </label>



                  <select

                    value={form.exchange}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        exchange: event.target.value,

                      }))

                    }

                    className="w-full rounded-xl border border-white/10 bg-[#080d18] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"

                  >

                    <option value="NSE">NSE</option>

                    <option value="BSE">BSE</option>

                  </select>

                </div>



                <div>

                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">

                    Quantity

                  </label>



                  <input

                    type="number"

                    min="1"

                    step="1"

                    value={form.quantity}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        quantity: event.target.value,

                      }))

                    }

                    className="w-full rounded-xl border border-white/10 bg-[#080d18] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"

                    required

                  />

                </div>

              </div>



              <div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">

                  Order side

                </label>



                <div className="grid grid-cols-2 gap-3">

                  {["BUY", "SELL"].map((side) => (

                    <button

                      key={side}

                      type="button"

                      onClick={() =>

                        setForm((current) => ({

                          ...current,

                          side,

                        }))

                      }

                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${

                        form.side === side

                          ? side === "BUY"

                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"

                            : "border-rose-400/40 bg-rose-400/10 text-rose-300"

                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"

                      }`}

                    >

                      {side === "BUY" ? (

                        <TrendingUp size={16} />

                      ) : (

                        <TrendingDown size={16} />

                      )}

                      {side}

                    </button>

                  ))}

                </div>

              </div>



              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-3 text-xs leading-relaxed text-slate-400">

                <div className="mb-1 flex items-center gap-2 font-semibold text-cyan-300">

                  <Sparkles size={14} />

                  Simulation mode

                </div>

                The backend obtains the quote and calculates the

                simulated execution. No broker order is sent.

              </div>



              <button

                type="submit"

                disabled={trading}

                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${

                  form.side === "BUY"

                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041510] hover:brightness-110"

                    : "bg-gradient-to-r from-rose-500 to-orange-400 text-[#1a0808] hover:brightness-110"

                }`}

              >

                {trading ? (

                  <>

                    <RefreshCw

                      size={16}

                      className="animate-spin"

                    />

                    Processing simulation...

                  </>

                ) : (

                  <>

                    {form.side === "BUY" ? (

                      <TrendingUp size={17} />

                    ) : (

                      <TrendingDown size={17} />

                    )}

                    Execute paper {form.side.toLowerCase()}

                  </>

                )}

              </button>

            </form>

          </Panel>



          <Panel className="p-5 sm:p-6" delay={0.25}>

            <SectionHeading

              icon={BriefcaseBusiness}

              title="Your holdings"

              subtitle="Open virtual positions and their valuation"

            />



            {holdings.length ? (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[620px] text-left text-sm">

                  <thead>

                    <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.12em] text-slate-500">

                      <th className="pb-3 pr-4 font-medium">Stock</th>

                      <th className="pb-3 pr-4 font-medium">Qty</th>

                      <th className="pb-3 pr-4 font-medium">Avg. price</th>

                      <th className="pb-3 pr-4 font-medium">LTP</th>

                      <th className="pb-3 text-right font-medium">P&L</th>

                    </tr>

                  </thead>



                  <tbody>

                    {holdings.map((holding, index) => {

                      const pnl = Number(

                        holding.unrealizedPnL || 0

                      );

                      const status = getQuoteStatus(holding);



                      return (
                        <motion.tr

                          key={`${holding.symbol}-${holding.exchange || "NSE"}`}

                          initial={{ opacity: 0, x: 8 }}

                          animate={{ opacity: 1, x: 0 }}

                          transition={{ delay: index * 0.04 }}

                          className="border-b border-white/[0.05] last:border-0"

                        >

                          <td className="py-4 pr-4">

                            <p className="font-semibold text-white">

                              {holding.symbol}

                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">

                              {holding.exchange || "NSE"} ·{" "}

                              {number(holding.quantity)}

                            </p>

                            <p

                              className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${status.tone}`}

                            >

                              <span

                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}

                              />

                              {status.label}

                            </p>

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {number(holding.quantity)}

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {currency(holding.averagePrice)}

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {holding.quoteAvailable

                              ? currency(holding.currentPrice)

                              : "—"}

                          </td>



                          <td

                            className={`py-4 text-right font-semibold ${

                              pnl >= 0

                                ? "text-emerald-400"

                                : "text-rose-400"

                            }`}

                          >

                            {currency(pnl)}

                            <p className="mt-1 text-[10px] font-normal text-slate-500">

                              Value: {currency(holding.marketValue)}

                            </p>

                          </td>

                        </motion.tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            ) : (

              <EmptyState

                title="No open holdings"

                description="Your simulated BUY positions will appear here."

              />

            )}



            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[11px] text-slate-500">

              <Clock3 size={13} />

              Quote timestamps and freshness depend on the market-data provider.

            </div>

          </Panel>

        </div>



        <Panel className="p-5 sm:p-6" delay={0.28}>
          <SectionHeading
            icon={BarChart3}
            title="Trading P&L analytics"
            subtitle="Realized performance from completed simulated SELL trades"
            action={
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">
                {pnlAnalytics.closedCount} closed trades
              </span>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Realized P&L</p>
              <p className={`mt-2 text-xl font-semibold ${pnlAnalytics.totalRealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {currency(pnlAnalytics.totalRealizedPnL)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Win rate</p>
              <p className="mt-2 text-xl font-semibold text-cyan-300">
                {pnlAnalytics.winRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {pnlAnalytics.winningCount} wins · {pnlAnalytics.losingCount} losses
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Average P&L / closed trade</p>
              <p className={`mt-2 text-xl font-semibold ${pnlAnalytics.averagePnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {currency(pnlAnalytics.averagePnL)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Best / worst trade</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">
                {pnlAnalytics.bestTrade ? currency(pnlAnalytics.bestTrade.realizedPnL) : "—"}
              </p>
              <p className="mt-1 text-sm font-semibold text-rose-400">
                {pnlAnalytics.worstTrade ? currency(pnlAnalytics.worstTrade.realizedPnL) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-slate-300">Daily realized P&L</p>
            {pnlAnalytics.dailyData.length ? (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlAnalytics.dailyData}>
                    <defs>
                      <linearGradient id="realizedPnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff0c" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis width={75} tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [currency(value), "Realized P&L"]}
                      contentStyle={{ background: "#111827", border: "1px solid #ffffff1a", borderRadius: 12, color: "#fff" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} fill="url(#realizedPnlGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No closed trades yet"
                description="Daily realized P&L analytics will appear after simulated SELL trades have been completed."
              />
            )}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6" delay={0.29}>
          <SectionHeading
            icon={ShieldCheck}
            title="Risk management"
            subtitle="Risk and consistency metrics calculated from completed simulated SELL trades"
            action={
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">
                {pnlAnalytics.closedCount} closed trades
              </span>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Maximum drawdown</p>
              <p className="mt-2 text-xl font-semibold text-rose-400">
                {pnlAnalytics.closedCount ? currency(pnlAnalytics.maxDrawdown) : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {pnlAnalytics.closedCount ? `${pnlAnalytics.maxDrawdownPercent.toFixed(2)}% from peak equity` : "No closed trades yet"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Profit factor</p>
              <p className="mt-2 text-xl font-semibold text-cyan-300">
                {!pnlAnalytics.closedCount ? "—" : pnlAnalytics.grossLoss > 0 ? pnlAnalytics.profitFactor.toFixed(2) : pnlAnalytics.grossProfit > 0 ? "∞" : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Gross profit ÷ gross loss</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Average win / loss</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">
                {pnlAnalytics.winningCount ? currency(pnlAnalytics.averageWin) : "—"}
              </p>
              <p className="mt-1 text-sm font-semibold text-rose-400">
                {pnlAnalytics.losingCount ? currency(-pnlAnalytics.averageLoss) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Risk-to-reward ratio</p>
              <p className="mt-2 text-xl font-semibold text-cyan-300">
                {pnlAnalytics.riskRewardRatio === null ? "—" : `1 : ${pnlAnalytics.riskRewardRatio.toFixed(2)}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">Average win compared with average loss</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Current streak</p>
              <p className={`mt-2 text-lg font-semibold ${pnlAnalytics.currentStreakType === "WIN" ? "text-emerald-400" : pnlAnalytics.currentStreakType === "LOSS" ? "text-rose-400" : "text-slate-300"}`}>
                {pnlAnalytics.currentStreak ? `${pnlAnalytics.currentStreak} ${pnlAnalytics.currentStreakType.toLowerCase()}${pnlAnalytics.currentStreak > 1 ? "s" : ""}` : "No active streak"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Longest winning streak</p>
              <p className="mt-2 text-lg font-semibold text-emerald-400">{pnlAnalytics.longestWinStreak}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Longest losing streak</p>
              <p className="mt-2 text-lg font-semibold text-rose-400">{pnlAnalytics.longestLossStreak}</p>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Drawdown is calculated from the simulated starting balance and the running realized equity curve. These metrics use closed simulated trades only; open-position unrealized P&L is excluded.
          </p>
        </Panel>

        <Panel className="p-5 sm:p-6" delay={0.295}>
          <SectionHeading
            icon={TrendingUp}
            title="Advanced performance analytics"
            subtitle="Period returns and realized equity progression from simulated closed trades"
            action={
              <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-1">
                {["DAILY", "WEEKLY", "MONTHLY"].map((period) => (
                  <button key={period} type="button" onClick={() => setPerformancePeriod(period)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${performancePeriod === period ? "bg-cyan-400/15 text-cyan-300" : "text-slate-500 hover:text-slate-200"}`}>
                    {period.charAt(0) + period.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Realized return</p>
              <p className={`mt-2 text-xl font-semibold ${performanceAnalytics.totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{performanceAnalytics.totalReturnPercent.toFixed(2)}%</p>
              <p className="mt-1 text-xs text-slate-500">{currency(performanceAnalytics.totalPnL)} net P&amp;L</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Closed trades</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{performanceAnalytics.totalTrades}</p>
              <p className="mt-1 text-xs text-slate-500">{performanceAnalytics.chartData.length} {performancePeriod.toLowerCase()} periods</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Profitable periods</p>
              <p className="mt-2 text-xl font-semibold text-emerald-400">{performanceAnalytics.profitablePeriods}</p>
              <p className="mt-1 text-xs text-slate-500">Periods with positive realized P&amp;L</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Best / worst period</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">{performanceAnalytics.bestPeriod ? currency(performanceAnalytics.bestPeriod.pnl) : "—"}</p>
              <p className="mt-1 text-sm font-semibold text-rose-400">{performanceAnalytics.worstPeriod ? currency(performanceAnalytics.worstPeriod.pnl) : "—"}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-slate-300">Realized equity curve · {performancePeriod.toLowerCase()} view</p>
            {performanceAnalytics.chartData.length ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceAnalytics.chartData}>
                    <defs><linearGradient id="performanceEquityGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid stroke="#ffffff0c" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis width={82} tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [currency(value), "Realized equity"]} contentStyle={{ background: "#111827", border: "1px solid #ffffff1a", borderRadius: 12, color: "#fff" }} />
                    <Area type="monotone" dataKey="equity" stroke="#22d3ee" strokeWidth={2.5} fill="url(#performanceEquityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="Not enough performance data" description="The equity curve and period returns will appear after your first simulated SELL trade." />
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Returns are calculated against the simulated starting balance of {currency(Number(metrics.initialBalance) || 0)}. The curve uses realized P&amp;L only; open-position unrealized gains/losses and external market benchmarks are not included.
          </p>
        </Panel>

        <Panel className="p-5 sm:p-6" delay={0.3}>

          <SectionHeading

            icon={Activity}

            title="Transaction history"

            subtitle="Search, filter and review your simulated BUY and SELL activity"

            action={

              <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">

                {filteredTrades.length} trades

              </span>

            }

          />



          <div className="mb-5 flex flex-col gap-3 sm:flex-row">

            <div className="relative min-w-0 flex-1">

              <Search

                size={17}

                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"

              />



              <input

                type="text"

                value={tradeSearch}

                onChange={(event) =>

                  handleTradeSearch(event.target.value)

                }

                placeholder="Search stock symbol..."

                className="w-full rounded-xl border border-white/10 bg-[#080d18] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"

              />

            </div>



            <div className="flex gap-2">

              {["ALL", "BUY", "SELL"].map((filter) => (

                <button

                  key={filter}

                  type="button"

                  onClick={() => handleTradeFilter(filter)}

                  className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${

                    tradeFilter === filter

                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"

                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07]"

                  }`}

                >

                  {filter}

                </button>

              ))}

            </div>

          </div>

          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-2 block text-xs font-medium text-slate-400">
                From Date
              </label>
              <input
                type="date"
                value={tradeFromDate}
                max={tradeToDate || undefined}
                onChange={(event) => {
                  setTradeFromDate(event.target.value);
                  setTradePage(1);
                }}
                className="w-full rounded-xl border border-white/10 bg-[#080d18] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label className="mb-2 block text-xs font-medium text-slate-400">
                To Date
              </label>
              <input
                type="date"
                value={tradeToDate}
                min={tradeFromDate || undefined}
                onChange={(event) => {
                  setTradeToDate(event.target.value);
                  setTradePage(1);
                }}
                className="w-full rounded-xl border border-white/10 bg-[#080d18] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setTradeSearch("");
                setTradeFilter("ALL");
                setTradeFromDate("");
                setTradeToDate("");
                setTradePage(1);
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
            >
              Clear Filters
            </button>
          </div>

          {recentTrades.length ? (

            <>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[680px] text-left text-sm">

                  <thead>

                    <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.12em] text-slate-500">

                      <th className="pb-3 pr-4 font-medium">Stock</th>

                      <th className="pb-3 pr-4 font-medium">Side</th>

                      <th className="pb-3 pr-4 font-medium">Quantity</th>

                      <th className="pb-3 pr-4 font-medium">Execution price</th>

                      <th className="pb-3 pr-4 font-medium">Net value</th>

                      <th className="pb-3 pr-4 font-medium">Realized P&L</th>

                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 pl-4 font-medium">Journal</th>
                    </tr>

                  </thead>



                  <tbody>

                    {recentTrades.map((trade, index) => {

                      const isBuy = trade.side === "BUY";

                      const pnl = Number(

                        trade.realizedPnL || 0

                      );



                      return (

                        <>

                        <motion.tr

                          key={

                            trade._id ||

                            trade.orderId ||

                            index

                          }

                          initial={{ opacity: 0, y: 6 }}

                          animate={{ opacity: 1, y: 0 }}

                          transition={{

                            delay: index * 0.035,

                          }}

                          className="border-b border-white/[0.05] last:border-0"

                        >

                          <td className="py-4 pr-4">

                            <span className="font-semibold text-white">

                              {trade.symbol}

                            </span>

                            <span className="ml-2 text-[10px] text-slate-500">

                              {trade.exchange}

                            </span>

                          </td>



                          <td className="py-4 pr-4">

                            <span

                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${

                                isBuy

                                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"

                                  : "border border-rose-400/20 bg-rose-400/10 text-rose-300"

                              }`}

                            >

                              {trade.side}

                            </span>

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {number(trade.quantity)}

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {currency(trade.executionPrice)}

                          </td>



                          <td className="py-4 pr-4 text-slate-300">

                            {currency(trade.netValue)}

                          </td>



                          <td

                            className={`py-4 pr-4 font-medium ${

                              pnl >= 0

                                ? "text-emerald-400"

                                : "text-rose-400"

                            }`}

                          >

                            {currency(pnl)}

                          </td>



                          <td className="py-4 text-xs text-slate-400">
                            {dateTime(trade.createdAt)}
                          </td>
                          <td className="py-4 pl-4">
                            <button
                              type="button"
                              onClick={() => openJournalEditor(trade)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-400/[0.12]"
                            >
                              <Pencil size={12} />
                              {journalNotes[getJournalTradeId(trade)] ? "Edit note" : "Add note"}
                            </button>
                          </td>
                        </motion.tr>
                        {editingJournalId === getJournalTradeId(trade) && (
                          <tr className="border-b border-white/[0.06]">
                            <td colSpan={8} className="px-2 py-4">
                              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.035] p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                    <BookOpen size={15} className="text-cyan-300" />
                                    Trade journal · {trade.symbol} {trade.side}
                                  </p>
                                  <button type="button" onClick={() => setEditingJournalId(null)} className="text-slate-500 hover:text-white" aria-label="Close journal editor">
                                    <XCircle size={17} />
                                  </button>
                                </div>
                                <textarea
                                  value={journalDraft}
                                  onChange={(event) => setJournalDraft(event.target.value)}
                                  rows={3}
                                  maxLength={2000}
                                  placeholder="Why did you enter or exit this trade? What worked, what went wrong, and what will you learn?"
                                  className="w-full resize-y rounded-lg border border-white/10 bg-[#080d18] p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                                />
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <span className="text-[11px] text-slate-500">Saved in this browser only · {journalDraft.length}/2000</span>
                                  <button type="button" onClick={() => saveJournalNote(getJournalTradeId(trade))} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
                                    <Save size={13} /> Save note
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </>

                      );

                    })}

                  </tbody>

                </table>

              </div>



              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">

                <p className="text-xs text-slate-500">

                  Showing{" "}

                  {(currentTradePage - 1) * PAGE_SIZE + 1}

                  {" "}to{" "}

                  {Math.min(

                    currentTradePage * PAGE_SIZE,

                    filteredTrades.length

                  )}

                  {" "}of {filteredTrades.length} transactions

                </p>



                <div className="flex items-center gap-2">

                  <button

                    type="button"

                    disabled={currentTradePage === 1}

                    onClick={() =>

                      setTradePage((page) =>

                        Math.max(1, page - 1)

                      )

                    }

                    className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"

                  >

                    <ChevronLeft size={14} />

                    Previous

                  </button>



                  <span className="px-2 text-xs text-cyan-300">

                    {currentTradePage} / {totalTradePages}

                  </span>



                  <button

                    type="button"

                    disabled={

                      currentTradePage >= totalTradePages

                    }

                    onClick={() =>

                      setTradePage((page) =>

                        Math.min(totalTradePages, page + 1)

                      )

                    }

                    className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"

                  >

                    Next

                    <ChevronRight size={14} />

                  </button>

                </div>

              </div>

            </>

          ) : (

            <EmptyState

              icon={Clock3}

              title={

                trades.length

                  ? "No matching transactions"

                  : "No transactions yet"

              }

              description={

                trades.length

                  ? "Try another stock symbol or transaction filter."

                  : "Your completed simulated trades will appear here."

              }

            />

          )}

        </Panel>



        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 sm:flex-row sm:items-start">

          <div className="rounded-lg bg-amber-400/10 p-2 text-amber-300">

            <AlertTriangle size={17} />

          </div>



          <div>

            <p className="text-sm font-semibold text-amber-200">

              Important disclaimer

            </p>



            <p className="mt-1 text-xs leading-relaxed text-slate-400">

              Paper Trading is a simulated learning environment.

              Trades use virtual funds and do not place real orders

              with Angel One or any broker. Market quotes may be

              delayed, unavailable, or have unknown freshness.

              This dashboard is for educational and informational

              purposes only and does not provide investment advice.

            </p>

          </div>

        </div>



        <footer className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[10px] text-slate-600">

          <span>StockSense AI · Paper Trading</span>

          <span className="flex items-center gap-1.5">

            <ShieldCheck size={12} />

            Simulation only · No real orders

          </span>

        </footer>

      </main>

    </div>

  );

}
