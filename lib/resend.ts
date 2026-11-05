import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
export const resend = new Resend(apiKey || "re_placeholder");

/**
 * Dispatches an HTML project health digest via Resend to stakeholders / clients.
 */
export async function sendProjectStatusEmail({
  to,
  projectName,
  healthStatus,
  riskScore,
  progressPct,
  aiSummary,
  statusPageUrl,
}: {
  to: string;
  projectName: string;
  healthStatus: "Healthy" | "At Risk" | "Critical";
  riskScore: number;
  progressPct: number;
  aiSummary: string;
  statusPageUrl: string;
}) {
  const statusColor =
    healthStatus === "Healthy" ? "#10b981" : healthStatus === "At Risk" ? "#f59e0b" : "#ef4444";

  const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>ShipPilot Status: ${projectName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; margin: 0;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
        <tr>
          <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #1e293b;">
            <div style="display: inline-block; padding: 6px 12px; background: #0284c7; border-radius: 8px; color: #ffffff; font-weight: bold; font-size: 14px; margin-bottom: 12px;">
              ⚡ ShipPilot Radar
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
              Delivery Status Digest: ${projectName}
            </h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 6px; margin-bottom: 0;">
              Real-time AI autonomous delivery health report.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px 32px;">
            <!-- Metrics Card Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td width="33%" style="padding: 12px; background: #1e293b; border-radius: 8px; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block;">Health</span>
                  <strong style="color: ${statusColor}; font-size: 16px; display: block; margin-top: 4px;">${healthStatus}</strong>
                </td>
                <td width="5%"></td>
                <td width="30%" style="padding: 12px; background: #1e293b; border-radius: 8px; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block;">Risk Score</span>
                  <strong style="color: #ffffff; font-size: 16px; display: block; margin-top: 4px;">${riskScore} / 100</strong>
                </td>
                <td width="5%"></td>
                <td width="30%" style="padding: 12px; background: #1e293b; border-radius: 8px; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block;">Progress</span>
                  <strong style="color: #38bdf8; font-size: 16px; display: block; margin-top: 4px;">${progressPct}%</strong>
                </td>
              </tr>
            </table>

            <!-- AI Summary -->
            <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #38bdf8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                ✨ AI Executive Summary (LLaMA 3.3)
              </h3>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
                ${aiSummary}
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${statusPageUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
                Open Live Client Status Page →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #0b1120; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
            Sent by <strong>ShipPilot</strong> — AI-Powered Autonomous Delivery Management.<br/>
            You received this because you were added as a stakeholder for ${projectName}.
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  if (!apiKey || apiKey.includes("placeholder")) {
    console.log(`[Resend Simulated] Status report email prepared for ${to}. Subject: ShipPilot Status: ${projectName}`);
    return { success: true, simulated: true, id: "sim_" + Math.random().toString(36).substring(2) };
  }

  try {
    const data = await resend.emails.send({
      from: "ShipPilot <onboarding@resend.dev>",
      to: [to],
      subject: `[ShipPilot] ${projectName} — Risk Score: ${riskScore} (${healthStatus})`,
      html: emailHtml,
    });
    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.warn("[Resend] Email dispatch warning:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers an automated email via Resend to the author when someone comments on their post.
 */
export async function sendCommentAlertEmail({
  to,
  authorName,
  commenterName,
  postTitle,
  commentText,
  postUrl,
}: {
  to: string;
  authorName: string;
  commenterName: string;
  postTitle: string;
  commentText: string;
  postUrl: string;
}) {
  const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; margin: 0;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border-radius: 14px; border: 1px solid #1e293b; padding: 24px;">
        <tr>
          <td>
            <div style="color: #38bdf8; font-size: 12px; font-weight: 700; text-transform: uppercase;">ShipPilot Community</div>
            <h2 style="color: #ffffff; font-size: 18px; margin: 8px 0 16px 0;">New Comment on "${postTitle}"</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
              Hi <strong>${authorName}</strong>, <strong>${commenterName}</strong> just joined the conversation on your post:
            </p>
            <div style="background-color: #1e293b; border-left: 4px solid #38bdf8; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #f8fafc; font-style: italic;">
              "${commentText}"
            </div>
            <div style="margin-top: 24px;">
              <a href="${postUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">
                Reply in Community Feed →
              </a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  if (!apiKey || apiKey.includes("placeholder")) {
    console.log(`[Resend Simulated] Comment alert prepared for ${to}: "${commentText}" on "${postTitle}"`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: "ShipPilot Community <onboarding@resend.dev>",
      to: [to],
      subject: `New Comment on your idea: "${postTitle}"`,
      html: emailHtml,
    });
    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.warn("[Resend Alert] Failed to send comment alert:", error);
    return { success: false, error: error.message };
  }
}
