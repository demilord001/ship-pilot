import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  ensureUser,
  getProjectById,
  getDailyLogs,
  getProjectTasks,
  saveDailyLog,
} from "@/lib/db";
import { analyzeProjectRiskWithGroq, TaskItem } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, rawInput, tasksOverride } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: "rawInput is required to log progress" },
        { status: 400 }
      );
    }

    // Attempt to get authenticated user from Clerk, fallback to demo user
    let user;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    const userId = user?.id || "user_demo_1";
    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "lead@shippilot.dev";
    const fullName =
      user?.fullName ||
      (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Project Lead");

    // Ensure user exists in database
    await ensureUser({ id: userId, email: userEmail, fullName });

    // Fetch project
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch project tasks and previous logs to calculate log velocity
    const existingTasks: TaskItem[] =
      Array.isArray(tasksOverride) && tasksOverride.length > 0
        ? tasksOverride
        : await getProjectTasks(Number(projectId));

    const pastLogs = await getDailyLogs(Number(projectId));
    let daysSinceLastLog = 0;
    if (pastLogs && pastLogs.length > 0) {
      const lastLogDate = new Date(pastLogs[0].created_at);
      const diffMs = Date.now() - lastLogDate.getTime();
      daysSinceLastLog = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      daysSinceLastLog = 1;
    }

    // Invoke Groq AI (llama-3.3-70b-versatile) for dynamic risk score & summary
    const aiResult = await analyzeProjectRiskWithGroq({
      projectName: project.name,
      rawProgressInput: rawInput.trim(),
      tasks: existingTasks,
      daysSinceLastLog,
      currentProgressPct: project.progress_pct ?? 0,
    });

    // Save daily log & update project in Neon DB
    const savedLog = await saveDailyLog({
      projectId: Number(projectId),
      userId,
      rawInput: rawInput.trim(),
      aiSummary: aiResult.ai_summary,
      riskScore: aiResult.risk_score,
      progressPct: aiResult.progress_pct,
    });

    return NextResponse.json({
      success: true,
      log: savedLog,
      aiAnalysis: {
        risk_score: aiResult.risk_score,
        health_status: aiResult.health_status,
        bottlenecks: aiResult.bottlenecks,
        mitigation_steps: aiResult.mitigation_steps,
        ai_summary: aiResult.ai_summary,
        progress_pct: aiResult.progress_pct,
      },
      project: {
        ...project,
        risk_score: aiResult.risk_score,
        progress_pct: aiResult.progress_pct,
      },
    });
  } catch (error: any) {
    console.error("[/api/projects/log-progress] Error:", error);
    return NextResponse.json(
      { error: "Failed to process daily log", details: error.message },
      { status: 500 }
    );
  }
}
