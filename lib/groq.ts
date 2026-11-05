export interface TaskItem {
  id?: number;
  title: string;
  status: string; // 'Blocked' | 'In Progress' | 'In Review' | 'Done' | 'To Do'
  assignee: string;
  priority: string; // 'Critical' | 'High' | 'Medium' | 'Low'
  days_in_status?: number;
}

export interface GroqRiskAnalysisResult {
  risk_score: number;
  health_status: "Healthy" | "At Risk" | "Critical";
  bottlenecks: string[];
  mitigation_steps: string[];
  ai_summary: string;
  progress_pct: number;
}

/**
 * Calculates objective baseline risk indicators based on project factual rules:
 * - Task Stagnation / Overdue hours: tasks in status >= 3 days (+15 risk each, max +35)
 * - Unassigned High-Priority Blockers: tasks that are Blocked or Critical with no assignee (+25 risk each)
 * - Progress Log Velocity: days passed without updates (+20 risk if > 2 days)
 */
export function calculateFactualRiskMetrics(
  tasks: TaskItem[],
  daysSinceLastLog: number = 0
) {
  let baselineRisk = 10;
  const factualObservations: string[] = [];

  // Check 1: Task Stagnation (overdue > 3 days)
  const stagnantTasks = tasks.filter(
    (t) => (t.days_in_status ?? 0) >= 3 && t.status !== "Done"
  );
  if (stagnantTasks.length > 0) {
    const riskIncrement = Math.min(stagnantTasks.length * 15, 35);
    baselineRisk += riskIncrement;
    factualObservations.push(
      `Detected ${stagnantTasks.length} stagnant task(s) overdue in status for 3+ days (+${riskIncrement} risk): ${stagnantTasks
        .map((t) => `"${t.title}" (${t.days_in_status}d)`)
        .join(", ")}`
    );
  }

  // Check 2: Unassigned High-Priority Blockers (+25 risk)
  const unassignedBlockers = tasks.filter(
    (t) =>
      (!t.assignee || t.assignee.trim() === "" || t.assignee.toLowerCase() === "unassigned") &&
      (t.status === "Blocked" || t.priority === "Critical" || t.priority === "High")
  );
  if (unassignedBlockers.length > 0) {
    const riskIncrement = Math.min(unassignedBlockers.length * 25, 40);
    baselineRisk += riskIncrement;
    factualObservations.push(
      `Critical Unassigned Blocker detected (+${riskIncrement} risk): ${unassignedBlockers
        .map((t) => `"${t.title}" [${t.priority}]`)
        .join(", ")} has no owner assigned`
    );
  }

  // Check 3: Progress Log Velocity (+20 risk if days without update >= 2)
  if (daysSinceLastLog >= 2) {
    const velocityRisk = Math.min(Math.floor(daysSinceLastLog) * 10, 20);
    baselineRisk += velocityRisk;
    factualObservations.push(
      `Progress Log Velocity stall (+${velocityRisk} risk): ${daysSinceLastLog} day(s) elapsed without recorded team standup or delivery log`
    );
  }

  // Calculate task completion percentage
  const completed = tasks.filter((t) => t.status.toLowerCase() === "done").length;
  const calculatedProgress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 50;

  // Clamp baseline risk between 5 and 95
  const clampedRisk = Math.max(5, Math.min(95, baselineRisk));

  return {
    baselineRisk: clampedRisk,
    factualObservations,
    stagnantCount: stagnantTasks.length,
    unassignedBlockerCount: unassignedBlockers.length,
    calculatedProgress,
  };
}

/**
 * Invokes Groq LLaMA 3.3 model (llama-3.3-70b-versatile or llama3-70b-8192)
 * to evaluate factual inputs and return structured JSON risk assessment.
 */
