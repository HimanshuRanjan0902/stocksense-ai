
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
  Search,
  ShieldCheck,
  Wallet,
  Menu,
  X,
  LogOut,
  User,
  Building2
} from "lucide-react";

import MarketOverview from "./MarketOverview";
import MarketWatch from "./MarketWatch";
import CandlestickChart from "./CandlestickChart";
import Portfolio from "./Portfolio";
import Auth from "./Auth";
import StockDetails from "./StockDetails";

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

const popularStocks = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Limited", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" }
];

function App() {
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem("stocksense_token")
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      console.error("Logout request failed:", error.message);
    } finally {
      sessionStorage.removeItem("stocksense_token");
      setAuthToken(null);
      setCurrentUser(null);
      setNews([]);
      setSearchSymbol("");
    }
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const openStockDetails = (symbol) => {
    const stock = String(symbol || "").trim().toUpperCase();

    if (!stock) return;

    setSelectedStock(stock);
    scrollToSection("stock-details");
  };

  const searchStock = async (symbol) => {
    const stock = String(symbol || "").trim().toUpperCase();

    if (!stock) return;

    setSearchSymbol(stock);
    setLoadingNews(true);
    setNewsError("");
    setNews([]);
    setNewsMode("original");

    scrollToSection("ai-intelligence");

    try {
      const response = await axios.get(`${API}/api/news`, {
        params: { symbol: stock }
      });

      const articles = Array.isArray(response.data?.articles)
        ? response.data.articles
        : [];

      setNews(articles);

      if (articles.length === 0) {
        setNewsError(`No recent news found for ${stock}.`);
      }
    } catch (error) {
      setNewsError(
        error.response?.data?.message ||
        "Unable to fetch news. Please check your backend connection."
      );
    } finally {
      setLoadingNews(false);
    }
  };

  const analyzeNews = async () => {
    if (!searchSymbol) return;

    setLoadingNews(true);
    setNewsError("");
    setNewsMode("analysis");

    try {
      const response = await axios.get(`${API}/api/news/analyze`, {
        params: {
          symbol: searchSymbol,
          refresh: true
        }
      });

      const articles = Array.isArray(response.data?.articles)
        ? response.data.articles
        : [];

      setNews(articles);

      if (articles.length === 0) {
        setNewsError("No articles were available for AI analysis.");
      }
    } catch (error) {
      setNewsError(
        error.response?.data?.message ||
        "AI analysis is temporarily unavailable. Please try again later."
      );
    } finally {
      setLoadingNews(false);
    }
  };

  const renderNews = () => (
    <div className="mt-6 space-y-4">
      {news.map((article, index) => {
        const analysis = article.analysis || null;

        return (
          <article
            key={article._id || article.link || article.url || index}
            className="rounded-xl border border-white/10 bg-[#080d18] p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{article.source || "News source"}</span>

              {(article.date || article.publishedAt) && (
                <>
                  <span>·</span>
                  <span>
                    {new Date(
                      article.date || article.publishedAt
                    ).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <h4 className="mt-2 font-semibold leading-6 text-slate-100">
              {article.title || "Untitled news article"}
            </h4>

            {newsMode === "analysis" && analysis && (
              <>
                {analysis.simpleSummary && (
                  <div className="mt-4 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-cyan-400">
                      AI Summary
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      {analysis.simpleSummary}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.sentiment && (
                    <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      Sentiment: {analysis.sentiment}
                    </span>
                  )}

                  {analysis.impact && (
                    <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      Impact: {analysis.impact}
                    </span>
                  )}
                </div>

                {analysis.sentimentReason && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-cyan-400">
                      Sentiment Reason
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {analysis.sentimentReason}
                    </p>
                  </div>
                )}

                {Array.isArray(analysis.keyRisks) &&
                  analysis.keyRisks.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-amber-400">
                        Key Risks
                      </p>

                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-400">
                        {analysis.keyRisks.map((risk, riskIndex) => (
                          <li key={riskIndex}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </>
            )}

            {newsMode === "analysis" && !analysis && (
              <p className="mt-3 text-xs text-amber-400">
                AI analysis is not available for this article.
              </p>
            )}

            {(article.link || article.url) && (
              <a
                href={article.link || article.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
              >
                Read original article
                <ChevronRight size={14} />
              </a>
            )}
          </article>
        );
      })}
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d18]">
        <div className="text-center">
          <Activity
            size={35}
            className="mx-auto mb-4 animate-pulse text-cyan-400"
          />
          <p className="text-sm text-slate-400">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  if (!authToken || !currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-100">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/10 bg-[#0b1220] lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <Activity size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              StockSense<span className="text-cyan-400"> AI</span>
            </h1>
            <p className="text-xs text-slate-500">
              Indian Market Intelligence
            </p>
          </div>
        </div>

        <div className="px-4 py-7">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-cyan-400/10 font-semibold text-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}

                  {active && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-400">
              <ShieldCheck size={18} />
              <span className="text-sm font-semibold">AI Powered</span>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              Understand market news and stock trends with AI-powered insights.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-600">
            StockSense AI · Informational use
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#080d18]/90 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div>
              <h2 className="text-lg font-semibold">Market Dashboard</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Indian stock market intelligence platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                System Online
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <User size={16} className="text-cyan-400" />
              <span className="max-w-28 truncate text-sm text-slate-300">
                {currentUser.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-[#080d18] p-5 pt-24 lg:hidden">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-slate-300 hover:bg-white/5"
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <main className="mx-auto max-w-[1600px] space-y-12 px-4 py-8 sm:px-8">
          <section id="dashboard" className="scroll-mt-28">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101e34] via-[#0d1728] to-[#101827] p-6 sm:p-10">
              <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                  <BrainCircuit size={14} />
                  AI-Powered Market Intelligence
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                  Make sense of the market.
                  <span className="block text-cyan-400">
                    Think beyond the numbers.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Explore Indian stocks, track market movements, understand
                  financial news and discover AI-generated insights in one
                  dashboard.
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    searchStock(searchSymbol);
                  }}
                  className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#080d18]/80 p-2 sm:flex-row"
                >
                  <div className="flex flex-1 items-center gap-3 px-3">
                    <Search size={20} className="shrink-0 text-slate-500" />
                    <input
                      value={searchSymbol}
                      onChange={(event) => setSearchSymbol(event.target.value)}
                      placeholder="Search NSE symbol, e.g. RELIANCE, TCS, INFY"
                      className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!searchSymbol.trim() || loadingNews}
                    className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Analyze Stock
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Popular:</span>

                  {["RELIANCE", "TCS", "INFY", "SBIN"].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => searchStock(symbol)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="market-overview" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <Activity className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">Market Overview</h2>
                <p className="text-xs text-slate-500">
                  NIFTY 50 and SENSEX performance
                </p>
              </div>
            </div>

            <MarketOverview />
          </section>

          <section className="scroll-mt-28">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Popular Stocks</h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a stock to explore its details
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {popularStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => openStockDetails(stock.symbol)}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d1524] p-4 text-left transition hover:border-cyan-400/30 hover:bg-[#111e31]"
                >
                  <div>
                    <p className="font-semibold text-white group-hover:text-cyan-400">
                      {stock.symbol}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {stock.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">
                      {stock.exchange}
                    </span>
                    <ChevronRight size={17} className="text-slate-600 group-hover:text-cyan-400" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section id="stock-details" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <Building2 className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">Stock Details</h2>
                <p className="text-xs text-slate-500">
                  Detailed information about your selected stock
                </p>
              </div>
            </div>

            <StockDetails symbol={selectedStock} />
          </section>

          <section id="market-watch" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">Market Watch</h2>
                <p className="text-xs text-slate-500">
                  Track your selected stocks
                </p>
              </div>
            </div>

          <MarketWatch onSelectStock={openStockDetails} />
          </section>

          <section id="portfolio" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <Wallet className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">My Portfolio</h2>
                <p className="text-xs text-slate-500">
                  Track holdings, invested value and profit or loss
                </p>
              </div>
            </div>

            <Portfolio />
          </section>

          <section id="advanced-charts" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <ChartCandlestick className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">Advanced Charts</h2>
                <p className="text-xs text-slate-500">
                  Candlesticks, volume, moving averages and RSI
                </p>
              </div>
            </div>
<CandlestickChart symbol={selectedStock} />
          </section>

          <section id="ai-intelligence" className="scroll-mt-28">
            <div className="mb-5 flex items-center gap-3">
              <BrainCircuit className="text-cyan-400" size={22} />
              <div>
                <h2 className="text-xl font-bold">AI News Intelligence</h2>
                <p className="text-xs text-slate-500">
                  Understand the latest stock-related news
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1524] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-white">
                    {searchSymbol
                      ? `${searchSymbol} News Analysis`
                      : "Stock News Analysis"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Fetch original news or generate AI-powered analysis.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => searchStock(searchSymbol)}
                    disabled={!searchSymbol.trim() || loadingNews}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
                  >
                    <span className="flex items-center gap-2">
                      <Newspaper size={16} />
                      Fetch News
                    </span>
                  </button>

                  <button
                    onClick={analyzeNews}
                    disabled={!searchSymbol.trim() || loadingNews}
                    className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
                  >
                    <span className="flex items-center gap-2">
                      <BrainCircuit size={16} />
                      AI Analyze
                    </span>
                  </button>
                </div>
              </div>

              {loadingNews && (
                <div className="mt-8 flex items-center justify-center gap-3 py-8 text-sm text-cyan-400">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  {newsMode === "analysis"
                    ? "AI is analyzing stock news..."
                    : "Fetching stock news..."}
                </div>
              )}

              {newsError && !loadingNews && (
                <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-300">
                  {newsError}
                </div>
              )}

              {!loadingNews && news.length === 0 && !newsError && (
                <div className="mt-8 rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <Newspaper size={28} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm text-slate-400">
                    No news loaded yet
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Search a stock symbol above to get started.
                  </p>
                </div>
              )}

              {!loadingNews && news.length > 0 && renderNews()}
            </div>
          </section>

          <footer className="border-t border-white/10 py-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
              <Activity size={17} className="text-cyan-400" />
              StockSense AI
            </div>

            <p className="mx-auto mt-3 max-w-3xl text-xs leading-6 text-slate-600">
              StockSense AI is an informational and educational platform.
              Market data may be delayed or incomplete. AI-generated summaries
              may contain errors. This platform does not provide investment
              advice, buy or sell recommendations, or guaranteed price
              predictions. Always verify information independently.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
