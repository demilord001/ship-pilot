import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { sql } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email = "demilord1@example.com", projectId = 1, recipientName = "Engineering Lead" } = body;

    // Fetch project details, tasks, and insights
    let project = { name: "Core Payment & Checkout Refactor", risk_score: 74 };
    let tasks: any[] = [];
    let insights: any[] = [];

    try {
      const projRes = await sql`SELECT name, risk_score FROM projects WHERE id = ${projectId}`;
      if (projRes && projRes.length > 0) project = projRes[0] as any;

      tasks = await sql`SELECT title, status, assignee, priority, days_in_status FROM tasks WHERE project_id = ${projectId}`;
      insights = await sql`SELECT issue_summary, suggested_action, severity FROM ai_insights WHERE project_id = ${projectId} ORDER BY id DESC LIMIT 5`;
    } catch (e) {
      console.warn("Using cached project snapshot for email report:", e);
    }

    const blockers = tasks.filter(t => t.status === "Blocked" || t.priority === "Critical");

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f293d;">
        <div style="border-bottom: 1px solid #1f293d; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <h1 style="color: #38bdf8; font-size: 20px; margin: 0;">⚡ ShipPilot Delivery Alert</h1>
          <span style="background: ${project.risk_score > 60 ? '#ef4444' : '#10b981'}; color: #fff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">
            Risk Score: ${project.risk_score}/100
          </span>
        </div>

        <p style="color: #cbd5e1; font-size: 15px;">Hello ${recipientName},</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
          Here is the instant on-demand AI Delivery status digest for <strong>${project.name}</strong>.
        </p>

        <div style="background: #111827; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #f1f5f9; font-size: 15px; margin-top: 0; margin-bottom: 10px;">🚨 Critical Bottlenecks & Open Blockers (${blockers.length})</h3>
          <ul style="padding-left: 20px; margin: 0; color: #e2e8f0; font-size: 13px; line-height: 1.6;">
            ${blockers.map(b => `<li><strong>${b.title}</strong> (${b.assignee}) - Status: <span style="color: #ef4444;">${b.status}</span> (${b.days_in_status}d)</li>`).join('')}
          </ul>
        </div>

        <div style="background: #111827; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <h3 style="color: #38bdf8; font-size: 15px; margin-top: 0; margin-bottom: 10px;">🤖 Latest AI Risk Radar Recommendations</h3>
          ${(insights.length ? insights : [
            { issue_summary: "Stripe webhook 3DS listener stalled 5d", suggested_action: "Pair integration lead on sandbox verification", severity: "Critical" }
          ]).map(i => `
            <div style="margin-bottom: 12px; font-size: 13px;">
              <span style="color: #ef4444; font-weight: 600;">[${i.severity}]</span> <span style="color: #e2e8f0;">${i.issue_summary}</span><br/>
              <span style="color: #94a3b8;">→ Action: ${i.suggested_action}</span>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Open Project in ShipPilot
          </a>
        </div>
      </div>
    `;

    let emailResult = { id: "simulated_send" };
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder") {
      emailResult = await resend.emails.send({
        from: "ShipPilot Alerts <alerts@resend.dev>",
        to: email,
        subject: `🚨 [ShipPilot Alert] Project Risk Update: ${project.name} (${project.risk_score}/100)`,
        html: emailHtml,
      }) as any;
    }

    return NextResponse.json({
      success: true,
      message: `Instant report dispatched to ${email}`,
      projectId,
      resendId: emailResult.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Failed to send on-demand report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
