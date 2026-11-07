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
  Sparkles
} from "lucide-react";

import MarketOverview from "./MarketOverview";
import MarketWatch from "./MarketWatch";
import CandlestickChart from "./CandlestickChart";
import Portfolio from "./Portfolio";
import Auth from "./Auth";
import StockDetails from "./StockDetails";
import StockSearch from "./StockSearch";
import LandingPage from "./LandingPage";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "market-overview", label: "Market Overview", icon: Activity },
  { id: "stock-details", label: "Stock Details", icon: Building2 },
  { id: "market-watch", label: "Market Watch", icon: BarChart3 },
  { id: "portfolio", label: "My Portfolio", icon: Wallet },
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
    const normalizedSymbol = String(symbol || "").trim().toUpperCase();

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
    const normalizedSymbol = String(symbol || "").trim().toUpperCase();

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
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-10 w-10 animate-pulse text-cyan-400" />
          <p className="text-sm text-slate-400">
            Loading StockSense AI...
          </p>
        </div>
      </div>
    );
  }

  if (showLandingPage) {
    return (
      <LandingPage
        onSignIn={() => setShowLandingPage(false)}
        onStartFree={() => setShowLandingPage(false)}
      />
    );
  }

  if (!authToken || !currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="flex min-h-screen">
            <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0b1220] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Activity size={23} />
              </div>

              <div>
                <h1 className="text-lg font-bold">
                  StockSense <span className="text-cyan-400">AI</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Market Intelligence
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 lg:hidden"
            >
              <X size={21} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      isActive
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>

                    {isActive && (
                      <ChevronRight className="ml-auto" size={16} />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 to-blue-500/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-cyan-300">
                <ShieldCheck size={18} />
                <span className="text-xs font-semibold">
                  AI Risk Intelligence
                </span>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                Understand market news, sentiment and potential risks with AI.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="mb-4 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-slate-200">
                <User size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#070b14]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs text-slate-500">Welcome back</p>
                <h2 className="text-sm font-semibold sm:text-base">
                  {currentUser.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-300 sm:text-xs">
                Market Intelligence Active
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] space-y-10 px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:px-8">
            <section id="dashboard" className="scroll-mt-28">
              <div className="relative isolate overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#101d35] via-[#0b1220] to-[#07101e] p-6 sm:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative max-w-3xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold tracking-wider text-cyan-300">
                    <Sparkles size={15} />
                    YOUR AI MARKET COMMAND CENTER
                  </div>

                  <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                    Welcome back,
                    <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {currentUser.name}
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                    Go beyond market numbers. Explore Indian stocks,
                    understand financial news and discover market insights
                    powered by artificial intelligence.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => scrollToSection("stock-details")}
                      className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-1 hover:shadow-cyan-500/25"
                    >
                      Explore Stocks
                      <ChevronRight size={18} />
                    </button>

                    <button
                      onClick={() => scrollToSection("ai-intelligence")}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:bg-white/10"
                    >
                      <BrainCircuit size={18} className="text-cyan-300" />
                      Explore AI Intelligence
                    </button>
                  </div>
                </div>

                <div className="relative mt-12 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Market Overview",
                      description: "Explore NIFTY 50 and SENSEX performance.",
                      icon: Activity,
                      section: "market-overview"
                    },
                    {
                      title: "My Watchlist",
                      description: "Keep your favourite stocks close.",
                      icon: ChartCandlestick,
                      section: "market-watch"
                    },
                    {
                      title: "AI Intelligence",
                      description: "Understand sentiment and financial news.",
                      icon: BrainCircuit,
                      section: "ai-intelligence"
                    }
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.section}
                        onClick={() => scrollToSection(item.section)}
                        className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
                      >
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-110">
                          <Icon size={21} />
                        </div>

                        <h3 className="font-bold text-white">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {item.description}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-300">
                          Explore
                          <ChevronRight size={15} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div id="market-overview" className="mt-8 scroll-mt-28">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Market snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Indian Markets
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Latest available market index information
                  </p>
                </div>

                <MarketOverview />
              </div>
            </section>  
                        <section id="stock-details" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Stock Details</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Search and explore individual stocks
                </p>
              </div>

              <form
                onSubmit={handleStockSearch}
                className="mb-6 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={searchSymbol}
                  onChange={(event) => setSearchSymbol(event.target.value)}
                  placeholder="Enter stock symbol, e.g. RELIANCE"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Search Stock
                </button>
              </form>

              <StockDetails symbol={selectedStock} />
            </section>

            <section id="market-watch" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Market Watch</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your personal stock watchlist
                </p>
              </div>

              <MarketWatch onSelectStock={openStockDetails} />
            </section>

            <section id="portfolio" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-xl font-bold">My Portfolio</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Track your personal holdings
                </p>
              </div>

              <Portfolio />
            </section>

            <section id="advanced-charts" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Advanced Charts</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Technical charts and market indicators
                </p>
              </div>

              <StockSearch
                onSelectStock={(symbol) => openStockDetails(symbol)}
              />

              <div className="mt-6">
                <CandlestickChart symbol={selectedStock} />
              </div>
            </section>

            <section id="ai-intelligence" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-xl font-bold">AI News Intelligence</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Understand stock-related news with AI
                </p>
              </div>

              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  onClick={() => fetchNews()}
                  disabled={loadingNews}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Newspaper className="mr-2 inline" size={16} />
                  Fetch Latest News
                </button>

                <button
                  onClick={analyzeNews}
                  disabled={loadingNews}
                  className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  <BrainCircuit className="mr-2 inline" size={16} />
                  Analyze with AI
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                <span>Selected stock:</span>
                <span className="rounded-md bg-white/5 px-2 py-1 font-semibold text-cyan-300">
                  {selectedStock}
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  {newsMode === "ai" ? "AI analyzed news" : "Original news"}
                </span>
              </div>

              {loadingNews && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
                  <Activity className="mx-auto mb-3 animate-pulse text-cyan-400" />
                  Loading news...
                </div>
              )}

              {newsError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                  {newsError}
                </div>
              )}

              {!loadingNews && !newsError && news.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <Newspaper className="mx-auto mb-3 text-slate-500" size={28} />
                  <p className="text-sm text-slate-300">
                    No news loaded yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fetch latest news or run AI analysis.
                  </p>
                </div>
              )}

              {!loadingNews && news.length > 0 && (
                <div className="space-y-4">
                  {news.map((article, index) => {
                    const analysis = article.analysis || {};
                    const sentiment =
                      analysis.sentiment ||
                      article.sentiment ||
                      article.originalSentiment ||
                      "Neutral";

                    return (
                      <article
                        key={article.id || article.link || index}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-cyan-300">
                            {article.source || article.publisher || "Market News"}
                          </span>

                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                            {sentiment}
                          </span>
                        </div>

                        <h3 className="font-semibold leading-6 text-white">
                          {article.title || "Untitled news article"}
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {analysis.summary ||
                            article.summary ||
                            article.description ||
                            "No summary available."}
                        </p>

                        {analysis.reason && (
                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            AI reasoning: {analysis.reason}
                          </p>
                        )}

                        {Array.isArray(analysis.risks) &&
                          analysis.risks.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold text-amber-300">
                                Key risks
                              </p>

                              <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                                {analysis.risks.map((risk, riskIndex) => (
                                  <li key={riskIndex}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {article.link && (
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-cyan-300 hover:text-cyan-200"
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
            </section>

            <footer className="border-t border-white/10 py-6 text-center">
              <p className="text-xs leading-5 text-slate-500">
                StockSense AI provides informational market analysis only.
                It does not provide investment advice or guarantee market data
                accuracy. Verify information independently before making
                financial decisions.
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