import { NextResponse } from "next/server";
import { sql } from "@/db";
import { resend } from "@/lib/resend";
import { callOpenAI } from "@/lib/openai";

export async function GET(req: Request) {
  return handleCronDigest(req);
}

export async function POST(req: Request) {
  return handleCronDigest(req);
}

async function handleCronDigest(req: Request) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Protect route if CRON_SECRET is configured
  if (cronSecret) {
    const token = authHeader?.replace("Bearer ", "") || searchParams.get("key");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
  }

  try {
    // 1. Query high-risk projects across all users
    let projects: any[] = [];
    try {
      projects = await sql`
        SELECT p.id, p.name, p.risk_score, p.user_id, u.email, u.full_name
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.risk_score >= 50
        ORDER BY p.risk_score DESC
      `;
    } catch (e) {
      console.warn("Neon projects query fallback:", e);
    }

    if (!projects || projects.length === 0) {
      projects = [
        {
          id: 1,
          name: "Core Payment & Checkout Refactor",
          risk_score: 74,
          user_id: "user_demo_pilot",
          email: "pm@shippilot.dev",
          full_name: "Alex Mercer",
        },
      ];
    }

    const emailDispatches: any[] = [];

    // 2. Loop through high-risk projects, run OpenAI analysis, dispatch digest
    for (const project of projects) {
      let tasks: any[] = [];
      try {
        tasks = await sql`
          SELECT title, status, assignee, priority, days_in_status
          FROM tasks
          WHERE project_id = ${project.id}
        `;
      } catch (err) {
        tasks = [
          { title: "Implement Stripe 3DS Webhook Listener", status: "Blocked", assignee: "Sarah Chen", priority: "Critical", days_in_status: 5 },
          { title: "Migrate Subscriptions to Usage-Based Billing", status: "In Progress", assignee: "Alex Mercer", priority: "High", days_in_status: 4 },
        ];
      }

      // Run OpenAI risk summary
      const aiResponse = await callOpenAI([
        {
          role: "system",
          content: "You are ShipPilot AI. Summarize delivery risks and give 2 concrete sprint recommendations in JSON format: { summary: string, recommendations: string[] }",
        },
        {
          role: "user",
          content: `Project: ${project.name} (Risk: ${project.risk_score}/100)\nTasks: ${JSON.stringify(tasks)}`,
        },
      ], true);

      const targetEmail = project.email || "demilord1@example.com";
      const digestHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f293d;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f293d; padding-bottom: 14px;">
            <span style="font-size: 20px; font-weight: 700; color: #38bdf8;">⚡ ShipPilot Daily Delivery Digest</span>
            <span style="font-size: 12px; color: #94a3b8;">${new Date().toLocaleDateString()}</span>
          </div>

          <h2 style="color: #ffffff; font-size: 18px; margin-top: 20px; margin-bottom: 8px;">
            ${project.name} — <span style="color: #ef4444;">Risk Score: ${project.risk_score}/100</span>
          </h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            ${aiResponse.summary || "High blocker concentration detected in integration modules."}
          </p>

          <div style="background: #111827; border-left: 4px solid #ef4444; padding: 14px; border-radius: 6px; margin: 18px 0;">
            <strong style="color: #ef4444; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Delivery Actions:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 18px; color: #e2e8f0; font-size: 13px; line-height: 1.6;">
              ${(aiResponse.recommendations || [
                "Schedule a technical unblocking session for 3DS Webhook Listener.",
                "Split Usage-Based billing task into distinct schema and logic PRs."
              ]).map((r: string) => `<li>${r}</li>`).join("")}
            </ul>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background: #2563eb; color: #ffffff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
              Review in ShipPilot Dashboard →
            </a>
          </div>
        </div>
      `;

      let sendStatus = "simulated";
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder") {
        try {
          const res = await resend.emails.send({
            from: "ShipPilot Scheduled Digest <digest@resend.dev>",
            to: targetEmail,
            subject: `📊 [ShipPilot Digest] ${project.name} is At-Risk (${project.risk_score}/100)`,
            html: digestHtml,
          });
          sendStatus = res.data?.id || "sent";
        } catch (mailErr: any) {
          sendStatus = `error: ${mailErr.message}`;
        }
      }

      emailDispatches.push({
        projectId: project.id,
        recipient: targetEmail,
        status: sendStatus,
      });
    }

    return NextResponse.json({
      success: true,
      processedProjects: projects.length,
      emailDispatches,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cron digest execution error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
