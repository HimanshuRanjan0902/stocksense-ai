
import { useState, useEffect } from "react";
import axios from "axios";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChartCandlestick,
  ChevronRight,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Wallet,
  Menu,
  X,
  LogOut,
  User,
  Building2,
  Sparkles,
  TrendingUp
} from "lucide-react";

import MarketOverview from "./MarketOverview";
import MarketWatch from "./MarketWatch";
import CandlestickChart from "./CandlestickChart";
import Portfolio from "./Portfolio";
import Auth from "./Auth";
import StockDetails from "./StockDetails";
import StockSearch from "./StockSearch";
import LandingPage from "./LandingPage";
import AIAssistant from "./AIAssistant";
import StockHeatmap from "./StockHeatmap";
import PaperTrading from "./PaperTrading";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "market-overview", label: "Market Overview", icon: Activity },
  { id: "stock-heatmap", label: "Stock Heatmap", icon: BarChart3 },
  { id: "stock-details", label: "Stock Details", icon: Building2 },
  { id: "market-watch", label: "Market Watch", icon: BarChart3 },
  { id: "portfolio", label: "My Portfolio", icon: Wallet },
  { id: "paper-trading", label: "Paper Trading", icon: TrendingUp },
  { id: "advanced-charts", label: "Advanced Charts", icon: ChartCandlestick },
  { id: "ai-intelligence", label: "AI Intelligence", icon: BrainCircuit }
];

