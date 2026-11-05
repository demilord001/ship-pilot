import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  ensureUser,
  getPostComments,
  addPostComment,
} from "@/lib/db";
import { sendCommentAlertEmail } from "@/lib/resend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const comments = await getPostComments(Number(postId));
    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error("[/api/community/comment GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { postId, commentText } = body;

    if (!postId || !commentText || typeof commentText !== "string" || commentText.trim().length === 0) {
      return NextResponse.json(
        { error: "postId and commentText are required" },
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

    const result = await addPostComment({
      postId: Number(postId),
      userId,
      commentText: commentText.trim(),
    });

    // Automated Resend Notification trigger to post author
    if (result.postAuthorEmail && result.postAuthorEmail !== userEmail) {
      const host =
        process.env.NEXT_PUBLIC_APP_URL ||
        (req.headers.get("host") ? `http://${req.headers.get("host")}` : "http://localhost:3000");

      sendCommentAlertEmail({
        to: result.postAuthorEmail,
        authorName: "Creator",
        commenterName: fullName,
        postTitle: result.postTitle,
        commentText: commentText.trim(),
        postUrl: `${host}/community#post-${postId}`,
      }).catch((emailErr) => {
        console.warn("[Comment Resend Alert] Background send note:", emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...result.comment,
        author_name: fullName,
        author_email: userEmail,
      },
    });
  } catch (error: any) {
    console.error("[/api/community/comment POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to post comment", details: error.message },
      { status: 500 }
    );
  }
}
