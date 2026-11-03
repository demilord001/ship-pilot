import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ShieldAlert,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  CheckCircle,
  Layers,
  Cpu,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070a12]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
              ⚡
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
              ShipPilot
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Free Tier
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-xs md:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-xs md:text-sm font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="text-xs md:text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="ml-2">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>AI-Powered Autonomous Project Delivery Management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Stop firefighting missed deadlines.{" "}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Ship on schedule with AI.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          ShipPilot monitors active sprints, uncovers blocked critical paths, and predicts delivery
          risks before they cascade. Built with real-time OpenAI analysis, Neon PostgreSQL, and
          automated Resend risk digests.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Start Managing Sprints Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Open My Project Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>

          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 text-sm font-medium transition-all"
          >
            Explore Capabilities ↓
          </a>
        </div>

        {/* Live UI Mock Preview */}
        <div className="mt-16 relative mx-auto rounded-2xl border border-slate-800 bg-[#0d1424]/90 p-4 shadow-2xl backdrop-blur-xl max-w-4xl text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 font-mono ml-2">ShipPilot Radar :: Sprint Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-red-400">Risk Score: 74/100 (Critical)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Detected Blocker</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">Stripe 3DS Webhook Stalled</p>
              <p className="text-[11px] text-red-400 mt-1">5 days in status • High Impact</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">OpenAI Suggested Action</span>
              <p className="text-xs text-slate-200 mt-1 font-medium">
                Split usage billing PR and reassign secondary reviewer to unblock 3DS tests.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Automated Notification</span>
              <p className="text-xs text-emerald-400 font-medium mt-1">
                ✓ Resend Digest queued for Project Manager at 09:00 UTC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white">Engineered for Rapid Delivery</h2>
          <p className="mt-3 text-slate-400 text-sm">
            Everything high-velocity teams need to keep deliverables aligned and stakeholders informed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">AI Sprint Analyzer</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Powered by OpenAI <code className="text-sky-300">gpt-4o-mini</code>. Evaluates task status duration, assignee distribution, and priority bottlenecks with structured JSON insights.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automated Resend Alerts</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Automated welcome onboarding triggers via Clerk webhooks and scheduled daily cron risk digests to project managers via Resend.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Neon Serverless SQL</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              High-throughput Postgres database with native pooling. Fully modeled for multi-tenant users, projects, tasks, and historical AI insights.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 ShipPilot. Built with Next.js, Clerk, Neon, OpenAI, and Resend.</p>
      </footer>
    </div>
  );
}
