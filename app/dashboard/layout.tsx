import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  return <>{children}</>;
}
