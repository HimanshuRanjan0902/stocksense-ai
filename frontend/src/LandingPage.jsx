
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Radar,
  Layers3,
  Zap,
  Globe2,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronRight,
  LockKeyhole,
  Cpu,
  ChartNoAxesCombined,
  Radio,
  Database,
  Network,
  CircleDollarSign
} from "lucide-react";

const tickers = [
  { symbol: "NIFTY 50", price: "25,030.35", change: "+0.82%", up: true },
  { symbol: "SENSEX", price: "81,028.02", change: "+0.74%", up: true },
  { symbol: "RELIANCE", price: "1,274.60", change: "+1.46%", up: true },
  { symbol: "TCS", price: "2,498.50", change: "-0.32%", up: false },
  { symbol: "HDFCBANK", price: "788.25", change: "+0.56%", up: true },
  { symbol: "INFY", price: "1,842.10", change: "-0.66%", up: false },
  { symbol: "ICICIBANK", price: "1,265.80", change: "+1.16%", up: true },
  { symbol: "SBIN", price: "822.40", change: "+1.09%", up: true }
];

const features = [
  {
    icon: BrainCircuit,
    number: "01",
    title: "AI Sentiment Intelligence",
    description:
      "Understand the market narrative with NLP-powered analysis of financial news, announcements and company updates.",
    color: "cyan"
  },
  {
    icon: Radar,
    number: "02",
    title: "Market Flow Radar",
    description:
      "Explore unusual activity, derivatives signals and market-flow patterns from available market data.",
    color: "blue"
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "AI Risk Intelligence",
    description:
      "Identify potential risk factors, volatility signals and portfolio concentration before making decisions.",
    color: "purple"
  },
  {
    icon: ChartNoAxesCombined,
    number: "04",
    title: "Advanced Charting",
    description:
      "Explore historical price action, candlesticks, moving averages, volume and technical indicators.",
    color: "emerald"
  },
  {
    icon: Layers3,
    number: "05",
    title: "Portfolio Intelligence",
    description:
      "Organise your holdings, monitor watchlists and understand how individual positions contribute to exposure.",
    color: "orange"
  },
  {
    icon: Network,
    number: "06",
    title: "Developer API",
    description:
      "Build financial workflows using structured market intelligence and developer-focused API access.",
    color: "pink"
  }
];

const prompts = [
  "Compare the latest news sentiment for Reliance and TCS",
  "What are the major risks affecting Indian banking stocks?",
  "Explain the latest market trend in simple language"
];

const demoResponses = [
  {
    sentiment: "Mixed",
    confidence: "Demo",
    risk: "Moderate",
    title: "Reliance vs TCS — Market Intelligence",
    summary:
      "A sample analysis showing how StockSense AI can organise market news into a concise research summary. Connect the live news analysis service for actual results.",
    catalysts: [
      "Company announcements and earnings updates",
      "Sector-wide developments",
      "Broader market sentiment"
    ]
  },
  {
    sentiment: "Neutral",
    confidence: "Demo",
    risk: "Elevated",
    title: "Indian Banking Sector — Risk Overview",
    summary:
      "A sample risk overview. Actual risk assessments should be generated from current market data and verified financial information.",
    catalysts: [
      "Interest-rate environment",
      "Credit growth and asset quality",
      "Liquidity and funding conditions"
    ]
  },
  {
    sentiment: "Neutral",
    confidence: "Demo",
    risk: "Moderate",
    title: "Indian Market — Trend Overview",
    summary:
      "A sample market explanation demonstrating how financial information can be simplified for research and learning.",
    catalysts: [
      "Index performance",
      "Sector participation",
      "News and macroeconomic developments"
    ]
  }
];