function App() {
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem("stocksense_token")
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [selectedStock, setSelectedStock] = useState("RELIANCE");

  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [newsMode, setNewsMode] = useState("original");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthSuccess = ({ token, user }) => {
    sessionStorage.setItem("stocksense_token", token);
    setAuthToken(token);
    setCurrentUser(user);
    setShowLandingPage(false);
  };

  useEffect(() => {
    const verifySession = async () => {
      const token = sessionStorage.getItem("stocksense_token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API}/api/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setCurrentUser(response.data.user);
        setAuthToken(token);
        setShowLandingPage(false);
      } catch {
        sessionStorage.removeItem("stocksense_token");
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLogout = async () => {
    const token = sessionStorage.getItem("stocksense_token");

    try {
      if (token) {
        await axios.post(
          `${API}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
    } catch (error) {
      console.error("Logout failed:", error.message);
    } finally {
      sessionStorage.removeItem("stocksense_token");
      setAuthToken(null);
      setCurrentUser(null);
      setNews([]);
      setSearchSymbol("");
      setNewsError("");
      setSelectedStock("RELIANCE");
      setShowLandingPage(true);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const searchStock = (symbol, shouldScroll = true) => {
    const normalizedSymbol = String(symbol || "")
      .trim()
      .toUpperCase();

    if (!normalizedSymbol) return;

    setSelectedStock(normalizedSymbol);
    setSearchSymbol(normalizedSymbol);

    if (shouldScroll) {
      scrollToSection("stock-details");
    }
  };

  const openStockDetails = (symbol) => {
    setNewsMode("original");
    searchStock(symbol, false);
    scrollToSection("stock-details");
  };

  const fetchNews = async (symbol = selectedStock) => {
    const normalizedSymbol = String(symbol || "")
      .trim()
      .toUpperCase();

    if (!normalizedSymbol) return;

    setLoadingNews(true);
    setNewsError("");
    setNews([]);

    try {
      const response = await axios.get(`${API}/api/news`, {
        params: { symbol: normalizedSymbol }
      });

      setNews(response.data?.articles || []);
      setNewsMode("original");
    } catch (error) {
      setNewsError(
        error.response?.data?.message ||
        "Unable to fetch news. Please try again."
      );
    } finally {
      setLoadingNews(false);
    }
  };

  const analyzeNews = async () => {
    setLoadingNews(true);
    setNewsError("");

    try {
      const response = await axios.get(`${API}/api/news/analyze`, {
        params: { symbol: selectedStock }
      });

      setNews(
        response.data?.articles ||
        response.data?.data?.articles ||
        []
      );

      setNewsMode("ai");
    } catch (error) {
      setNewsError(
        error.response?.data?.message ||
        "AI news analysis failed. Please try again."
      );
    } finally {
      setLoadingNews(false);
    }
  };

  const handleStockSearch = (event) => {
    event.preventDefault();

    if (searchSymbol.trim()) {
      searchStock(searchSymbol);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
          <p className="text-sm text-slate-400">
            Loading StockSense AI...
          </p>
        </div>
      </div>
    );
  }

  if (!authToken) {
    if (showLandingPage) {
      return (
   <LandingPage
  onSignIn={() => setShowLandingPage(false)}
  onStartFree={() => setShowLandingPage(false)}
/>
      );
    }

    return (
      <Auth
        onAuthSuccess={handleAuthSuccess}
        onBack={() => setShowLandingPage(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="flex min-h-screen">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0b1120] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                StockSense <span className="text-cyan-400">AI</span>
              </h1>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Market Intelligence
              </p>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
                <User size={20} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser?.name || "StockSense User"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUser?.email || "Welcome back"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Main Menu
            </p>

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? "bg-cyan-400/10 font-semibold text-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">
                Market Intelligence Active
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#070b14]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-sm font-semibold text-white">
                  Welcome back, {currentUser?.name?.split(" ")[0] || "Trader"}
                </p>
                <p className="text-xs text-slate-500">
                  Your Indian market intelligence dashboard
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Market Intelligence Active
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] space-y-12 px-4 py-8 sm:px-6 lg:px-8">

            <section id="dashboard" className="scroll-mt-28 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Market Intelligence
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  Dashboard
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Monitor Indian stock markets and discover market insights.
                </p>
              </div>

              <StockSearch
                searchSymbol={searchSymbol}
                setSearchSymbol={setSearchSymbol}
                onSearch={handleStockSearch}
              />

              <MarketOverview />

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => scrollToSection("stock-heatmap")}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition hover:border-cyan-400/40"
                >
                  <BarChart3 className="mb-3 text-cyan-400" size={25} />
                  <h3 className="font-semibold text-white">Stock Heatmap</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Explore NSE and BSE market gainers and losers.
                  </p>
                </button>

                <button
                  onClick={() => scrollToSection("paper-trading")}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition hover:border-cyan-400/40"
                >
                  <TrendingUp className="mb-3 text-emerald-400" size={25} />
                  <h3 className="font-semibold text-white">Paper Trading</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Practice trading with ₹5,00,000 virtual balance.
                  </p>
                </button>
              </div>
            </section>

            <section id="market-overview" className="scroll-mt-28 space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Market Overview
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Indian market indices and daily performance.
                </p>
              </div>

              <MarketOverview />
            </section>

            <section id="stock-heatmap" className="scroll-mt-28 space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Stock Market Heatmap
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Explore NSE and BSE stock performance.
                </p>
              </div>

              <StockHeatmap onSelectStock={openStockDetails} />
            </section>

            <section id="stock-details" className="scroll-mt-28 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Advanced Analytics
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Stock Details
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Historical prices, 52-week statistics and stock analysis.
                </p>
              </div>

              <StockDetails
                symbol={selectedStock}
                onSymbolChange={searchStock}
              />
            </section>

            <section id="market-watch" className="scroll-mt-28 space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Market Watch
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Track your selected stocks.
                </p>
              </div>

              <MarketWatch
                onSelectStock={openStockDetails}
              />
            </section>

            <section id="portfolio" className="scroll-mt-28 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Real Portfolio Tracking
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  My Portfolio
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Track your actual portfolio separately from virtual trading.
                </p>
              </div>

              <Portfolio token={authToken} />
            </section>

            <section id="paper-trading" className="scroll-mt-28 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Virtual Investment Simulator
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Paper Trading
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Practice NSE and BSE trading with ₹5,00,000 virtual money.
                  No real broker orders.
                </p>
              </div>

              <PaperTrading token={authToken} />
            </section>

            <section id="advanced-charts" className="scroll-mt-28 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Technical Analysis
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Advanced Charts
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Study historical price action and technical indicators.
                </p>
              </div>

              <CandlestickChart symbol={selectedStock} />
            </section>

            <section id="ai-intelligence" className="scroll-mt-28 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Artificial Intelligence
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  AI Intelligence
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Understand stock news and market developments with AI.
                </p>
              </div>

              <AIAssistant token={authToken} />

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      AI News Analysis
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Analyze recent news for {selectedStock}.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fetchNews(selectedStock)}
                      disabled={loadingNews}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                    >
                      Fetch News
                    </button>

                    <button
                      onClick={analyzeNews}
                      disabled={loadingNews}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      Analyze with AI
                    </button>
                  </div>
                </div>

                {loadingNews && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Loading news and analysis...
                  </p>
                )}

                {newsError && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {newsError}
                  </p>
                )}

                {!loadingNews && !newsError && news.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Fetch news to view the latest stock updates.
                  </p>
                )}

                {!loadingNews && news.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Newspaper size={15} />
                      {news.length} articles
                      <span>·</span>
                      {newsMode === "ai" ? "AI analyzed" : "Original news"}
                    </div>

                    {news.map((article, index) => {
                      const analysis = article.analysis || {};

                      return (
                        <article
                          key={article.id || article.link || index}
                          className="rounded-xl border border-white/10 bg-[#070b14] p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-cyan-400">
                              {article.source || "News"}
                            </span>

                            {analysis.sentiment && (
                              <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
                                {analysis.sentiment}
                              </span>
                            )}

                            {analysis.impact && (
                              <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
                                {analysis.impact} Impact
                              </span>
                            )}
                          </div>

                          <h4 className="font-semibold text-white">
                            {article.title || "Untitled news article"}
                          </h4>

                          {article.summary && (
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {article.summary}
                            </p>
                          )}

                          {analysis.summary && (
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                              {analysis.summary}
                            </p>
                          )}

                          {analysis.sentimentReason && (
                            <p className="mt-2 text-sm text-slate-400">
                              Reason: {analysis.sentimentReason}
                            </p>
                          )}

                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                            >
                              Read original article
                              <ChevronRight size={14} />
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <footer className="border-t border-white/10 py-8 text-center">
              <p className="text-xs leading-6 text-slate-500">
                StockSense AI provides informational market analysis only.
                It does not provide investment advice or guarantee market data
                accuracy. Paper Trading is a virtual simulation and does not
                place actual broker orders.
              </p>
              <p className="mt-2 text-xs text-slate-600">
                © {new Date().getFullYear()} StockSense AI
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
