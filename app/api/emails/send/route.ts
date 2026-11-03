import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing to or subject' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to,
      subject,
      html: html || '<p>Hello from your Next.js Boilerplate!</p>',
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
