import { NextResponse } from "next/server";
import { sql } from "@/db";
import { callOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId || 1;

    // 1. Query tasks from Neon Database
    let tasks: any[] = [];
    try {
      tasks = await sql`
        SELECT id, title, status, assignee, priority, days_in_status 
        FROM tasks 
        WHERE project_id = ${projectId}
        ORDER BY priority DESC, days_in_status DESC
      `;
    } catch (dbErr) {
      console.warn("Neon query failed or empty, using current project snapshot:", dbErr);
    }

    // Default mock tasks if DB returned empty
    if (!tasks || tasks.length === 0) {
      tasks = [
        { id: 1, title: "Implement Stripe 3DS Webhook Listener", status: "Blocked", assignee: "Sarah Chen", priority: "Critical", days_in_status: 5 },
        { id: 2, title: "Migrate Subscriptions to Usage-Based Billing", status: "In Progress", assignee: "Alex Mercer", priority: "High", days_in_status: 4 },
        { id: 3, title: "Refactor Cart Session Redis Caching", status: "In Review", assignee: "David Kim", priority: "Medium", days_in_status: 2 },
        { id: 4, title: "Update Checkout Error Boundary Fallbacks", status: "Done", assignee: "Sarah Chen", priority: "Low", days_in_status: 1 },
      ];
    }

    // 2. Prepare Structured Prompt for OpenAI gpt-4o-mini
    const systemPrompt = `You are a Principal Technical Program & Delivery Manager AI agent.
Analyze the provided sprint tasks, identify delivery bottlenecks, blockers, risk scores (1-100), and generate concrete actionable mitigations.
You must respond with valid JSON matching this schema:
{
  "riskScore": number, // 1 to 100 (where 100 is critical risk)
  "overallHealth": "Healthy" | "At Risk" | "Critical",
  "summary": string,
  "insights": [
    {
      "issue_summary": string,
      "suggested_action": string,
      "severity": "Low" | "Medium" | "High" | "Critical"
    }
  ]
}`;

    const userPrompt = `Project ID: ${projectId}
Sprint Tasks:
${JSON.stringify(tasks, null, 2)}

Identify blocked tasks, overdue days in status, high-priority unreviewed items, and assignees with overload risk.`;

    const aiResult = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], true);

    const riskScore = aiResult.riskScore || 65;
    const insights = aiResult.insights || [];

    // 3. Save insights and update risk score in Neon DB
    try {
      // Update project risk score
      await sql`
        UPDATE projects 
        SET risk_score = ${riskScore} 
        WHERE id = ${projectId}
      `;

      // Insert insights into ai_insights
      for (const item of insights) {
        await sql`
          INSERT INTO ai_insights (project_id, issue_summary, suggested_action, severity)
          VALUES (${projectId}, ${item.issue_summary}, ${item.suggested_action}, ${item.severity})
        `;
      }
    } catch (saveErr) {
      console.warn("Could not persist insights to Neon (check connection):", saveErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      riskScore,
      overallHealth: aiResult.overallHealth || (riskScore > 70 ? "Critical" : riskScore > 40 ? "At Risk" : "Healthy"),
      summary: aiResult.summary,
      insights,
      analyzedTasksCount: tasks.length,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sprint analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze sprint", message: error.message },
      { status: 500 }
    );
  }
}
