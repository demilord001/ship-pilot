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
  Plus,
  Share2,
  Globe,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  X,
  FileText,
  UserCheck,
  UserX,
} from "lucide-react";
import { TaskItem } from "@/lib/groq";

interface Project {
  id: number;
  name: string;
  description: string | null;
  github_url: string | null;
  is_public: boolean;
  share_token: string;
  risk_score: number;
  progress_pct: number;
  created_at: string;
}

interface DailyLog {
  id: number;
  project_id: number;
  raw_input: string;
  ai_summary: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  // AI & Risk state
  const [riskScore, setRiskScore] = useState<number>(65);
  const [healthStatus, setHealthStatus] = useState<"Healthy" | "At Risk" | "Critical">("At Risk");
  const [bottlenecks, setBottlenecks] = useState<string[]>([
    "Detected 1 stagnant task overdue in status for 5 days: Stripe 3DS Webhook Listener",
    "Critical Unassigned Blocker: Stripe 3DS Webhook Listener has no owner assigned (+25 risk)",
  ]);
  const [mitigations, setMitigations] = useState<string[]>([
    "Assign senior integration engineer immediately to the Stripe 3DS ticket.",
    "Split usage-based billing into discrete PRs to accelerate review velocity.",
  ]);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // Form states
  const [dailyLogInput, setDailyLogInput] = useState<string>("");
  const [newProjectModalOpen, setNewProjectModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectDesc, setNewProjectDesc] = useState<string>("");
  const [newProjectGithub, setNewProjectGithub] = useState<string>("");
  const [newProjectPublic, setNewProjectPublic] = useState<boolean>(true);

