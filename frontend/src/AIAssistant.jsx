import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  ShieldCheck
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const suggestions = [
  "Explain this company in simple English",
  "What are the latest developments?",
  "What are the major risks?",
  "Explain the business model"
];

function AIAssistant({ symbol = "RELIANCE" }) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm StockSense AI. 👋

I can help you understand Indian stocks, market news, company fundamentals and investment risks.

Select a stock and ask me anything!`
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSelectedSymbol(symbol);
  }, [symbol]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

  const sendMessage = async (text = question) => {
    const cleanQuestion = text.trim();

    if (!cleanQuestion || loading) return;

    const token = sessionStorage.getItem("stocksense_token");

    if (!token) {
      setError("Please login to use StockSense AI.");
      return;
    }

    const userMessage = {
      role: "user",
      content: cleanQuestion
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API}/api/ai/assistant`,
        {
          question: cleanQuestion,
          symbol: selectedSymbol
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.data?.success || !response.data?.answer) {
        throw new Error(
          response.data?.message || "Unable to get an AI response"
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
    content: response.data.answer
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/&lt;br\s*\/?&gt;/gi, "\n")
        }
      ]);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong.";

      setError(message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to explore today?"
      }
    ]);
    setError("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#080d18] text-white shadow-2xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Bot size={27} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold sm:text-2xl">
                  StockSense AI
                </h2>
                <Sparkles size={17} className="text-cyan-300" />
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Your intelligent Indian market research assistant
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <RefreshCw size={14} />
            Clear chat
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-400">
            SELECT STOCK
          </label>

          <select
            value={selectedSymbol}
            onChange={(event) => setSelectedSymbol(event.target.value)}
            className="min-w-36 rounded-xl border border-cyan-400/20 bg-[#111b2b] px-4 py-2.5 text-sm font-semibold text-cyan-300 outline-none focus:border-cyan-400"
          >
            {[
              "RELIANCE",
              "TCS",
              "INFY",
              "HDFCBANK",
              "ICICIBANK",
              "SBIN",
              "ITC",
              "TATAMOTORS",
              "BHARTIARTL",
              "WIPRO",
              "LT",
              "BAJFINANCE"
            ].map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>

          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI Assistant
          </span>
        </div>
      </div>

      <div className="border-b border-white/5 px-4 py-5 sm:px-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare size={15} className="text-cyan-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Suggested questions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => sendMessage(item)}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-200 disabled:opacity-40"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[420px] flex-col overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <TrendingUp size={14} className="text-cyan-400" />
          Conversation about {selectedSymbol}
        </div>

        <div className="space-y-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Bot size={19} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "rounded-tr-sm border border-blue-400/20 bg-blue-500/15 text-blue-50"
                    : "rounded-tl-sm border border-white/10 bg-[#111a29] text-slate-200"
                }`}
              >
       <div className="prose prose-invert prose-sm max-w-none break-words prose-headings:text-cyan-300 prose-strong:text-white prose-a:text-cyan-400 prose-li:my-1 prose-p:leading-7">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>
              </div>

              {message.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Bot size={19} />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#111a29] px-4 py-3 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin text-cyan-400" />
                StockSense AI is thinking...
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 bg-[#0b1220] p-4 sm:p-5">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#111b2b] p-2 transition focus-within:border-cyan-400/40">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${selectedSymbol}...`}
            rows={1}
            maxLength={1000}
            disabled={loading}
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
          />

          <button
            onClick={() => sendMessage()}
            disabled={!question.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>Press Enter to send · Shift + Enter for a new line</span>

          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            Educational research only
          </span>
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3 text-center text-[10px] leading-5 text-slate-500">
        AI-generated information may be incomplete or inaccurate. This tool
        does not provide personalized investment advice or buy/sell signals.
      </div>
    </section>
  );
}

export default AIAssistant;
