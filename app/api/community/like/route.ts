import { NextResponse } from "next/server";
import { likeCommunityPost } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const likesCount = await likeCommunityPost(Number(postId));

    return NextResponse.json({
      success: true,
      postId: Number(postId),
      likesCount,
    });
  } catch (error: any) {
    console.error("[/api/community/like] Error:", error);
    return NextResponse.json(
      { error: "Failed to like post", details: error.message },
      { status: 500 }
    );
  }
}