  // Email Share Modal
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareRecipientEmail, setShareRecipientEmail] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Load projects and dashboard data
  const loadDashboardData = async (targetProjectId?: number) => {
    setIsLoading(true);
    try {
      const url = targetProjectId ? `/api/projects?projectId=${targetProjectId}` : "/api/projects";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        const current = data.activeProject || data.projects?.[0] || null;
        setActiveProject(current);
        setLogs(data.logs || []);
        setTasks(data.tasks || []);

        if (current) {
          const score = current.risk_score ?? 65;
          setRiskScore(score);
          setHealthStatus(score <= 35 ? "Healthy" : score <= 70 ? "At Risk" : "Critical");
        }
      }
    } catch (err: any) {
      console.error("Dashboard data load failed:", err);
      showToast("Unable to load latest project data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Log Daily Progress form submission (Groq AI processing)
  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyLogInput.trim() || !activeProject) return;

    setIsSubmittingLog(true);
    try {
      const res = await fetch("/api/projects/log-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          rawInput: dailyLogInput.trim(),
          tasksOverride: tasks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDailyLogInput("");
        setLogs((prev) => [data.log, ...prev]);

        if (data.aiAnalysis) {
          setRiskScore(data.aiAnalysis.risk_score);
          setHealthStatus(data.aiAnalysis.health_status);
          if (data.aiAnalysis.bottlenecks?.length) {
            setBottlenecks(data.aiAnalysis.bottlenecks);
          }
          if (data.aiAnalysis.mitigation_steps?.length) {
            setMitigations(data.aiAnalysis.mitigation_steps);
          }
        }

        if (data.project) {
          setActiveProject(data.project);
          setProjects((prev) =>
            prev.map((p) => (p.id === data.project.id ? data.project : p))
          );
        }

        showToast(`Progress logged! AI recalculated Risk Score: ${data.aiAnalysis?.risk_score}/100`);
      } else {
        showToast(data.error || "Failed to log progress", "error");
      }
    } catch (err: any) {
      showToast("Error processing with Groq AI: " + err.message, "error");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Handle Create Project modal submission
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || null,
          githubUrl: newProjectGithub.trim() || null,
          isPublic: newProjectPublic,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setActiveProject(data.project);
        setNewProjectModalOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        setNewProjectGithub("");
        showToast(`Project "${data.project.name}" created successfully!`);
        loadDashboardData(data.project.id);
      } else {
        showToast(data.error || "Could not create project", "error");
      }
    } catch (err: any) {
      showToast("Error creating project: " + err.message, "error");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Handle Share Email via Resend
  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareRecipientEmail.trim() || !activeProject) return;

    setIsSendingEmail(true);
    try {
      const res = await fetch("/api/projects/share-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          email: shareRecipientEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Health report dispatched to ${shareRecipientEmail}`);
        setShareModalOpen(false);
        setShareRecipientEmail("");
      } else {
        showToast(data.error || "Failed to dispatch email", "error");
      }
    } catch (err: any) {
      showToast("Error sending email: " + err.message, "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getPublicPageUrl = () => {
    if (typeof window === "undefined" || !activeProject) return "";
    return `${window.location.origin}/p/${activeProject.share_token || activeProject.id}`;
  };

  const handleCopyLink = () => {
    const url = getPublicPageUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast("Public status URL copied to clipboard!");
    }
  };

  // Metrics
  const stagnantCount = tasks.filter((t) => (t.days_in_status ?? 0) >= 3 && t.status !== "Done").length;
  const unassignedBlockers = tasks.filter(
    (t) =>
      (!t.assignee || t.assignee.trim() === "") &&
      (t.status === "Blocked" || t.priority === "Critical" || t.priority === "High")
  ).length;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/90 border-red-500/40 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a13]/85 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
                  ⚡
                </div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                  ShipPilot
                </span>
              </Link>

              <div className="hidden sm:block h-5 w-[1px] bg-slate-800 mx-1" />

              {/* Project Selector Dropdown */}
              <div className="relative">
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => loadDashboardData(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 pr-8"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Project Button */}
              <button
                onClick={() => setNewProjectModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
                title="Create a new Neon DB project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Project</span>
              </button>
            </div>

            {/* Mobile clerk avatar toggle */}
            <div className="md:hidden flex items-center gap-2">
              <UserButton />
            </div>
          </div>

          {/* Action buttons & Community Link */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/community"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Community Hub</span>
            </Link>

            {/* Share status button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share Status Page</span>
            </button>

            {/* Health status pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                healthStatus === "Healthy"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : healthStatus === "At Risk"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-red-500/15 border-red-500/30 text-red-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  healthStatus === "Healthy"
                    ? "bg-emerald-500"
                    : healthStatus === "At Risk"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
              <span>{healthStatus}</span>
            </div>

            {/* Desktop user button */}
            <div className="hidden md:block pl-1">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Project Header Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0e1628]/80 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                Active Project
              </span>
              {activeProject?.is_public && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" /> Public Radar
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {activeProject?.name || "Loading Project..."}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {activeProject?.description || "No description provided for this project."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeProject?.github_url && (
              <a
                href={activeProject.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Link
              href={`/p/${activeProject?.share_token || activeProject?.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition-colors"
            >
              <span>View Client Status Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dynamic Factual Metric Tiles */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: AI Risk Score */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Dynamic AI Risk Score</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{riskScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
              <span
                className={`ml-auto text-xs px-2 py-0.5 rounded font-semibold ${
                  riskScore >= 71
                    ? "bg-red-500/20 text-red-400"
                    : riskScore >= 36
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {healthStatus}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  riskScore >= 71 ? "bg-red-500" : riskScore >= 36 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Evaluated via Groq LLaMA 3.3</p>
          </div>

          {/* Tile 2: Overall Progress % */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Sprint Delivery Progress</span>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {activeProject?.progress_pct ?? 0}%
              </span>
              <span className="text-xs text-sky-400 font-semibold">Autonomous Target</span>
            </div>
            <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${activeProject?.progress_pct ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Based on verified task completions</p>
          </div>

          {/* Tile 3: Task Stagnation Factor */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Task Stagnation ({`>=`}3d)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stagnantCount}</span>
              <span className="text-xs text-amber-400 font-semibold">
                {stagnantCount > 0 ? `+${stagnantCount * 15} risk impact` : "Healthy velocity"}
              </span>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 truncate">
              {stagnantCount > 0
                ? "Overdue in status without progression"
                : "No stagnant tasks detected"}
            </p>
          </div>

          {/* Tile 4: Unassigned Critical Blockers */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800/80 p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Unassigned Blockers</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{unassignedBlockers}</span>
              <span className="text-xs text-rose-400 font-semibold">
                {unassignedBlockers > 0 ? "+25 risk per ticket" : "All tickets owned"}
              </span>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 truncate">
              {unassignedBlockers > 0
                ? "Critical path tickets lacking owner"
                : "No unassigned blockers"}
            </p>
          </div>
        </section>

        {/* Daily Progress Logger Form */}
        <section className="rounded-2xl bg-gradient-to-b from-[#0d1424] to-[#090e1a] border border-sky-500/20 p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Log Daily Progress</h2>
            <span className="text-xs bg-sky-500/10 border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full">
              Groq LLaMA 3.3 Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Record what your team achieved today. Groq parses raw standup notes into client-ready summaries, updates delivery percentage, and dynamically recalculates the 1-100 risk score.
          </p>

          <form onSubmit={handleLogProgress} className="space-y-4">
            <textarea
              value={dailyLogInput}
              onChange={(e) => setDailyLogInput(e.target.value)}
              placeholder="e.g. Finished the Stripe checkout webhook endpoint and passed idempotency tests. However, 3DS cards are failing in sandbox mode because TLS certificates need verification."
              rows={3}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 text-left">
                Rules applied: Overdue hours (+15) • Unassigned blockers (+25) • Velocity stall (+20)
              </span>
              <button
                type="submit"
                disabled={isSubmittingLog || !dailyLogInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingLog ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing with Groq...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Recalculate Risk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* 2-Column Section: Active Tasks & AI Insights Engine */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Tasks & Real Data Points (7 cols) */}
          <div className="lg:col-span-7 bg-[#0c1220]/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-semibold text-white">Active Tasks & Risk Points</h3>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                    {tasks.length}
                  </span>
                </div>
                <span className="text-xs text-slate-400">Concrete sprint data</span>
              </div>

              {/* Task Items */}
              <div className="mt-4 space-y-3">
                {tasks.map((task, index) => {
                  const isStagnant = (task.days_in_status ?? 0) >= 3 && task.status !== "Done";
                  const isUnassignedBlocker =
                    (!task.assignee || task.assignee.trim() === "") &&
                    (task.status === "Blocked" || task.priority === "Critical");

                  return (
                    <div
                      key={task.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isUnassignedBlocker
                          ? "bg-red-950/20 border-red-500/40"
                          : isStagnant
                          ? "bg-amber-950/15 border-amber-500/30"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              task.status === "Blocked"
                                ? "bg-red-500"
                                : task.status === "In Progress"
                                ? "bg-sky-400"
                                : task.status === "In Review"
                                ? "bg-purple-400"
                                : "bg-emerald-400"
                            }`}
                          />
                          <div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-200">
                              {task.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{task.days_in_status || 0}d in status</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {task.assignee ? (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                    <span>{task.assignee}</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3 text-red-400" />
                                    <span className="text-red-400 font-semibold">Unassigned (+25 Risk)</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              task.priority === "Critical"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : task.priority === "High"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              task.status === "Blocked"
                                ? "bg-red-900/40 text-red-300"
                                : task.status === "Done"
                                ? "bg-emerald-900/40 text-emerald-300"
                                : "bg-sky-900/40 text-sky-300"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Neon Postgres tasks table integration</span>
              <span className="text-sky-400 hover:underline cursor-pointer">
                Manage backlog items →
              </span>
            </div>
          </div>

          {/* AI Risk Engine Insights & Mitigations (5 cols) */}
          <div className="lg:col-span-5 bg-[#0c1220]/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-semibold text-white">AI Bottlenecks & Mitigations</h3>
                </div>
                <button
                  onClick={() => handleLogProgress({ preventDefault: () => {} } as any)}
                  disabled={isSubmittingLog}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Run Groq AI Audit"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingLog ? "animate-spin" : ""}`} />
                  <span>Audit</span>
                </button>
              </div>

              {/* Bottlenecks list */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Identified Bottlenecks
                </h4>
                <div className="space-y-2">
                  {bottlenecks.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-red-950/15 border border-red-500/20 text-xs text-slate-300 leading-relaxed"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mitigation steps */}
              <div className="mt-5">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Actionable Mitigations
                </h4>
                <div className="space-y-2">
                  {mitigations.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-sky-950/15 border border-sky-500/20 text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Model: llama-3.3-70b-versatile</span>
              <span className="text-emerald-400 font-medium">✓ Structured Output Validated</span>
            </div>
          </div>
        </section>

        {/* Chronological Daily Logs History */}
        <section className="bg-[#0c1220]/90 rounded-2xl border border-slate-800/80 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Project Progress Timeline</h3>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                {logs.length} entries
              </span>
            </div>
            <span className="text-xs text-slate-400">Persisted in Neon daily_logs table</span>
          </div>

          <div className="mt-6 space-y-4">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No daily logs recorded yet. Use the Log Daily Progress form above to post your first standup!
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-sky-400">
                        AI Client Summary:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(log.created_at).toLocaleDateString()} at{" "}
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {log.ai_summary}
                    </p>
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Developer Raw Note: "{log.raw_input}"
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* MODAL 1: Create Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1628] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setNewProjectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Create New Project</h3>
            <p className="text-xs text-slate-400 mb-5">
              Creates a dedicated project in Neon Postgres with isolated risk logs and client status page.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. NextGen Microservices Migration"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={2}
                  placeholder="Briefly describe the deliverables, tech stack, and milestone goals..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  value={newProjectGithub}
                  onChange={(e) => setNewProjectGithub(e.target.value)}
                  placeholder="https://github.com/organization/repo"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newProjectPublic}
                  onChange={(e) => setNewProjectPublic(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-800 focus:ring-sky-500"
                />
                <label htmlFor="isPublic" className="text-xs text-slate-300 cursor-pointer">
                  Make Project Public in Community Feed
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject || !newProjectName.trim()}
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isCreatingProject ? "Creating in Neon..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Share Status / Resend Email Dispatcher */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1628] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Share Client Status Page</h3>
            <p className="text-xs text-slate-400 mb-5">
              Provide clients and stakeholders real-time visibility into project health and AI-generated progress digests.
            </p>

            {/* Copyable Link */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Public Status URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getPublicPageUrl()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Email Dispatcher via Resend */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Dispatch Email Digest via Resend</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Sends an executive HTML status digest directly to client or stakeholder inbox.
              </p>

              <form onSubmit={handleShareEmail} className="space-y-3">
                <input
                  type="email"
                  required
                  value={shareRecipientEmail}
                  onChange={(e) => setShareRecipientEmail(e.target.value)}
                  placeholder="client@company.com or stakeholder@investor.vc"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isSendingEmail || !shareRecipientEmail.trim()}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Resend Digest...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send HTML Email Report</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
