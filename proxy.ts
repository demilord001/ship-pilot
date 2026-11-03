import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicLanding = createRouteMatcher(["/"]);
const isWebhookOrCron = createRouteMatcher(["/api/webhooks(.*)", "/api/cron(.*)"]);

export default isClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      // Exclude webhook and cron routes from session checks
      if (isWebhookOrCron(req)) {
        return NextResponse.next();
      }

      const { userId } = await auth();

      // If logged-in user visits root '/', redirect to /dashboard
      if (userId && isPublicLanding(req)) {
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Protect /dashboard
      if (isProtectedRoute(req)) {
        await auth.protect();
      }

      return NextResponse.next();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
