
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const response = await axios.post(
        `${API_URL}/api/auth/${endpoint}`,
        form
      );

      if (response.data.success) {
        onAuthSuccess({
          token: response.data.token,
          user: response.data.user
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -top-32 -left-32" />
      <div className="absolute w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full -bottom-32 -right-32" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 mb-4">
            <Activity className="text-blue-400" size={30} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            StockSense <span className="text-blue-400">AI</span>
          </h1>

          <p className="text-gray-400 mt-2">
            Intelligent insights for smarter market research
          </p>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-blue-950/30">
          <div className="flex bg-black/30 rounded-xl p-1 mb-7">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${
                isLogin ? "bg-blue-600 text-white" : "text-gray-400"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${
                !isLogin ? "bg-blue-600 text-white" : "text-gray-400"
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-bold">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>

          <p className="text-gray-400 text-sm mt-2 mb-6">
            {isLogin
              ? "Sign in to access your market dashboard."
              : "Join StockSense AI and personalize your market workspace."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={50}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-blue-500 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl py-3.5 font-semibold transition shadow-lg shadow-blue-600/20"
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Your market research workspace, powered by AI.
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          StockSense AI · Independent market intelligence platform
        </p>
      </motion.div>
    </div>
  );
}
