"use client";

import React, { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ShieldAlert,
  Zap,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  days_in_status: number;
}

interface AIInsight {
  id?: number;
  issue_summary: string;
  suggested_action: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  created_at?: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [riskScore, setRiskScore] = useState<number>(74);
  const [projectName, setProjectName] = useState<string>("Core Payment & Checkout Refactor");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSendingReport, setIsSendingReport] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch initial dashboard data
  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tasks?projectId=1");
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
          setInsights(data.insights || []);
          if (data.project) {
            setRiskScore(data.project.risk_score ?? 74);
            setProjectName(data.project.name ?? "Core Payment & Checkout Refactor");
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Trigger AI Sprint Analysis
  const handleAnalyzeSprint = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRiskScore(data.riskScore);
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
        showToast(`AI Analysis complete! Updated Risk Score: ${data.riskScore}/100`);
      } else {
        showToast(data.error || "Failed to analyze sprint", "error");
      }
    } catch (err: any) {
      showToast("Error connecting to AI engine: " + err.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger On-Demand Email Alert via Resend
  const handleSendReport = async () => {
    setIsSendingReport(true);
    try {
      const targetEmail = user?.primaryEmailAddress?.emailAddress || "demilord1@example.com";
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: 1,
          email: targetEmail,
          recipientName: user?.firstName || "Project Lead",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Report emailed to ${targetEmail} via Resend!`);
      } else {
        showToast(data.error || "Failed to dispatch email", "error");
      }
    } catch (err: any) {
      showToast("Error sending email report: " + err.message, "error");
    } finally {
      setIsSendingReport(false);
    }
  };

  // Derived metrics
  const blockersCount = tasks.filter((t) => t.status === "Blocked" || t.priority === "Critical").length;
  const completedCount = tasks.filter((t) => t.status === "Done").length;
  const sprintVelocity = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 65;

  const getHealthBadge = (score: number) => {
    if (score >= 70) {
      return {
        label: "Critical Risk",
        bg: "bg-red-500/15 border-red-500/30 text-red-400",
        dot: "bg-red-500",
      };
    }
    if (score >= 40) {
      return {
        label: "At Risk",
        bg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
        dot: "bg-amber-500",
      };
    }
    return {
      label: "Healthy",
      bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      dot: "bg-emerald-500",
    };
  };

  const health = getHealthBadge(riskScore);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-red-950/80 border-red-500/50 text-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
                ⚡
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                ShipPilot
              </span>
            </Link>
            <div className="h-5 w-[1px] bg-slate-800" />
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-200">
                Welcome back, {isLoaded ? user?.firstName || "Project Lead" : "Lead"} 👋
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Active Project:</span>
                <span className="text-sky-400 font-medium">{projectName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${health.bg}`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${health.dot}`} />
              <span>{health.label}</span>
            </div>

            {/* Sync / Re-analyze Button */}
            <button
              onClick={handleAnalyzeSprint}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 transition-colors disabled:opacity-50"
              title="Run live OpenAI risk audit on tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-sky-400" : ""}`} />
              <span>{isAnalyzing ? "Auditing..." : "Sync AI Radar"}</span>
            </button>

            {/* Clerk User Button */}
            <div className="pl-1">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Metric 1: Sprint Velocity */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-[#0d1424] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Sprint Velocity</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{sprintVelocity}%</span>
              <span className="text-xs text-emerald-400 font-semibold">+4.2% vs last cycle</span>
            </div>
            <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${sprintVelocity}%` }}
              />
            </div>
          </div>

          {/* Metric 2: AI Risk Score */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-[#0d1424] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>AI Risk Score (1-100)</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{riskScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
              <span
                className={`ml-auto text-xs px-2 py-0.5 rounded font-medium ${
                  riskScore >= 70
                    ? "bg-red-500/20 text-red-400"
                    : riskScore >= 40
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {riskScore >= 70 ? "High Slippage" : "Moderate"}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  riskScore >= 70 ? "bg-red-500" : riskScore >= 40 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Open Blockers Count */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-[#0d1424] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Open Blockers</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{blockersCount}</span>
              <span className="text-xs text-amber-400 font-semibold">Impacting Critical Path</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 truncate">
              {blockersCount > 0
                ? "Immediate escalation recommended"
                : "No active blockers identified"}
            </p>
          </div>
        </section>

        {/* Main Grid: Tasks Table + AI Risk Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Sprint Task Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d1424]/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h2 className="text-base font-semibold text-white">Active Sprint Tasks</h2>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                    {tasks.length}
                  </span>
                </div>
                <span className="text-xs text-slate-400">Auto-prioritized by risk impact</span>
              </div>

              {/* Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 font-medium">
                      <th className="py-3 px-2">Task Name</th>
                      <th className="py-3 px-2">Assignee</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Risk Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {tasks.map((task) => {
                      const isBlocked = task.status === "Blocked";
                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            isBlocked ? "bg-red-950/15" : ""
                          }`}
                        >
                          <td className="py-3.5 px-2">
                            <div className="font-medium text-slate-200">{task.title}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.days_in_status}d in status</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                {task.assignee.charAt(0)}
                              </span>
                              <span>{task.assignee}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-medium inline-block ${
                                task.status === "Blocked"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : task.status === "In Progress"
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                  : task.status === "In Review"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : task.status === "Done"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                task.priority === "Critical"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : task.priority === "High"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : task.priority === "Medium"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {tasks.length} active delivery items</span>
              <span className="text-sky-400 hover:underline cursor-pointer">
                View all in backlog →
              </span>
            </div>
          </div>

          {/* AI Risk Feed (5 cols) */}
          <div className="lg:col-span-5 bg-[#0d1424]/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <h2 className="text-base font-semibold text-white">AI Risk Feed</h2>
                </div>

                {/* Instant Email Alert Button */}
                <button
                  onClick={handleSendReport}
                  disabled={isSendingReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                  title="Dispatch immediate Resend email digest"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingReport ? "animate-pulse" : ""}`} />
                  <span>{isSendingReport ? "Sending..." : "Send Instant Email Alert"}</span>
                </button>
              </div>

              {/* Feed items */}
              <div className="mt-4 space-y-4">
                {insights.map((insight, idx) => {
                  const isCritical = insight.severity === "Critical";
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isCritical
                          ? "bg-red-950/20 border-red-500/40 hover:border-red-500/60"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                            insight.severity === "Critical"
                              ? "bg-red-500/30 text-red-300"
                              : insight.severity === "High"
                              ? "bg-amber-500/30 text-amber-300"
                              : "bg-sky-500/30 text-sky-300"
                          }`}
                        >
                          {insight.severity} Severity
                        </span>
                        <span className="text-[11px] text-slate-500">Autonomous Radar</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 leading-snug">
                        {insight.issue_summary}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-medium text-sky-400 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>Suggested Action:</span>
                        </span>
                        <p className="text-xs text-slate-300 mt-1 pl-4 leading-relaxed">
                          {insight.suggested_action}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Engine: <strong className="text-slate-200">OpenAI gpt-4o-mini</strong>
              </span>
              <button
                onClick={handleAnalyzeSprint}
                disabled={isAnalyzing}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Re-run Full Sprint Audit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
