import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight, Eye, EyeOff, Lock, Mail, User, Globe,
  Smartphone, ArrowLeft
} from "lucide-react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "./firebase";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Auth({ onAuthSuccess, onBack }) {
  const [mode, setMode] = useState("email");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => () => {
    if (verifierRef.current) {
      verifierRef.current.clear();
      verifierRef.current = null;
    }
  }, []);

  const completeFirebaseLogin = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken(true);
    const response = await axios.post(`${API_URL}/api/auth/firebase`, { idToken });
    if (!response.data?.success || !response.data?.token) {
      throw new Error(response.data?.message || "Unable to complete sign-in.");
    }
    onAuthSuccess({ token: response.data.token, user: response.data.user });
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "login" : "register";
      const response = await axios.post(`${API_URL}/api/auth/${endpoint}`, form);
      if (response.data.success) {
        onAuthSuccess({ token: response.data.token, user: response.data.user });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(""); setNotice(""); setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      await completeFirebaseLogin(result.user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Google sign-in failed.");
    } finally { setLoading(false); }
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
        throw new Error("Enter your number with country code, e.g. +919876543210.");
      }
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, { size: "normal" });
        await verifierRef.current.render();
      }
      const result = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, verifierRef.current);
      setConfirmation(result);
      setNotice("OTP sent. Check your phone and enter the verification code.");
    } catch (err) {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
      setError(err.message || "Unable to send OTP.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      if (!confirmation) throw new Error("Please request an OTP first.");
      if (!/^\d{6}$/.test(otp.trim())) throw new Error("Enter the 6-digit OTP.");
      const result = await confirmation.confirm(otp.trim());
      await completeFirebaseLogin(result.user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "OTP verification failed.");
    } finally { setLoading(false); }
  };

  const switchMode = (next) => {
    setMode(next); setError(""); setNotice(""); setConfirmation(null); setOtp("");
    if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -top-32 -left-32" />
      <div className="absolute w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full -bottom-32 -right-32" />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-10">
        {onBack && <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back</button>}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 mb-4"><Activity className="text-blue-400" size={30}/></div>
          <h1 className="text-3xl font-bold tracking-tight">StockSense <span className="text-blue-400">AI</span></h1>
          <p className="text-gray-400 mt-2">Intelligent insights for smarter market research</p>
        </div>
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-blue-950/30">
          <div className="grid grid-cols-3 bg-black/30 rounded-xl p-1 mb-6">
            {[{id:"email",label:"Email"},{id:"google",label:"Google"},{id:"phone",label:"Phone OTP"}].map((item) => <button key={item.id} type="button" onClick={() => switchMode(item.id)} className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${mode === item.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>{item.label}</button>)}
          </div>
          {mode === "email" && <>
            <div className="flex bg-black/30 rounded-xl p-1 mb-6">
              <button type="button" onClick={() => {setIsLogin(true);setError("");}} className={`flex-1 py-3 rounded-lg text-sm font-semibold ${isLogin ? "bg-blue-600 text-white" : "text-gray-400"}`}>Login</button>
              <button type="button" onClick={() => {setIsLogin(false);setError("");}} className={`flex-1 py-3 rounded-lg text-sm font-semibold ${!isLogin ? "bg-blue-600 text-white" : "text-gray-400"}`}>Create Account</button>
            </div>
            <h2 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">{isLogin ? "Sign in to access your market dashboard." : "Join StockSense AI and personalize your market workspace."}</p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type="text" name="name" placeholder="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} minLength={2} maxLength={50} required className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500"/></div>}
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type="email" name="email" placeholder="Email address" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500"/></div>
              <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} minLength={8} required className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-blue-500"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl py-3.5 font-semibold">{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}{!loading && <ArrowRight size={18}/>}</button>
            </form>
          </>}
          {mode === "google" && <div className="text-center py-5"><Globe className="mx-auto text-blue-400 mb-4" size={36}/><h2 className="text-2xl font-bold">Continue with Google</h2><p className="text-gray-400 text-sm mt-2 mb-6">Securely sign in using your Google account.</p><button type="button" disabled={loading} onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-60 rounded-xl py-3.5 font-semibold"><Globe size={19}/>{loading ? "Connecting..." : "Continue with Google"}</button></div>}
          {mode === "phone" && <div className="py-2"><Smartphone className="mx-auto text-blue-400 mb-4" size={34}/><h2 className="text-2xl font-bold text-center">Mobile verification</h2><p className="text-gray-400 text-sm text-center mt-2 mb-6">Use your phone number with country code.</p>{!confirmation ? <form onSubmit={sendOtp} className="space-y-4"><input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+91 9876543210" required className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 px-4 outline-none focus:border-blue-500"/><div ref={recaptchaRef} className="flex justify-center"/><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl py-3.5 font-semibold">{loading ? "Sending OTP..." : "Send OTP"}</button></form> : <form onSubmit={verifyOtp} className="space-y-4"><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="Enter 6-digit OTP" required className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 px-4 text-center tracking-[0.4em] outline-none focus:border-blue-500"/><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl py-3.5 font-semibold">{loading ? "Verifying..." : "Verify OTP & Sign In"}</button><button type="button" onClick={()=>{setConfirmation(null);setOtp("");setNotice("");}} className="w-full text-sm text-slate-400 hover:text-white">Change phone number</button></form>}</div>}
          {error && <p role="alert" className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
          {notice && <p role="status" className="mt-4 text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">{notice}</p>}
          <p className="text-center text-xs text-gray-500 mt-6">Your market research workspace, powered by AI.</p>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">StockSense AI · Independent market intelligence platform</p>
      </motion.div>
    </div>
  );
}
