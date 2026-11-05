import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  ensureUser,
  getCommunityFeed,
  createCommunityPost,
} from "@/lib/db";

export async function GET() {
  try {
    const feed = await getCommunityFeed();
    return NextResponse.json({
      success: true,
      ...feed,
    });
  } catch (error: any) {
    console.error("[/api/community/posts GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch community feed", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, content, postType } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
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
      (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Developer");

    await ensureUser({ id: userId, email: userEmail, fullName });

    const newPost = await createCommunityPost({
      userId,
      title: title.trim(),
      content: content.trim(),
      postType: postType === "idea" ? "idea" : "showcase",
    });

    return NextResponse.json({
      success: true,
      post: {
        ...newPost,
        author_name: fullName,
        author_email: userEmail,
        comments_count: 0,
      },
    });
  } catch (error: any) {
    console.error("[/api/community/posts POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish community post", details: error.message },
      { status: 500 }
    );
  }
}
