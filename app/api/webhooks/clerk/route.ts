import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { sql } from "@/db";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  let payload: any;
  let eventType: string = "";

  // If secret is set, verify cryptographic signature via svix
  if (WEBHOOK_SECRET) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing svix headers", { status: 400 });
    }
    const body = await req.text();
    const wh = new Webhook(WEBHOOK_SECRET);
    try {
      const evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as unknown as WebhookEvent;
      payload = evt.data;
      eventType = evt.type;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error: Invalid signature", { status: 400 });
    }
  } else {
    // Development fallback without secret verification
    const json = await req.json();
    payload = json.data;
    eventType = json.type || "user.created";
  }

  // Handle user.created or session.created
  if (eventType === "user.created" || eventType === "session.created") {
    const userId = payload.id || payload.user_id;
    const email = payload.email_addresses?.[0]?.email_address || payload.email || "user@example.com";
    const firstName = payload.first_name || "";
    const lastName = payload.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Project Lead";

    try {
      // Upsert user into Neon Postgres
      await sql`
        INSERT INTO users (id, email, full_name)
        VALUES (${userId}, ${email}, ${fullName})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name
      `;

      // Trigger Welcome / Login Alert Email via Resend
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f293d;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <span style="font-size: 24px;">🚀</span>
            <span style="font-size: 20px; font-weight: 700; color: #38bdf8;">ShipPilot</span>
          </div>
          <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 12px;">Welcome aboard, ${fullName}!</h2>
          <p style="color: #94a3b8; line-height: 1.6; font-size: 15px;">
            You have successfully connected to <strong>ShipPilot</strong> — your AI-powered Project Delivery Manager.
          </p>
          <div style="background: #111827; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #cbd5e1; font-size: 14px;">
              <strong>Account Identifier:</strong> ${userId}<br/>
              <strong>Email:</strong> ${email}<br/>
              <strong>Status:</strong> Active & Monitored by AI Risk Radar
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">
            Our autonomous risk agent is already scanning for blockers and sprint bottlenecks. Check your dashboard for real-time velocity metrics.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">
            Go to Delivery Dashboard →
          </a>
        </div>
      `;

      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder") {
        await resend.emails.send({
          from: "ShipPilot <onboarding@resend.dev>",
          to: email,
          subject: "🚀 Welcome to ShipPilot - Project Delivery Co-pilot Initialized",
          html: emailHtml,
        });
      }

      return NextResponse.json({ success: true, message: `Processed ${eventType} for ${email}` });
    } catch (dbError: any) {
      console.error("Error processing Clerk webhook:", dbError);
      return NextResponse.json({ error: "Failed to process webhook event", details: dbError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
