import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  ensureUser,
  getProjects,
  createProject,
  getDailyLogs,
  getProjectTasks,
} from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let user;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    const userId = user?.id || "user_demo_1";
    const projects = await getProjects(userId);

    const activeProjectId = projectId ? Number(projectId) : (projects[0]?.id || 1);
    const logs = await getDailyLogs(activeProjectId);
    const tasks = await getProjectTasks(activeProjectId);

    return NextResponse.json({
      success: true,
      projects,
      activeProject: projects.find((p: any) => p.id === activeProjectId) || projects[0],
      logs,
      tasks,
    });
  } catch (error: any) {
    console.error("[/api/projects GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, description, githubUrl, isPublic } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await currentUser();
    } catch {
      user = null;
    }

    const userId = user?.id || "user_demo_1";
    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "lead@shippilot.dev";
    const fullName =
      user?.fullName ||
      (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Project Lead");

    await ensureUser({ id: userId, email: userEmail, fullName });

    const newProject = await createProject({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      githubUrl: githubUrl?.trim() || null,
      isPublic: Boolean(isPublic),
    });

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error: any) {
    console.error("[/api/projects POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: error.message },
      { status: 500 }
    );
  }
}
