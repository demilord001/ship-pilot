import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "1";

  try {
    const tasks = await sql`
      SELECT id, project_id, title, status, assignee, priority, days_in_status
      FROM tasks
      WHERE project_id = ${Number(projectId)}
      ORDER BY priority DESC, id ASC
    `;

    const project = await sql`
      SELECT id, name, risk_score
      FROM projects
      WHERE id = ${Number(projectId)}
    `;

    const insights = await sql`
      SELECT id, project_id, issue_summary, suggested_action, severity, created_at
      FROM ai_insights
      WHERE project_id = ${Number(projectId)}
      ORDER BY id DESC
      LIMIT 10
    `;

    return NextResponse.json({
      project: project[0] || { id: 1, name: "Core Payment & Checkout Refactor", risk_score: 74 },
      tasks: tasks.length > 0 ? tasks : [
        { id: 1, project_id: 1, title: "Implement Stripe 3DS Webhook Listener", status: "Blocked", assignee: "Sarah Chen", priority: "Critical", days_in_status: 5 },
        { id: 2, project_id: 1, title: "Migrate Subscriptions to Usage-Based Billing", status: "In Progress", assignee: "Alex Mercer", priority: "High", days_in_status: 4 },
        { id: 3, project_id: 1, title: "Refactor Cart Session Redis Caching", status: "In Review", assignee: "David Kim", priority: "Medium", days_in_status: 2 },
        { id: 4, project_id: 1, title: "Update Checkout Error Boundary Fallbacks", status: "Done", assignee: "Sarah Chen", priority: "Low", days_in_status: 1 },
        { id: 5, project_id: 1, title: "Stripe Radar Rule Set Tuning", status: "To Do", assignee: "Marcus Vance", priority: "High", days_in_status: 0 },
      ],
      insights: insights.length > 0 ? insights : [
        {
          id: 1,
          project_id: 1,
          issue_summary: "Stripe 3DS Webhook Listener has been blocked for 5 days. Critical path for Checkout launch is stalling.",
          suggested_action: "Reassign senior integration engineer to unblock webhook verification sandbox; review Stripe TLS certificate configs.",
          severity: "Critical",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          project_id: 1,
          issue_summary: "Usage-Based Billing task is 4 days in progress with no PR update. Risk of sprint scope slippage.",
          suggested_action: "Break billing migration into two incremental sub-deliverables: metering ingest first, rate-limiting second.",
          severity: "High",
          created_at: new Date().toISOString()
        }
      ]
    });
  } catch (e: any) {
    console.warn("Neon fetch error, returning fallback demo state:", e.message);
    return NextResponse.json({
      project: { id: 1, name: "Core Payment & Checkout Refactor", risk_score: 74 },
      tasks: [
        { id: 1, project_id: 1, title: "Implement Stripe 3DS Webhook Listener", status: "Blocked", assignee: "Sarah Chen", priority: "Critical", days_in_status: 5 },
        { id: 2, project_id: 1, title: "Migrate Subscriptions to Usage-Based Billing", status: "In Progress", assignee: "Alex Mercer", priority: "High", days_in_status: 4 },
        { id: 3, project_id: 1, title: "Refactor Cart Session Redis Caching", status: "In Review", assignee: "David Kim", priority: "Medium", days_in_status: 2 },
        { id: 4, project_id: 1, title: "Update Checkout Error Boundary Fallbacks", status: "Done", assignee: "Sarah Chen", priority: "Low", days_in_status: 1 },
        { id: 5, project_id: 1, title: "Stripe Radar Rule Set Tuning", status: "To Do", assignee: "Marcus Vance", priority: "High", days_in_status: 0 },
      ],
      insights: [
        {
          id: 1,
          project_id: 1,
          issue_summary: "Stripe 3DS Webhook Listener has been blocked for 5 days. Critical path for Checkout launch is stalling.",
          suggested_action: "Reassign senior integration engineer to unblock webhook verification sandbox; review Stripe TLS certificate configs.",
          severity: "Critical",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          project_id: 1,
          issue_summary: "Usage-Based Billing task is 4 days in progress with no PR update. Risk of sprint scope slippage.",
          suggested_action: "Break billing migration into two incremental sub-deliverables: metering ingest first, rate-limiting second.",
          severity: "High",
          created_at: new Date().toISOString()
        }
      ]
    });
  }
}

export async function POST(req: Request) {
  try {
    const { title, status = "To Do", assignee = "Unassigned", priority = "Medium", projectId = 1 } = await req.json();
    const result = await sql`
      INSERT INTO tasks (project_id, title, status, assignee, priority, days_in_status)
      VALUES (${projectId}, ${title}, ${status}, ${assignee}, ${priority}, 0)
      RETURNING *
    `;
    return NextResponse.json(result[0] || { success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