const plans = [
  {
    name: "Free",
    description: "Explore market intelligence",
    monthly: "₹0",
    annual: "₹0",
    features: [
      "Basic market dashboard",
      "Limited AI news analysis",
      "Watchlist",
      "Historical stock charts"
    ],
    popular: false
  },
  {
    name: "Pro Trader",
    description: "For serious market researchers",
    monthly: "₹499",
    annual: "₹399",
    features: [
      "Extended AI news analysis",
      "Advanced chart indicators",
      "Portfolio intelligence",
      "Risk analysis tools",
      "Priority data access"
    ],
    popular: true
  },
  {
    name: "Institutional",
    description: "For teams and developers",
    monthly: "Custom",
    annual: "Custom",
    features: [
      "API access",
      "Team workflows",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated support"
    ],
    popular: false
  }
];

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let animationFrame;
    let particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from(
        { length: Math.min(100, Math.floor(width / 12)) },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.4,
          speed: Math.random() * 0.25 + 0.08,
          alpha: Math.random() * 0.6 + 0.15
        })
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        if (!reducedMotion) {
          p.y -= p.speed;
          if (p.y < 0) p.y = height;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 180, 255, ${p.alpha})`;
        ctx.fill();

        if (index % 3 === 0) {
          const next = particles[(index + 1) % particles.length];
          const distance = Math.hypot(p.x - next.x, p.y - next.y);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${
              0.12 * (1 - distance / 120)
            })`;
            ctx.stroke();
          }
        }
      });

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-50"
      aria-hidden="true"
    />
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GlassCard({ children, className = "" }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const handleMove = (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setStyle({
      transform: `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-4px)`
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setStyle({ transform: "none" })}
      style={style}
      className={`glass-card ${className}`}
    >
      {children}
    </div>
  );
}

function MarketChart() {
  const candles = [
    [48, 70, 80, 38],
    [70, 55, 77, 48],
    [55, 44, 65, 35],
    [44, 73, 82, 39],
    [73, 62, 80, 56],
    [62, 86, 93, 58],
    [86, 78, 96, 70],
    [78, 103, 110, 72],
    [103, 92, 115, 86],
    [92, 125, 132, 88],
    [125, 115, 138, 108],
    [115, 145, 153, 110],
    [145, 135, 159, 128],
    [135, 165, 174, 130],
    [165, 155, 181, 148],
    [155, 185, 194, 150]
  ];

  return (
    <div className="relative h-44 w-full overflow-hidden">
      <div className="absolute inset-0 flex flex-col justify-between">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="border-t border-white/[0.06]" />
        ))}
      </div>

      <svg viewBox="0 0 500 200" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="chartGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity=".25" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 155 C50 145 65 160 100 125 S155 140 190 90 S245 110 280 75 S340 90 370 50 S440 70 500 20 L500 200 L0 200 Z"
          fill="url(#chartGlow)"
        />
        <path
          d="M0 155 C50 145 65 160 100 125 S155 140 190 90 S245 110 280 75 S340 90 370 50 S440 70 500 20"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="chart-line"
        />
      </svg>

      <div className="absolute inset-0 flex items-end justify-around px-2">
        {candles.map(([open, close, high, low], index) => {
          const up = close > open;
          const bottom = Math.min(open, close);
          const bodyHeight = Math.max(Math.abs(close - open), 9);

          return (
            <div
              key={index}
              className="relative flex h-full w-2 items-center justify-center"
            >
              <div
                className={`absolute w-px ${
                  up ? "bg-emerald-400" : "bg-rose-400"
                }`}
                style={{
                  height: `${((high - low) / 200) * 100}%`,
                  bottom: `${(low / 200) * 100}%`
                }}
              />
              <div
                className={`absolute w-2 rounded-sm ${
                  up
                    ? "bg-gradient-to-b from-emerald-300 to-emerald-600"
                    : "bg-gradient-to-b from-rose-300 to-rose-600"
                }`}
                style={{
                  height: `${(bodyHeight / 200) * 100}%`,
                  bottom: `${(bottom / 200) * 100}%`
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroDashboard() {
  const [stock, setStock] = useState("RELIANCE");

  const stockInfo = {
    RELIANCE: { price: "₹1,274.60", change: "+1.46%", score: "82" },
    TCS: { price: "₹2,498.50", change: "+1.92%", score: "76" },
    INFY: { price: "₹1,842.10", change: "-0.66%", score: "64" }
  };

  const current = stockInfo[stock];

  return (
    <motion.div
      initial={{ opacity: 0, y: 45, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="hero-dashboard"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-300">
            STOCKSENSE TERMINAL
          </span>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-mono text-cyan-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          MARKET INTELLIGENCE
        </span>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.keys(stockInfo).map((symbol) => (
              <button
                key={symbol}
                onClick={() => setStock(symbol)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono transition ${
                  stock === symbol
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">{stock} · NSE</div>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold tracking-tight text-white">
              {current.price}
            </span>
            <span
              className={`mb-1 text-xs font-semibold ${
                current.change.startsWith("+")
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {current.change}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Price movement</span>
              <span className="text-[10px] text-slate-600">Illustrative</span>
            </div>
            <MarketChart />
          </div>

          <div className="mt-3 flex justify-between text-[10px] font-mono text-slate-500">
            <span>1D</span>
            <span>1W</span>
            <span className="text-cyan-300">1M</span>
            <span>3M</span>
            <span>1Y</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <BrainCircuit size={15} />
              AI SENTIMENT SCORE
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[5px] border-cyan-400/20">
                <div className="absolute inset-0 rounded-full border-[5px] border-cyan-400 border-r-transparent border-b-transparent -rotate-45" />
                <span className="text-2xl font-bold text-white">
                  {current.score}
                </span>
              </div>
              <div>
                <div className="font-semibold text-white">Sentiment view</div>
                <div className="mt-1 text-xs text-slate-400">
                  Illustrative demo score
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck size={15} className="text-emerald-400" />
              RISK MONITOR
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Risk overview
              </span>
              <span className="rounded-md bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">
                Demo
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Sample visualisation, not an investment recommendation.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] px-5 py-3 text-[10px] text-slate-500">
        <span>Market data preview · Sample values</span>
        <span className="font-mono text-cyan-300">STOCKSENSE AI</span>
      </div>
    </motion.div>
  );
}

export default function LandingPage({
  onSignIn,
  onStartFree
}) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [billing, setBilling] = useState("annual");
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [answer, setAnswer] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const runDemo = () => {
    setQuery(prompts[selectedPrompt]);
    setLoading(true);
    setAnswer(false);

    window.setTimeout(() => {
      setLoading(false);
      setAnswer(true);
    }, 1100);
  };

  const navLinks = [
    ["Platform", "#features"],
    ["AI Sandbox", "#sandbox"],
    ["Insights", "#insights"],
    ["Pricing", "#pricing"]
  ];

  const handleStart = () => {
    if (onStartFree) onStartFree();
    else if (onSignIn) onSignIn();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070A11] font-sans text-white selection:bg-cyan-400 selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .landing-root { font-family: Inter, sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }

        .glass-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.13);
          border-radius: 20px;
          background: linear-gradient(145deg,rgba(18,29,49,.78),rgba(8,13,25,.78));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 20px 70px rgba(0,0,0,.18);
          transition: transform .2s ease, border-color .2s ease;
          transform-style: preserve-3d;
        }

        .glass-card:hover {
          border-color: rgba(34,211,238,.38);
        }

        .hero-dashboard {
          transform-style: preserve-3d;
          border: 1px solid rgba(34,211,238,.25);
          border-radius: 22px;
          background: rgba(8,14,27,.88);
          box-shadow: 0 30px 100px rgba(0,0,0,.5), 0 0 65px rgba(34,211,238,.10);
          backdrop-filter: blur(25px);
          overflow: hidden;
        }

        .gradient-text {
          background: linear-gradient(100deg,#fff 10%,#67e8f9 45%,#818cf8 80%,#fff);
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          animation: gradientMove 6s linear infinite;
        }

        @keyframes gradientMove {
          to { background-position: 200% center; }
        }

        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }

        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px rgba(34,211,238,.08); }
          50% { box-shadow: 0 0 45px rgba(34,211,238,.22); }
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 38s linear infinite;
        }

        .marquee-track:hover { animation-play-state: paused; }

        .float-shape { animation: float 7s ease-in-out infinite; }
        .glow-card { animation: pulseGlow 5s ease-in-out infinite; }

        .chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2.5s ease forwards;
        }

        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }

        .section-glow {
          background: radial-gradient(ellipse at center,rgba(37,99,235,.11),transparent 65%);
        }

        .grain:after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
        }

        .focus-ring:focus-visible {
          outline: 2px solid #67e8f9;
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="landing-root">
        <ParticleBackground />

        <div className="pointer-events-none absolute -top-64 left-1/2 h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/[0.12] blur-[150px]" />
        <div className="pointer-events-none absolute right-[-250px] top-[900px] h-[550px] w-[550px] rounded-full bg-cyan-500/[0.08] blur-[140px]" />

        <div className="relative z-20 border-b border-white/[0.06] bg-[#080d18]/80 py-2.5 backdrop-blur-xl">
          <div className="marquee-track gap-10">
            {[...tickers, ...tickers].map((item, index) => (
              <div
                key={`${item.symbol}-${index}`}
                className="flex items-center gap-2.5 whitespace-nowrap text-[11px]"
              >
                <span className="mono font-semibold text-slate-200">
                  {item.symbol}
                </span>
                <span className="mono text-slate-400">{item.price}</span>
                <span
                  className={`mono flex items-center gap-1 ${
                    item.up ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {item.up ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {item.change}
                </span>
                <span className="ml-5 text-slate-700">◆</span>
              </div>
            ))}
          </div>
        </div>

        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070A11]/75 backdrop-blur-2xl">
          <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
            <a href="#home" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-cyan-300 shadow-lg shadow-cyan-500/10">
                <Activity size={22} />
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight">
                  StockSense <span className="text-cyan-300">AI</span>
                </div>
                <div className="mono text-[9px] uppercase tracking-[.22em] text-slate-500">
                  Market Intelligence
                </div>
              </div>
            </a>

            <div className="hidden items-center gap-8 lg:flex">
              {navLinks.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-slate-400 transition hover:text-cyan-300"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={onSignIn}
                className="focus-ring rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Sign in
              </button>
              <button
                onClick={handleStart}
                className="focus-ring group flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/40"
              >
                Start Free
                <ArrowUpRight size={16} />
              </button>
            </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="focus-ring rounded-lg border border-white/10 p-2 text-white md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </nav>

          <AnimatePresence>
            {mobileMenu && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10 bg-[#080d18] md:hidden"
              >
                <div className="flex flex-col gap-1 px-5 py-4">
                  {navLinks.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      onClick={() => setMobileMenu(false)}
                      className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5"
                    >
                      {label}
                    </a>
                  ))}
                  <button
                    onClick={() => {
                      setMobileMenu(false);
                      onSignIn?.();
                    }}
                    className="mt-2 rounded-lg border border-cyan-400/30 py-3 text-sm text-cyan-300"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenu(false);
                      handleStart();
                    }}
                    className="rounded-lg bg-cyan-400 py-3 text-sm font-bold text-slate-950"
                  >
                    Start Free
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <section
          id="home"
          className="grain relative z-10 overflow-hidden px-5 pb-24 pt-20 md:pb-32 md:pt-28"
        >
          <div className="section-glow pointer-events-none absolute inset-0" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2"
              >
                <Sparkles size={14} className="text-cyan-300" />
                <span className="mono text-[10px] uppercase tracking-[.16em] text-cyan-200">
                  Intelligence for the Indian markets
                </span>
                <ChevronRight size={13} className="text-cyan-400" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl font-black leading-[1.06] tracking-[-.055em] sm:text-6xl lg:text-[82px]"
              >
                See the market
                <br />
                <span className="gradient-text">beyond the numbers.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 md:text-lg"
              >
                Decode market sentiment, understand financial news and explore
                portfolio risk with AI-powered intelligence built for Indian
                market research.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
              >
                <button
                  onClick={handleStart}
                  className="focus-ring group flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 text-sm font-bold text-slate-950 shadow-[0_0_45px_rgba(34,211,238,.2)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(34,211,238,.35)]"
                >
                  Explore StockSense
                  <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </button>
                <a
                  href="#sandbox"
                  className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.07]"
                >
                  <Activity size={17} className="text-cyan-300" />
                  Explore AI Sandbox
                </a>
              </motion.div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-400" />
                  NSE & BSE focused
                </span>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-400" />
                  AI-powered research
                </span>
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-400" />
                  Built for clarity
                </span>
              </div>
            </div>

            <div className="relative mx-auto mt-20 max-w-5xl [perspective:1400px]">
              <div className="pointer-events-none absolute -inset-12 rounded-[50%] bg-cyan-500/[0.08] blur-[100px]" />
              <div className="float-shape absolute -left-6 top-10 z-10 hidden rounded-xl border border-cyan-400/20 bg-[#0b1628]/90 p-4 shadow-xl backdrop-blur-xl md:block">
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <BrainCircuit size={15} />
                  AI ANALYSIS
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  Market aware.
                </div>
                <div className="text-[10px] text-slate-500">
                  Understand the context
                </div>
              </div>
              <div className="float-shape absolute -right-7 bottom-12 z-10 hidden rounded-xl border border-emerald-400/20 bg-[#0b1628]/90 p-4 shadow-xl backdrop-blur-xl md:block [animation-delay:2s]">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <ShieldCheck size={15} />
                  RISK INTELLIGENCE
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  Research smarter.
                </div>
                <div className="text-[10px] text-slate-500">
                  Evaluate potential exposure
                </div>
              </div>
              <HeroDashboard />
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-500">
              <span className="mono uppercase tracking-[.2em]">
                Designed for Indian markets
              </span>
              <span className="h-px w-10 bg-slate-700" />
              <span className="mono">NSE</span>
              <span className="mono">BSE</span>
              <span className="mono">AI / NLP</span>
              <span className="mono">MARKET DATA</span>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 px-5 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mono mb-4 text-xs uppercase tracking-[.25em] text-cyan-300">
                The intelligence layer
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Everything you need to
                <span className="gradient-text"> read the market.</span>
              </h2>
              <p className="mt-5 leading-7 text-slate-400">
                One connected workspace for financial news, market context,
                technical research and risk awareness.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={index * 0.07}>
                    <GlassCard className="group h-full p-7">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300 transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                          <Icon size={23} />
                        </div>
                        <span className="mono text-xs text-slate-600">
                          {feature.number}
                        </span>
                      </div>
                      <h3 className="mt-7 text-lg font-bold text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {feature.description}
                      </p>
                      <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        Explore capability
                        <ArrowUpRight
                          size={14}
                          className="transition group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                      </div>
                    </GlassCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="sandbox" className="relative z-10 px-5 py-24 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,.12),transparent_65%)]" />
          <div className="relative mx-auto max-w-7xl">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mono mb-4 text-xs uppercase tracking-[.25em] text-cyan-300">
                Interactive intelligence
              </div>
              <h2 className="text-3xl font-bold sm:text-5xl">
                Ask better questions.
                <br />
                <span className="gradient-text">Understand the why.</span>
              </h2>
              <p className="mt-5 text-slate-400">
                Experience a preview of how AI can turn complex financial
                information into a more understandable research summary.
              </p>
            </Reveal>

            <Reveal>
              <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#090f1d]/95 shadow-[0_30px_100px_rgba(0,0,0,.35)]">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <Cpu size={19} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">StockSense AI Lab</div>
                      <div className="mono text-[10px] text-slate-500">
                        INTERACTIVE DEMO ENVIRONMENT
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-[10px] text-emerald-300">
                    Preview mode
                  </span>
                </div>

                <div className="grid md:grid-cols-[.8fr_1.2fr]">
                  <div className="border-b border-white/[0.08] p-6 md:border-b-0 md:border-r">
                    <div className="mono mb-4 text-[10px] uppercase tracking-widest text-slate-500">
                      Choose a research prompt
                    </div>
                    <div className="space-y-2">
                      {prompts.map((prompt, index) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            setSelectedPrompt(index);
                            setAnswer(false);
                            setQuery("");
                          }}
                          className={`w-full rounded-xl border p-4 text-left text-xs leading-6 transition ${
                            selectedPrompt === index
                              ? "border-cyan-400/40 bg-cyan-400/[0.08] text-cyan-100"
                              : "border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <span className="mb-2 block mono text-[10px] text-slate-600">
                            PROMPT 0{index + 1}
                          </span>
                          {prompt}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={runDemo}
                      disabled={loading}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                    >
                      {loading ? "Analysing..." : "Run AI preview"}
                      <Sparkles size={16} />
                    </button>
                    <p className="mt-3 text-center text-[10px] text-slate-600">
                      Illustrative responses, not live AI analysis.
                    </p>
                  </div>

                  <div className="min-h-[390px] p-6 md:p-8">
                    <div className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                      <Radio size={13} className="text-cyan-300" />
                      Analysis output
                    </div>

                    {!answer && !loading && (
                      <div className="flex h-[300px] flex-col items-center justify-center text-center">
                        <div className="glow-card flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] text-cyan-300">
                          <BrainCircuit size={34} />
                        </div>
                        <h3 className="mt-6 font-semibold text-white">
                          Ready to explore?
                        </h3>
                        <p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">
                          Select a prompt and run the preview to see an
                          example intelligence report.
                        </p>
                      </div>
                    )}

                    {loading && (
                      <div className="flex h-[300px] flex-col items-center justify-center gap-5">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30">
                          <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/30" />
                          <Sparkles className="text-cyan-300" size={25} />
                        </div>
                        <div className="mono animate-pulse text-xs text-cyan-300">
                          PROCESSING DEMO...
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {answer && !loading && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-5"
                        >
                          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
                            <div className="mono text-[10px] text-cyan-300">
                              {query}
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-white">
                              {demoResponses[selectedPrompt].title}
                            </h3>
                            <p className="mt-3 text-xs leading-6 text-slate-400">
                              {demoResponses[selectedPrompt].summary}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {[
                              ["Sentiment", demoResponses[selectedPrompt].sentiment],
                              ["Confidence", demoResponses[selectedPrompt].confidence],
                              ["Risk", demoResponses[selectedPrompt].risk]
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"
                              >
                                <div className="text-[10px] text-slate-500">
                                  {label}
                                </div>
                                <div className="mt-2 text-xs font-bold text-white">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div>
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                              <Zap size={14} className="text-amber-300" />
                              Research factors
                            </div>
                            <div className="space-y-2">
                              {demoResponses[selectedPrompt].catalysts.map(
                                (item) => (
                                  <div
                                    key={item}
                                    className="flex items-center gap-2 text-xs text-slate-400"
                                  >
                                    <Check
                                      size={13}
                                      className="text-emerald-400"
                                    />
                                    {item}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="insights" className="relative z-10 px-5 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mono mb-4 text-xs uppercase tracking-[.25em] text-cyan-300">
                Built for market research
              </div>
              <h2 className="text-3xl font-bold sm:text-5xl">
                Clarity in every
                <span className="gradient-text"> data point.</span>
              </h2>
              <p className="mt-5 text-slate-400">
                A connected workspace designed to bring market information
                together in one place.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Globe2,
                  value: "NSE + BSE",
                  label: "Market coverage",
                  note: "Indian market focus"
                },
                {
                  icon: BrainCircuit,
                  value: "AI / NLP",
                  label: "News intelligence",
                  note: "Understand the narrative"
                },
                {
                  icon: Database,
                  value: "Structured",
                  label: "Market information",
                  note: "Organised research data"
                },
                {
                  icon: LockKeyhole,
                  value: "Secure",
                  label: "User workspace",
                  note: "Account-based experience"
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.label} delay={index * 0.08}>
                    <GlassCard className="p-6">
                      <Icon size={22} className="text-cyan-300" />
                      <div className="mt-6 text-2xl font-bold text-white">
                        {item.value}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-300">
                        {item.label}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {item.note}
                      </div>
                    </GlassCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative z-10 px-5 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mx-auto mb-12 max-w-3xl text-center">
              <div className="mono mb-4 text-xs uppercase tracking-[.25em] text-cyan-300">
                Simple plans
              </div>
              <h2 className="text-3xl font-bold sm:text-5xl">
                Intelligence that
                <span className="gradient-text"> scales with you.</span>
              </h2>
              <p className="mt-5 text-slate-400">
                Choose a plan that matches your research workflow.
              </p>

              <div className="mt-8 inline-flex rounded-xl border border-white/10 bg-white/[0.035] p-1">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`rounded-lg px-5 py-2 text-xs font-semibold transition ${
                    billing === "monthly"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`rounded-lg px-5 py-2 text-xs font-semibold transition ${
                    billing === "annual"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  Annual
                </button>
              </div>
            </Reveal>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 0.1}>
                  <div
                    className={`relative h-full rounded-2xl border p-7 ${
                      plan.popular
                        ? "border-cyan-400/50 bg-gradient-to-b from-cyan-400/[0.10] to-blue-500/[0.035] shadow-[0_0_55px_rgba(34,211,238,.08)]"
                        : "border-white/10 bg-white/[0.025]"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                        Most Popular
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      {plan.description}
                    </p>

                    <div className="mt-8 flex items-baseline gap-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${plan.name}-${billing}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-4xl font-extrabold tracking-tight text-white"
                        >
                          {billing === "annual" ? plan.annual : plan.monthly}
                        </motion.span>
                      </AnimatePresence>
                      {plan.name !== "Institutional" && (
                        <span className="text-xs text-slate-500">/ month</span>
                      )}
                    </div>

                    <div className="my-7 h-px bg-white/[0.08]" />

                    <div className="space-y-4">
                      {plan.features.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 text-xs text-slate-300"
                        >
                          <Check size={15} className="shrink-0 text-cyan-300" />
                          {item}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleStart}
                      className={`mt-9 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                        plan.popular
                          ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/15"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-cyan-400/40"
                      }`}
                    >
                      {plan.name === "Institutional"
                        ? "Contact us"
                        : "Get started"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-7 text-center text-[10px] text-slate-600">
              Pricing shown is illustrative and not an active subscription offer.
            </p>
          </div>
        </section>

        <section className="relative z-10 px-5 py-20">
          <Reveal>
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#10213d] via-[#0b1427] to-[#11102c] px-7 py-16 text-center md:px-16">
              <div className="pointer-events-none absolute -left-20 -top-40 h-96 w-96 rounded-full bg-cyan-400/15 blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-[100px]" />

              <div className="relative mx-auto max-w-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300">
                  <Sparkles size={27} />
                </div>
                <h2 className="mt-7 text-3xl font-black tracking-tight sm:text-5xl">
                  Make your next market
                  <span className="gradient-text"> decision informed.</span>
                </h2>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  Bring financial news, market context and AI-powered research
                  into one workspace.
                </p>
                <button
                  onClick={handleStart}
                  className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-1"
                >
                  Get started with StockSense
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="relative z-10 border-t border-white/[0.07] px-5 pb-8 pt-14">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <a href="#home" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300">
                  <Activity size={21} />
                </div>
                <span className="text-lg font-extrabold">
                  StockSense <span className="text-cyan-300">AI</span>
                </span>
              </a>
              <p className="mt-5 max-w-xs text-xs leading-6 text-slate-500">
                AI-powered market intelligence for understanding the Indian
                financial markets.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: [
                  ["Features", "#features"],
                  ["AI Sandbox", "#sandbox"],
                  ["Insights", "#insights"],
                  ["Pricing", "#pricing"]
                ]
              },
              {
                title: "Company",
                links: [
                  ["About", "#home"],
                  ["Contact", "mailto:hello@stocksense.ai"],
                  ["Get started", "#home"]
                ]
              },
              {
                title: "Legal",
                links: [
                  ["Privacy", "#disclaimer"],
                  ["Terms", "#disclaimer"],
                  ["Risk disclosure", "#disclaimer"]
                ]
              }
            ].map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  {column.title}
                </h3>
                <div className="mt-5 flex flex-col gap-3">
                  {column.links.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="text-xs text-slate-500 transition hover:text-cyan-300"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            id="disclaimer"
            className="mx-auto mt-12 max-w-7xl border-t border-white/[0.07] pt-7"
          >
            <p className="max-w-5xl text-[10px] leading-6 text-slate-600">
              <strong className="text-slate-400">Financial risk disclosure:</strong>{" "}
              StockSense AI is an informational and research platform. Market
              information may be delayed, incomplete or inaccurate. AI-generated
              analysis may contain errors and should not be relied upon as
              financial, investment, tax or legal advice. StockSense AI does not
              guarantee returns or provide personalised investment
              recommendations. Investing and trading involve risk, including
              possible loss of capital. Always conduct independent research
              and consult a qualified financial professional where appropriate.
            </p>

            <div className="mt-7 flex flex-col justify-between gap-3 text-[10px] text-slate-600 sm:flex-row">
              <span>© {new Date().getFullYear()} StockSense AI. All rights reserved.</span>
              <span className="mono">BUILT FOR MARKET INTELLIGENCE</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
