import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldAlert,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Share2,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { getProjectById, getDailyLogs, getProjectTasks } from "@/lib/db";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PublicProjectStatusPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const logs = await getDailyLogs(Number(project.id));
  const tasks = await getProjectTasks(Number(project.id));

  const riskScore = project.risk_score ?? 15;
  const healthStatus: "Healthy" | "At Risk" | "Critical" =
    riskScore <= 35 ? "Healthy" : riskScore <= 70 ? "At Risk" : "Critical";

  const latestLog = logs && logs.length > 0 ? logs[0] : null;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a13]/85 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20 text-sm">
                ⚡
              </div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                ShipPilot Client Radar
              </span>
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] sm:max-w-xs">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Project Lead Dashboard</span>
            </Link>

            {/* Health Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Project Overview Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0d1424] to-[#070a13] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Stakeholder Status Page</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {project.name}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {project.description || "Active software delivery milestone managed with ShipPilot autonomous tracking."}
              </p>
            </div>

            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-md"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>

          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            {/* Metric 1: Health Index */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block">Overall Health Status</span>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-xl font-bold ${
                    healthStatus === "Healthy"
                      ? "text-emerald-400"
                      : healthStatus === "At Risk"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {healthStatus}
                </span>
                <span className="text-xs text-slate-500 font-mono">({riskScore}/100 Risk)</span>
              </div>
            </div>

            {/* Metric 2: Progress Completion */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block">Sprint Completion</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold text-sky-400">{project.progress_pct ?? 0}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden ml-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                    style={{ width: `${project.progress_pct ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metric 3: Active Task Volume */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block">Delivery Tasks Monitored</span>
              <span className="text-xl font-bold text-slate-100 mt-1 block">
                {tasks.length} Work Items
              </span>
            </div>
          </div>
        </div>

        {/* AI Progress Summary Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-950/30 via-[#0d172e] to-indigo-950/30 border border-sky-500/30 shadow-xl">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Client-Ready AI Delivery Digest</h2>
              <span className="text-[11px] text-sky-300">Synthesized via Groq LLaMA 3.3 Autonomous Radar</span>
            </div>
          </div>

          <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {latestLog
                ? latestLog.ai_summary
                : "Active sprint telemetry is healthy. All ongoing development tasks are tracking on schedule with no critical blocking dependencies flagged."}
            </p>
          </div>
        </section>

        {/* Active Work Items Snapshot */}
        {tasks.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-[#0c1220]/90 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Deliverables & Milestone Tasks</h3>
              </div>
              <span className="text-xs text-slate-400">Real-time status</span>
            </div>

            <div className="mt-4 divide-y divide-slate-800/50">
              {tasks.map((task, idx) => (
                <div key={task.id || idx} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">{task.title}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Assignee: {task.assignee || "Engineering Team"} • Priority: {task.priority}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${
                      task.status === "Done"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : task.status === "Blocked"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chronological Daily Log Timeline */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0c1220]/90 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Daily Progress Log Timeline</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{logs.length} updates recorded</span>
          </div>

          <div className="mt-6 space-y-6">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No public logs published yet for this project.
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={log.id} className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 pb-2">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500" />

                  <div className="text-xs text-slate-400 flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-slate-300">
                      {new Date(log.created_at).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {log.ai_summary}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 pb-12 text-xs text-slate-500 border-t border-slate-900">
          <p>
            Powered by <strong>ShipPilot</strong> — AI-Powered Project Delivery Manager & Developer Community SaaS.
          </p>
        </footer>
      </main>
    </div>
  );
}
