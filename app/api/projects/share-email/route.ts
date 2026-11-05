import { NextResponse } from "next/server";
import { getProjectById, getDailyLogs } from "@/lib/db";
import { sendProjectStatusEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, email } = body;

    if (!projectId || !email) {
      return NextResponse.json(
        { error: "projectId and email are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const logs = await getDailyLogs(Number(project.id));
    const latestSummary =
      logs && logs.length > 0
        ? logs[0].ai_summary
        : "Autonomous delivery tracking initiated. Project tasks and progress metrics are synchronizing with ShipPilot AI Radar.";

    const riskScore = project.risk_score ?? 15;
    const healthStatus: "Healthy" | "At Risk" | "Critical" =
      riskScore <= 35 ? "Healthy" : riskScore <= 70 ? "At Risk" : "Critical";

    const host =
      process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get("host") ? `http://${req.headers.get("host")}` : "http://localhost:3000");

    const statusPageUrl = `${host}/p/${project.share_token || project.id}`;

    const emailResult = await sendProjectStatusEmail({
      to: email.trim(),
      projectName: project.name,
      healthStatus,
      riskScore,
      progressPct: project.progress_pct ?? 0,
      aiSummary: latestSummary,
      statusPageUrl,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to dispatch email via Resend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Project health digest sent to ${email}`,
      recipient: email,
      statusPageUrl,
      simulated: (emailResult as any).simulated ?? false,
    });
  } catch (error: any) {
    console.error("[/api/projects/share-email] Error:", error);
    return NextResponse.json(
      { error: "Internal server error while sending email", details: error.message },
      { status: 500 }
    );
  }
}
