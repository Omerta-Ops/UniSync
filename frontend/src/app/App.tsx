import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginModal } from "./components/LoginModal";
import { SignUpModal } from "./components/SignUpModal";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { AnimatedBorder } from "./components/AnimatedBorder";
import { useAuthStore } from "../store/authStore";
import {
  Mail,
  Shield,
  Sparkles,
  CalendarDays,
  Zap,
  Lock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleSwitchToSignUp = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpOpen(false);
    setIsForgotPasswordOpen(false);
    setIsLoginOpen(true);
  };

  const handleForgotPassword = () => {
    setIsLoginOpen(false);
    setIsForgotPasswordOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
    navigate("/dashboard");
  };

  const features = [
    {
      icon: Mail,
      title: "Unified Inbox",
      description:
        "Connect Gmail & Outlook in one place. No more tab switching — every email at your fingertips.",
      gradient: "from-cyan-400 to-blue-500",
    },
    {
      icon: Sparkles,
      title: "AI Summaries",
      description:
        "Get 3-bullet summaries of every email instantly. Know what matters without reading walls of text.",
      gradient: "from-violet-400 to-purple-500",
    },
    {
      icon: Shield,
      title: "Phishing Detection",
      description:
        "AI-powered security analysis flags suspicious emails — SPF, DKIM, DMARC checks included.",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: CalendarDays,
      title: "Smart Calendar",
      description:
        "AI extracts dates, meetings, and deadlines from emails and suggests calendar events.",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: Zap,
      title: "Real-Time Sync",
      description:
        "Webhooks keep your inbox live. New emails appear instantly — no refresh needed.",
      gradient: "from-pink-400 to-rose-500",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description:
        "Fernet-encrypted OAuth tokens, rate limiting, circuit breakers, and full RLS protection.",
      gradient: "from-blue-400 to-indigo-500",
    },
  ];

  return (
    <div
      className="size-full overflow-auto bg-gradient-to-br from-black via-gray-900 to-black relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Animated Border */}
      <AnimatedBorder />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/70 font-medium">
              AI-Powered Email Intelligence
            </span>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Uni
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              sync
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/60 max-w-xl mx-auto leading-relaxed">
            Your emails. Summarized, secured, and synced —{" "}
            <span className="text-white/90 font-medium">all in one place.</span>
          </p>

          {/* Description */}
          <p className="text-sm md:text-base text-white/40 max-w-lg mx-auto">
            Connect your Gmail &amp; Outlook accounts. Get AI-powered
            summaries, phishing detection, and smart calendar suggestions —
            without ever switching tabs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => setIsSignUpOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            </button>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-8 py-4 border border-white/20 text-white/80 font-semibold rounded-2xl hover:bg-white/5 hover:border-white/30 transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-8">
            {[
              { value: "3s", label: "Email summaries" },
              { value: "99.9%", label: "Phishing accuracy" },
              { value: "0", label: "Data sold" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <ChevronDown size={24} className="text-white/30" />
        </div>
      </section>

      {/* ─── FEATURES SECTION ────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Everything you need.{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Nothing you don't.
              </span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Built for people who get too many emails and not enough time.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <feature.icon size={22} className="text-white" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                3 steps
              </span>
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up in seconds with just your email and password.",
              },
              {
                step: "02",
                title: "Link your email accounts",
                desc: "Connect Gmail, Outlook, or both via secure OAuth. Your credentials are never stored.",
              },
              {
                step: "03",
                title: "Let AI do the work",
                desc: "Emails are summarized, scanned for threats, and calendar events are suggested — automatically.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-6 group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to take control of your inbox?
          </h2>
          <p className="text-white/50">
            No credit card required. Free while in beta.
          </p>
          <button
            onClick={() => setIsSignUpOpen(true)}
            className="group px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/40">
            © 2026 Unisync. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <span className="hover:text-white/60 cursor-pointer transition-colors">
              Privacy
            </span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">
              Terms
            </span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">
              Contact
            </span>
          </div>
        </div>
      </footer>

      {/* ─── MODALS ──────────────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        onForgotPassword={handleForgotPassword}
        onSuccess={handleAuthSuccess}
      />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
        onSuccess={handleAuthSuccess}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onBackToLogin={handleSwitchToLogin}
      />
    </div>
  );
}