export async function analyzeProjectRiskWithGroq({
  projectName,
  rawProgressInput,
  tasks,
  daysSinceLastLog = 0,
  currentProgressPct = 0,
}: {
  projectName: string;
  rawProgressInput: string;
  tasks: TaskItem[];
  daysSinceLastLog?: number;
  currentProgressPct?: number;
}): Promise<GroqRiskAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "";
  const factualMetrics = calculateFactualRiskMetrics(tasks, daysSinceLastLog);

  const systemPrompt = `You are ShipPilot's Principal AI Delivery Risk Engine powered by LLaMA 3.3.
You evaluate real-world software engineering sprint logs and task states to dynamically calculate an objective Risk Score (1-100) and actionable mitigations.

CRITICAL RISK CALCULATION RULES:
- Task Stagnation / Overdue in status (+15 risk per stagnant task)
- Unassigned High-Priority Blockers (+25 risk per unassigned blocker)
- Progress Log Velocity / Days passed without daily progress updates (+20 risk if overdue)
- Healthy: 1 to 35
- At Risk: 36 to 70
- Critical: 71 to 100

YOU MUST RETURN VALID STRICT JSON ONLY matching this exact schema:
{
  "risk_score": number, // integer between 1 and 100
  "health_status": "Healthy" | "At Risk" | "Critical",
  "bottlenecks": string[], // array of explicit risk factors identified from the task/log data
  "mitigation_steps": string[], // actionable recommendations for the project manager
  "ai_summary": string, // polished, professional client-ready executive summary of what was accomplished and active roadblocks
  "progress_pct": number // updated overall completion percentage (0-100)
}`;

  const userPrompt = `Project: "${projectName}"
Current Log Velocity: ${daysSinceLastLog} day(s) since last recorded progress.
Current Recorded Progress: ${currentProgressPct}%

Raw Developer Progress Log:
"""
${rawProgressInput || "No manual log submitted. Running automated audit."}
"""

Active Task States (${tasks.length} items):
${JSON.stringify(tasks, null, 2)}

Factual Rule Pre-Calculation:
- Stagnant Tasks Overdue: ${factualMetrics.stagnantCount}
- Unassigned High-Priority Blockers: ${factualMetrics.unassignedBlockerCount}
- Pre-calculated Baseline Risk: ${factualMetrics.baselineRisk} / 100
- Factual Observations: ${JSON.stringify(factualMetrics.factualObservations)}

Evaluate the raw developer notes, synthesize them into a clean client-ready summary, calculate the final risk score (1-100), health_status ('Healthy' | 'At Risk' | 'Critical'), bottlenecks, and mitigation steps.`;

  // Fallback if no API key is provided
  if (!apiKey || apiKey.includes("placeholder")) {
    console.warn("[Groq] No live GROQ_API_KEY detected. Executing deterministic Groq LLaMA 3.3 Risk Simulation.");

    const finalScore = factualMetrics.baselineRisk;
    const healthStatus: "Healthy" | "At Risk" | "Critical" =
      finalScore <= 35 ? "Healthy" : finalScore <= 70 ? "At Risk" : "Critical";

    const bottlenecks =
      factualMetrics.factualObservations.length > 0
        ? factualMetrics.factualObservations
        : ["No critical blockers identified. Work is proceeding according to sprint plan."];

    const mitigations = [
      "Assign senior engineer to critical path blockers to eliminate unowned ticket risk.",
      "Break down tasks stalled for >3 days into sub-tickets to restore team velocity.",
      "Ensure daily standup or progress logs are committed before 18:00 UTC.",
    ];

    const cleanSummary =
      rawProgressInput && rawProgressInput.length > 10
        ? `Team completed key delivery tasks: ${rawProgressInput.slice(0, 180)}${
            rawProgressInput.length > 180 ? "..." : ""
          }. Active risks were evaluated against current sprint milestones.`
        : "Autonomous sprint audit completed. Tasks evaluated against delivery deadlines and assignee distribution.";

    const updatedProgress = Math.max(
      currentProgressPct,
      Math.min(100, factualMetrics.calculatedProgress || currentProgressPct + 5)
    );

    return {
      risk_score: finalScore,
      health_status: healthStatus,
      bottlenecks,
      mitigation_steps: mitigations,
      ai_summary: cleanSummary,
      progress_pct: updatedProgress,
    };
  }

  // Use Groq OpenAI-compatible endpoint with llama-3.3-70b-versatile
  try {
    const isGroqKey = apiKey.startsWith("gsk_") || !apiKey.startsWith("sk-proj-");
    const endpoint = isGroqKey
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = isGroqKey ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Groq AI] API responded with ${response.status}: ${errText}. Using deterministic calculation.`);
      throw new Error(`Groq API Error: ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    // Validate and clamp output fields
    const score = typeof parsed.risk_score === "number" ? Math.max(1, Math.min(100, Math.round(parsed.risk_score))) : factualMetrics.baselineRisk;
    const health_status: "Healthy" | "At Risk" | "Critical" =
      score <= 35 ? "Healthy" : score <= 70 ? "At Risk" : "Critical";

    return {
      risk_score: score,
      health_status,
      bottlenecks: Array.isArray(parsed.bottlenecks) && parsed.bottlenecks.length > 0 ? parsed.bottlenecks : factualMetrics.factualObservations,
      mitigation_steps: Array.isArray(parsed.mitigation_steps) && parsed.mitigation_steps.length > 0 ? parsed.mitigation_steps : [
        "Reassign blocked items immediately to prevent critical path delays.",
        "Hold mid-sprint sync to clarify ambiguous requirements on stagnant items."
      ],
      ai_summary: typeof parsed.ai_summary === "string" && parsed.ai_summary.length > 0
        ? parsed.ai_summary
        : `Progress update recorded for ${projectName}. Risk index assessed at ${score}/100.`,
      progress_pct: typeof parsed.progress_pct === "number" ? Math.max(0, Math.min(100, Math.round(parsed.progress_pct))) : factualMetrics.calculatedProgress,
    };
  } catch (err) {
    console.warn("[Groq AI Engine] Call failed, fallback active:", err);
    const score = factualMetrics.baselineRisk;
    return {
      risk_score: score,
      health_status: score <= 35 ? "Healthy" : score <= 70 ? "At Risk" : "Critical",
      bottlenecks: factualMetrics.factualObservations.length > 0
        ? factualMetrics.factualObservations
        : ["No critical blockers flagged."],
      mitigation_steps: [
        "Review tasks in status for more than 48 hours.",
        "Ensure all critical path issues have an active assignee."
      ],
      ai_summary: rawProgressInput
        ? `Logged progress: ${rawProgressInput.slice(0, 160)}... Dynamic risk metrics evaluated.`
        : "Automated delivery risk review performed.",
      progress_pct: Math.min(100, (currentProgressPct || 40) + 5),
    };
  }
}
